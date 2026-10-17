import { useEffect, useMemo, useRef, useState } from 'react'
import { History, MessageSquarePlus, SendHorizontal, Trash2, Sparkles, BookOpen } from 'lucide-react'
import { useApp } from '../AppContext.js'
import { RichText, ScreenHeader, Sheet } from '../components/ui.jsx'
import { DoctorAvatar } from '../components/Illustrations.jsx'
import { SUGGESTED_QUESTIONS, askHealthAI } from '../lib/ai.js'
import { GLUCOSE_CTX, formatDate, relativeDayLabel, todayKey, uid } from '../lib/health.js'

/** Chuẩn hóa dữ liệu chat cũ (mảng tin nhắn) sang dạng danh sách cuộc trò chuyện */
function normalize(chat) {
  if (!Array.isArray(chat)) return []
  if (chat.length && chat[0].role) {
    return [{ id: uid(), title: chat[0].text.slice(0, 60), updatedAt: todayKey(), messages: chat.map((m) => ({ ...m, id: uid() })) }]
  }
  return chat
}

export default function AskAIScreen() {
  const { chat, setChat, back, settings, sortedReadings, profile } = useApp()
  const sessions = useMemo(() => normalize(chat), [chat])
  const [currentId, setCurrentId] = useState(() => sessions[0]?.id || null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const endRef = useRef()
  const current = sessions.find((s) => s.id === currentId)
  const messages = current?.messages || []

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [messages.length, loading])

  const context = useMemo(() => {
    if (!settings.shareReadingsWithAI) return ''
    const r = sortedReadings.slice(0, 5).map((x) => `${formatDate(x.date)} ${x.time}: ${x.sys ? `HA ${x.sys}/${x.dia} mmHg, ` : ''}${x.pulse ? `mạch ${x.pulse} bpm, ` : ''}${x.glucose ? `đường huyết ${x.glucose} mmol/L (${GLUCOSE_CTX[x.glucoseCtx] || 'bất kỳ'}), ` : ''}${x.weight ? `cân nặng ${x.weight} kg` : ''}`).join('\n')
    const age = profile.birthYear ? `Tuổi: ${new Date().getFullYear() - Number(profile.birthYear)}. ` : ''
    const h = profile.heightCm ? `Chiều cao: ${profile.heightCm} cm. ` : ''
    const who = profile.relation ? `Người được hỏi: ${profile.relation}. ` : ''
    return `${who}${age}${h}\nCác chỉ số gần nhất:\n${r}`
  }, [settings.shareReadingsWithAI, sortedReadings, profile])

  async function send(text) {
    const q = (text ?? input).trim()
    if (!q || loading) return
    setInput('')
    const userMsg = { id: uid(), role: 'user', text: q }
    let sid = currentId
    let base = messages
    if (!current) {
      sid = uid()
      base = []
      setCurrentId(sid)
    }
    const nextMsgs = [...base, userMsg]
    const upsert = (msgs) => setChat((old) => {
      const list = normalize(old)
      const exists = list.some((s) => s.id === sid)
      const session = { id: sid, title: (exists ? list.find((s) => s.id === sid).title : q.slice(0, 60)), updatedAt: todayKey(), messages: msgs }
      return exists ? list.map((s) => (s.id === sid ? session : s)) : [session, ...list]
    })
    upsert(nextMsgs)
    setLoading(true)
    const res = await askHealthAI(nextMsgs, context)
    upsert([...nextMsgs, { id: uid(), role: 'assistant', text: res.text, source: res.source }])
    setLoading(false)
  }

  const newChat = () => { setCurrentId(null); setShowHistory(false) }

  return (
    <div className="ask">
      <ScreenHeader title="Hỏi AI sức khỏe" onBack={back}
        right={<button className="btn btn-outline btn-sm" onClick={() => setShowHistory(true)}><History size={16} /> Lịch sử</button>} />

      <section className={`ai-intro ${messages.length ? 'compact' : ''}`}>
        <DoctorAvatar size={messages.length ? 54 : 92} />
        <div className="bubble">
          <strong>Xin chào!</strong>
          <p>Tôi là trợ lý sức khỏe AI. Bạn có thể hỏi tôi về chăm sóc sức khỏe, dinh dưỡng, vận động, sử dụng thuốc…</p>
          {!messages.length && <p className="disclaimer">Lưu ý: Thông tin chỉ mang tính tham khảo, không thay thế khám và tư vấn của bác sĩ.</p>}
        </div>
      </section>

      {!messages.length ? (
        <>
          <div className="section-title"><h2>Gợi ý câu hỏi</h2></div>
          <div className="suggestions">
            {SUGGESTED_QUESTIONS.map((q) => <button key={q} onClick={() => send(q)}>{q}</button>)}
          </div>
        </>
      ) : (
        <div className="messages">
          {messages.map((m) => (
            <div key={m.id} className={`msg ${m.role}`}>
              <div className="msg-bubble"><RichText text={m.text} /></div>
              {m.role === 'assistant' && (
                <span className="msg-source">
                  {m.source === 'ai' ? <><Sparkles size={12} /> Trả lời bởi AI</> : <><BookOpen size={12} /> Thư viện kiến thức ngoại tuyến</>}
                  {' · '}Chỉ mang tính tham khảo
                </span>
              )}
            </div>
          ))}
          {loading && <div className="msg assistant"><div className="msg-bubble typing"><i /><i /><i /></div></div>}
          {!loading && (
            <div className="suggestions inline">
              {SUGGESTED_QUESTIONS.filter((q) => !messages.some((m) => m.text === q)).slice(0, 2).map((q) => <button key={q} onClick={() => send(q)}>{q}</button>)}
            </div>
          )}
          <div ref={endRef} />
        </div>
      )}

      <form className="composer" onSubmit={(e) => { e.preventDefault(); send() }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Nhập câu hỏi của bạn..." maxLength={500} aria-label="Câu hỏi" />
        <button type="submit" className="send-btn" disabled={!input.trim() || loading} aria-label="Gửi"><SendHorizontal size={20} /></button>
      </form>

      {showHistory && (
        <Sheet title="Lịch sử hỏi đáp" onClose={() => setShowHistory(false)}>
          <button className="btn btn-primary btn-block" onClick={newChat}><MessageSquarePlus size={18} /> Cuộc trò chuyện mới</button>
          {sessions.length === 0 ? <p className="hint center">Chưa có cuộc trò chuyện nào.</p> : (
            <div className="session-list">
              {sessions.map((s) => (
                <div key={s.id} className={`session ${s.id === currentId ? 'active' : ''}`}>
                  <button className="session-open" onClick={() => { setCurrentId(s.id); setShowHistory(false) }}>
                    <strong>{s.title}</strong>
                    <span>{relativeDayLabel(s.updatedAt)} · {s.messages.filter((m) => m.role === 'user').length} câu hỏi</span>
                  </button>
                  <button className="icon-btn" aria-label="Xóa cuộc trò chuyện" onClick={() => {
                    setChat((old) => normalize(old).filter((x) => x.id !== s.id))
                    if (s.id === currentId) setCurrentId(null)
                  }}><Trash2 size={17} /></button>
                </div>
              ))}
            </div>
          )}
        </Sheet>
      )}
    </div>
  )
}
