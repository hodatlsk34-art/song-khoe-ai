import { useState } from 'react'
import { Check, ChevronDown, Pencil, Plus, Trash2, UserPlus } from 'lucide-react'
import { useApp } from '../AppContext.js'
import { Confirm, Sheet } from './ui.jsx'
import { MEMBER_COLORS, RELATIONS, memberInitial, memberOf, uid } from '../lib/health.js'

export function MemberAvatar({ member, size = 34 }) {
  return (
    <span className="member-avatar" style={{ width: size, height: size, background: member?.color || MEMBER_COLORS[0], fontSize: size * 0.42 }}>
      {memberInitial(member)}
    </span>
  )
}

export const displayName = (m) => m?.name || m?.relation || 'Tôi'

/** Nút chọn thành viên đang xem + bảng chọn */
export function MemberSwitcher({ compact = false }) {
  const { members, activeMember, setActiveMemberId, showToast } = useApp()
  const [open, setOpen] = useState(false)
  const [editor, setEditor] = useState(null)
  return (
    <>
      <button className={`member-pill ${compact ? 'compact' : ''}`} onClick={() => setOpen(true)} aria-label="Đổi thành viên">
        <MemberAvatar member={activeMember} size={compact ? 24 : 28} />
        <span>{compact ? 'Đang xem: ' : ''}<strong>{displayName(activeMember)}</strong></span>
        <ChevronDown size={16} />
      </button>
      {open && !editor && (
        <Sheet title="Thành viên gia đình" onClose={() => setOpen(false)}>
          <div className="member-list">
            {members.map((m) => (
              <button key={m.id} className={`member-row ${m.id === activeMember.id ? 'active' : ''}`}
                onClick={() => { setActiveMemberId(m.id); setOpen(false); if (m.id !== activeMember.id) showToast(`Đang xem sức khỏe của ${displayName(m)}`, 'info') }}>
                <MemberAvatar member={m} />
                <span className="member-row-text"><strong>{displayName(m)}</strong><small>{m.relation}{m.birthYear ? ` · ${new Date().getFullYear() - Number(m.birthYear)} tuổi` : ''}</small></span>
                {m.id === activeMember.id && <Check size={18} />}
              </button>
            ))}
          </div>
          <button className="btn btn-outline btn-block" onClick={() => setEditor({ mode: 'add' })}><UserPlus size={18} /> Thêm thành viên</button>
        </Sheet>
      )}
      {editor && <MemberEditor mode={editor.mode} member={editor.member} onClose={() => { setEditor(null); setOpen(false) }} />}
    </>
  )
}

/** Danh sách quản lý thành viên trong Cài đặt */
export function MemberManager() {
  const { members, setMembers, activeMember, setActiveMemberId, readings, setReadings, allMeds, setMeds, showToast } = useApp()
  const [editor, setEditor] = useState(null)
  const [toDelete, setToDelete] = useState(null)
  const counts = (m) => ({
    r: readings.filter((x) => memberOf(x) === m.id).length,
    d: allMeds.filter((x) => memberOf(x) === m.id).length,
  })
  return (
    <>
      <div className="member-list">
        {members.map((m) => {
          const c = counts(m)
          return (
            <div key={m.id} className={`member-row static ${m.id === activeMember.id ? 'active' : ''}`}>
              <MemberAvatar member={m} />
              <span className="member-row-text">
                <strong>{displayName(m)}{m.id === activeMember.id && <em className="tag-active">Đang xem</em>}</strong>
                <small>{m.relation} · {c.r} bản ghi · {c.d} thuốc</small>
              </span>
              <button className="icon-btn" aria-label={`Sửa ${displayName(m)}`} onClick={() => setEditor({ mode: 'edit', member: m })}><Pencil size={17} /></button>
              {members.length > 1 && <button className="icon-btn" aria-label={`Xóa ${displayName(m)}`} onClick={() => setToDelete(m)}><Trash2 size={17} /></button>}
            </div>
          )
        })}
      </div>
      <button className="btn btn-outline btn-block" onClick={() => setEditor({ mode: 'add' })}><Plus size={18} /> Thêm thành viên</button>
      {editor && <MemberEditor mode={editor.mode} member={editor.member} onClose={() => setEditor(null)} />}
      {toDelete && (
        <Confirm title={`Xóa ${displayName(toDelete)}?`} danger confirmText="Xóa"
          message={`Toàn bộ chỉ số và thuốc của ${displayName(toDelete)} sẽ bị xóa khỏi thiết bị này. Không thể hoàn tác.`}
          onConfirm={() => {
            const id = toDelete.id
            setReadings((list) => list.filter((x) => memberOf(x) !== id))
            setMeds((list) => list.filter((x) => memberOf(x) !== id))
            const rest = members.filter((x) => x.id !== id)
            setMembers(rest)
            if (activeMember.id === id) setActiveMemberId(rest[0].id)
            setToDelete(null)
            showToast(`Đã xóa ${displayName(toDelete)}.`)
          }}
          onCancel={() => setToDelete(null)} />
      )}
    </>
  )
}

function MemberEditor({ mode, member, onClose }) {
  const { members, setMembers, setActiveMemberId, showToast } = useApp()
  const [f, setF] = useState(() => member || { name: '', relation: 'Mẹ', birthYear: '', heightCm: '', color: MEMBER_COLORS[members.length % MEMBER_COLORS.length] })
  const [err, setErr] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const submit = (e) => {
    e.preventDefault()
    if (!f.name.trim() && !f.relation) return setErr('Hãy nhập tên gọi hoặc chọn quan hệ.')
    const year = new Date().getFullYear()
    if (f.birthYear && (f.birthYear < 1900 || f.birthYear > year)) return setErr(`Năm sinh phải từ 1900 đến ${year}.`)
    if (f.heightCm && (f.heightCm < 40 || f.heightCm > 250)) return setErr('Chiều cao phải từ 40 đến 250 cm.')
    const clean = { ...f, name: f.name.trim() }
    if (mode === 'edit') {
      setMembers((list) => list.map((m) => (m.id === member.id ? { ...m, ...clean } : m)))
      showToast('Đã cập nhật thành viên.')
    } else {
      const id = uid()
      setMembers((list) => [...list, { ...clean, id }])
      setActiveMemberId(id)
      showToast(`Đã thêm ${displayName(clean)}. Bạn đang xem sức khỏe của ${displayName(clean)}.`)
    }
    onClose()
  }
  return (
    <Sheet title={mode === 'edit' ? 'Sửa thành viên' : 'Thêm thành viên'} onClose={onClose}>
      <form className="stack" onSubmit={submit}>
        <div className="row-2">
          <label>Tên gọi<input autoFocus value={f.name} maxLength={30} onChange={set('name')} placeholder="Ví dụ: Bà Lan" /></label>
          <label>Quan hệ
            <select value={f.relation} onChange={set('relation')}>
              {RELATIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </label>
        </div>
        <div className="row-2">
          <label>Năm sinh<input type="number" inputMode="numeric" value={f.birthYear} onChange={set('birthYear')} placeholder="1955" /></label>
          <label>Chiều cao (cm)<input type="number" inputMode="numeric" value={f.heightCm} onChange={set('heightCm')} placeholder="155" /></label>
        </div>
        <div>
          <span className="label-text">Màu đại diện</span>
          <div className="color-row">
            {MEMBER_COLORS.map((c) => (
              <button type="button" key={c} className={`color-dot ${f.color === c ? 'active' : ''}`} style={{ background: c }} onClick={() => setF({ ...f, color: c })} aria-label={`Chọn màu ${c}`}>
                {f.color === c && <Check size={14} color="#fff" strokeWidth={3} />}
              </button>
            ))}
          </div>
        </div>
        {err && <div className="form-error" role="alert">{err}</div>}
        <button className="btn btn-primary btn-block btn-lg" type="submit">{mode === 'edit' ? 'Lưu thay đổi' : 'Thêm thành viên'}</button>
      </form>
    </Sheet>
  )
}
