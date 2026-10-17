import { useMemo, useState } from 'react'
import { Check, ChevronLeft, ChevronRight, Clock, Lightbulb, Pause, Pencil, Pill, Play, Plus, Trash2, X } from 'lucide-react'
import { useApp } from '../AppContext.js'
import { Confirm, KebabMenu, ScreenHeader, Segmented, Sheet } from '../components/ui.jsx'
import { MemberSwitcher } from '../components/Members.jsx'
import { addDays, dosesForDay, formatWeekday, todayKey, toTimeStr, uid } from '../lib/health.js'

const TIPS = [
  'Hãy đặt nhắc thuốc đúng giờ và uống thuốc theo hướng dẫn của bác sĩ.',
  'Không tự ý ngừng hoặc đổi liều thuốc khi chưa hỏi ý kiến bác sĩ.',
  'Để thuốc ở nơi dễ thấy, gắn việc uống thuốc với thói quen cố định như sau bữa sáng.',
  'Nếu quên một liều, đừng uống gấp đôi. Hãy xem tờ hướng dẫn hoặc hỏi dược sĩ.',
]

const emptyMed = () => ({ name: '', qty: '1 viên', purpose: '', times: ['08:00'], note: '' })

export default function MedsScreen() {
  const { meds, setMeds, intakes, toggleIntake, back, showToast, activeMember } = useApp()
  const [tab, setTab] = useState('today')
  const [day, setDay] = useState(todayKey())
  const [editor, setEditor] = useState(null) // { mode: 'add'|'edit', data }
  const [toDelete, setToDelete] = useState(null)
  const today = todayKey()
  const isFuture = day > today

  const doses = useMemo(() => dosesForDay(meds, day), [meds, day])
  const taken = intakes[day] || {}
  const takenCount = doses.filter((d) => taken[d.key]).length
  const tip = TIPS[Number(day.slice(8)) % TIPS.length]
  const nowStr = toTimeStr()

  const onTake = (d) => {
    if (isFuture) { showToast('Chưa đến ngày này, bạn chưa thể đánh dấu.', 'info'); return }
    const was = !!taken[d.key]
    toggleIntake(day, d.key)
    if (!was) showToast(`Đã uống ${d.med.name} lúc ${d.time}`)
  }

  const saveMed = (data) => {
    if (editor.mode === 'edit') {
      setMeds((list) => list.map((m) => (m.id === data.id ? { ...m, ...data, sample: false } : m)))
      showToast('Đã cập nhật thuốc.')
    } else {
      setMeds((list) => [...list, { ...data, id: uid(), memberId: activeMember.id, active: true, createdAt: todayKey() }])
      showToast('Đã thêm thuốc vào lịch nhắc.')
    }
    setEditor(null)
  }

  const toggleActive = (m) => {
    setMeds((list) => list.map((x) => (x.id === m.id ? { ...x, active: x.active === false } : x)))
    showToast(m.active === false ? `Đã tiếp tục nhắc ${m.name}.` : `Đã tạm dừng nhắc ${m.name}.`, 'info')
  }

  return (
    <div className="meds">
      <ScreenHeader title="Nhắc thuốc" onBack={back}
        right={<button className="btn btn-primary btn-sm" onClick={() => setEditor({ mode: 'add', data: emptyMed() })}><Plus size={16} /> Thêm thuốc</button>} />

      <div className="member-bar"><MemberSwitcher compact /></div>
      <Segmented options={[['today', 'Hôm nay'], ['all', 'Tất cả thuốc']]} value={tab} onChange={setTab} variant="tabs wide" />

      {tab === 'today' ? (
        <>
          <div className="day-nav">
            <button className="icon-btn" onClick={() => setDay(addDays(day, -1))} aria-label="Ngày trước"><ChevronLeft size={20} /></button>
            <button className="day-label" onClick={() => setDay(today)} title="Về hôm nay">
              <strong>{formatWeekday(day)}</strong>
              {day !== today && <small>Chạm để về hôm nay</small>}
            </button>
            <button className="icon-btn" onClick={() => setDay(addDays(day, 1))} aria-label="Ngày sau"><ChevronRight size={20} /></button>
          </div>

          {doses.length > 0 && (
            <div className="dose-progress">
              <span>Đã uống <strong>{takenCount}/{doses.length}</strong> lần</span>
              <div className="progress"><i style={{ width: `${(takenCount / doses.length) * 100}%` }} /></div>
            </div>
          )}

          {doses.length === 0 ? (
            <div className="empty">
              <Pill size={34} />
              <p>{meds.length ? 'Không có lịch uống thuốc trong ngày này.' : 'Bạn chưa thêm thuốc nào.'}</p>
              <button className="btn btn-primary" onClick={() => setEditor({ mode: 'add', data: emptyMed() })}><Plus size={18} /> Thêm thuốc</button>
            </div>
          ) : (
            <div className="dose-list">
              {doses.map((d) => {
                const done = !!taken[d.key]
                const late = !done && day === today && d.time < nowStr
                return (
                  <article key={d.key} className={`dose ${done ? 'done' : ''}`}>
                    <button className={`checkbox ${done ? 'checked' : ''}`} onClick={() => onTake(d)} aria-label={done ? 'Bỏ đánh dấu' : 'Đánh dấu đã uống'} aria-pressed={done}>
                      {done && <Check size={16} strokeWidth={3} />}
                    </button>
                    <div className="dose-info">
                      <strong>{d.med.name}</strong>
                      <div className="dose-meta">
                        <span><Clock size={14} /> {d.time}</span>
                        {d.med.qty && <span><Pill size={14} /> {d.med.qty}</span>}
                      </div>
                      {d.med.purpose && <span className="dose-purpose">{d.med.purpose}</span>}
                      {late && <span className="chip chip-warn">Quá giờ</span>}
                    </div>
                    <div className="dose-actions">
                      {done
                        ? <button className="btn btn-soft" onClick={() => onTake(d)}>Đã uống</button>
                        : <button className="btn btn-primary" onClick={() => onTake(d)} disabled={isFuture}>Uống</button>}
                      <KebabMenu items={[
                        { label: 'Sửa thuốc', icon: Pencil, onClick: () => setEditor({ mode: 'edit', data: { ...d.med } }) },
                        { label: 'Tạm dừng nhắc', icon: Pause, onClick: () => toggleActive(d.med) },
                        { label: 'Xóa thuốc', icon: Trash2, danger: true, onClick: () => setToDelete(d.med) },
                      ]} />
                    </div>
                  </article>
                )
              })}
            </div>
          )}

          <aside className="tip-card">
            <Lightbulb size={22} />
            <div><strong>Mẹo nhỏ</strong><p>{tip}</p></div>
          </aside>
        </>
      ) : (
        <div className="med-list">
          {meds.length === 0 && <div className="empty"><Pill size={34} /><p>Danh sách thuốc trống.</p></div>}
          {meds.map((m) => (
            <article key={m.id} className={`med-item ${m.active === false ? 'paused' : ''}`}>
              <span className="med-icon"><Pill size={20} /></span>
              <div className="med-info">
                <strong>{m.name}{m.sample && <em className="tag-sample">mẫu</em>}</strong>
                <span>{m.qty} · {m.times.length} lần/ngày{m.purpose ? ` · ${m.purpose}` : ''}</span>
                <div className="time-chips">{m.times.map((t) => <span key={t}>{t}</span>)}</div>
                {m.note && <small>{m.note}</small>}
                {m.active === false && <span className="chip chip-warn">Đang tạm dừng</span>}
              </div>
              <KebabMenu items={[
                { label: 'Sửa', icon: Pencil, onClick: () => setEditor({ mode: 'edit', data: { ...m } }) },
                { label: m.active === false ? 'Tiếp tục nhắc' : 'Tạm dừng nhắc', icon: m.active === false ? Play : Pause, onClick: () => toggleActive(m) },
                { label: 'Xóa', icon: Trash2, danger: true, onClick: () => setToDelete(m) },
              ]} />
            </article>
          ))}
        </div>
      )}

      {editor && <MedEditor initial={editor.data} mode={editor.mode} onSave={saveMed} onClose={() => setEditor(null)} />}
      {toDelete && (
        <Confirm title="Xóa thuốc?" danger confirmText="Xóa"
          message={`${toDelete.name} và lịch nhắc của thuốc này sẽ bị xóa.`}
          onConfirm={() => {
            setMeds((list) => list.filter((m) => m.id !== toDelete.id))
            setToDelete(null); showToast('Đã xóa thuốc.')
          }}
          onCancel={() => setToDelete(null)} />
      )}
    </div>
  )
}

function MedEditor({ initial, mode, onSave, onClose }) {
  const [f, setF] = useState(initial)
  const [err, setErr] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const setTime = (i, v) => setF({ ...f, times: f.times.map((t, j) => (j === i ? v : t)) })

  const submit = (e) => {
    e.preventDefault()
    if (!f.name.trim()) return setErr('Vui lòng nhập tên thuốc.')
    const times = [...new Set(f.times.filter(Boolean))].sort()
    if (!times.length) return setErr('Cần ít nhất một giờ uống.')
    onSave({ ...f, name: f.name.trim(), qty: f.qty.trim(), purpose: f.purpose.trim(), note: f.note.trim(), times })
  }

  return (
    <Sheet title={mode === 'edit' ? 'Sửa thuốc' : 'Thêm thuốc'} onClose={onClose}>
      <form className="stack" onSubmit={submit}>
        <label>Tên thuốc và hàm lượng<input autoFocus value={f.name} onChange={set('name')} placeholder="Ví dụ: Amlodipine 5mg" /></label>
        <div className="row-2">
          <label>Mỗi lần uống<input value={f.qty} onChange={set('qty')} placeholder="1 viên" /></label>
          <label>Dùng cho<input value={f.purpose} onChange={set('purpose')} placeholder="Huyết áp" list="purpose-list" /></label>
          <datalist id="purpose-list">
            {['Huyết áp', 'Tiểu đường', 'Mỡ máu', 'Tim mạch', 'Dạ dày', 'Vitamin', 'Xương khớp'].map((p) => <option key={p} value={p} />)}
          </datalist>
        </div>
        <div>
          <span className="label-text">Giờ uống trong ngày</span>
          <div className="time-editor">
            {f.times.map((t, i) => (
              <div key={i} className="time-row">
                <input type="time" value={t} onChange={(e) => setTime(i, e.target.value)} aria-label={`Giờ uống ${i + 1}`} />
                {f.times.length > 1 && (
                  <button type="button" className="icon-btn" onClick={() => setF({ ...f, times: f.times.filter((_, j) => j !== i) })} aria-label="Bỏ giờ này"><X size={18} /></button>
                )}
              </div>
            ))}
            {f.times.length < 6 && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setF({ ...f, times: [...f.times, '20:00'] })}><Plus size={16} /> Thêm giờ uống</button>
            )}
          </div>
        </div>
        <label>Ghi chú<textarea rows="2" value={f.note} onChange={set('note')} placeholder="Uống sau ăn, theo đơn bác sĩ…" /></label>
        {err && <div className="form-error" role="alert">{err}</div>}
        <p className="hint">Nhập theo đúng đơn thuốc hoặc hướng dẫn của bác sĩ/dược sĩ.</p>
        <button className="btn btn-primary btn-block btn-lg" type="submit">{mode === 'edit' ? 'Lưu thay đổi' : 'Thêm thuốc'}</button>
      </form>
    </Sheet>
  )
}
