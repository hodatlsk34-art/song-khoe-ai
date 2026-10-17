import { useMemo, useState } from 'react'
import { CalendarDays, Clock, Download, Droplet, Heart, HeartPulse, Weight, TriangleAlert } from 'lucide-react'
import { useApp } from '../AppContext.js'
import { ScreenHeader } from '../components/ui.jsx'
import { MemberAvatar, displayName } from '../components/Members.jsx'
import { GLUCOSE_CTX, classifyBP, classifyGlucose, classifyPulse, todayKey, toTimeStr, uid } from '../lib/health.js'

const RANGES = {
  sys: [50, 260, 'Tâm thu'],
  dia: [30, 160, 'Tâm trương'],
  pulse: [30, 220, 'Nhịp tim'],
  weight: [2, 300, 'Cân nặng'],
  glucose: [1, 35, 'Đường huyết'],
}

export default function AddReadingScreen() {
  const { params, readings, setReadings, back, showToast, activeMember, members } = useApp()
  const editing = useMemo(() => readings.find((r) => r.id === params.editId), [readings, params.editId])
  const [form, setForm] = useState(() => editing
    ? { date: editing.date, time: editing.time, sys: editing.sys || '', dia: editing.dia || '', pulse: editing.pulse || '', weight: editing.weight || '', glucose: editing.glucose || '', glucoseCtx: editing.glucoseCtx || 'fasting', note: editing.note || '' }
    : { date: todayKey(), time: toTimeStr(), sys: '', dia: '', pulse: '', weight: '', glucose: '', glucoseCtx: 'fasting', note: '' })
  const [error, setError] = useState('')

  const set = (k) => (e) => { setForm({ ...form, [k]: e.target.value }); setError('') }
  const bpPreview = form.sys && form.dia ? classifyBP(form.sys, form.dia) : null
  const pulsePreview = form.pulse ? classifyPulse(form.pulse) : null
  const gluPreview = form.glucose ? classifyGlucose(form.glucose, form.glucoseCtx) : null

  function validate() {
    if (!form.date || !form.time) return 'Vui lòng chọn ngày và giờ đo.'
    if (form.date > todayKey()) return 'Ngày đo không được ở tương lai.'
    if (!form.sys && !form.dia && !form.pulse && !form.weight && !form.glucose && !form.note.trim()) return 'Hãy nhập ít nhất một chỉ số.'
    if ((form.sys && !form.dia) || (!form.sys && form.dia)) return 'Huyết áp cần nhập đủ cả tâm thu và tâm trương.'
    for (const [k, [lo, hi, name]] of Object.entries(RANGES)) {
      if (form[k] !== '' && (isNaN(form[k]) || Number(form[k]) < lo || Number(form[k]) > hi)) return `${name} phải trong khoảng ${lo}–${hi}.`
    }
    if (form.sys && Number(form.sys) <= Number(form.dia)) return 'Tâm thu phải lớn hơn tâm trương.'
    return ''
  }

  function save(e) {
    e.preventDefault()
    const err = validate()
    if (err) { setError(err); return }
    const clean = {
      ...form,
      sys: form.sys ? String(Math.round(form.sys)) : '',
      dia: form.dia ? String(Math.round(form.dia)) : '',
      pulse: form.pulse ? String(Math.round(form.pulse)) : '',
      weight: form.weight ? Number(form.weight).toFixed(1) : '',
      glucose: form.glucose ? Number(form.glucose).toFixed(1) : '',
      glucoseCtx: form.glucose ? form.glucoseCtx : '',
      note: form.note.trim(),
    }
    if (editing) {
      setReadings((list) => list.map((r) => (r.id === editing.id ? { ...r, ...clean, sample: false } : r)))
    } else {
      setReadings((list) => [...list, { id: uid(), memberId: activeMember.id, ...clean }])
    }
    const bp = clean.sys ? classifyBP(clean.sys, clean.dia) : null
    const gl = clean.glucose ? classifyGlucose(clean.glucose, clean.glucoseCtx) : null
    if (bp && bp.level === 'danger') showToast(bp.advice, 'error', 12000)
    else if (gl && gl.level === 'danger') showToast(gl.advice, 'error', 12000)
    else if (bp && bp.level === 'high') showToast(`Đã lưu. ${bp.label}: ${bp.advice}`, 'warn', 7000)
    else if (gl && gl.level !== 'good') showToast(`Đã lưu. Đường huyết ${gl.label.toLowerCase()}: ${gl.advice}`, 'warn', 8000)
    else showToast(editing ? 'Đã cập nhật chỉ số.' : 'Đã lưu chỉ số thành công!')
    back()
  }

  return (
    <div className="form-screen">
      <ScreenHeader title={editing ? 'Sửa chỉ số' : 'Nhập chỉ số sức khỏe'} onBack={back} />
      <form onSubmit={save} noValidate>
        {members.length > 1 && (
          <div className="for-member"><MemberAvatar member={activeMember} size={24} /> Nhập cho <strong>{displayName(activeMember)}</strong></div>
        )}
        <label className="field-label">Ngày đo</label>
        <div className="row-2">
          <div className="input-icon">
            <input type="date" value={form.date} max={todayKey()} onChange={set('date')} aria-label="Ngày đo" />
            <CalendarDays size={18} />
          </div>
          <div className="input-icon">
            <input type="time" value={form.time} onChange={set('time')} aria-label="Giờ đo" />
            <Clock size={18} />
          </div>
        </div>

        <section className="form-card">
          <div className="form-card-title">
            <span className="metric-icon red sm"><Heart size={16} fill="currentColor" /></span>
            <strong>Huyết áp</strong> <span className="muted">(mmHg)</span>
            {bpPreview && <span className={`chip chip-${bpPreview.level}`}>{bpPreview.label}</span>}
          </div>
          <div className="bp-inputs">
            <div>
              <input className="big-input" type="number" inputMode="numeric" placeholder="120" value={form.sys} onChange={set('sys')} aria-label="Tâm thu" />
              <span>Tâm thu</span>
            </div>
            <span className="slash">/</span>
            <div>
              <input className="big-input" type="number" inputMode="numeric" placeholder="80" value={form.dia} onChange={set('dia')} aria-label="Tâm trương" />
              <span>Tâm trương</span>
            </div>
          </div>
        </section>

        <section className="form-card">
          <div className="form-card-title">
            <span className="metric-icon red sm"><HeartPulse size={16} /></span>
            <strong>Nhịp tim</strong> <span className="muted">(bpm)</span>
            {pulsePreview && <span className={`chip chip-${pulsePreview.level}`}>{pulsePreview.label}</span>}
          </div>
          <input className="plain-input" type="number" inputMode="numeric" placeholder="72" value={form.pulse} onChange={set('pulse')} aria-label="Nhịp tim" />
        </section>

        <section className="form-card">
          <div className="form-card-title">
            <span className="metric-icon blue sm"><Weight size={16} /></span>
            <strong>Cân nặng</strong> <span className="muted">(kg)</span>
          </div>
          <input className="plain-input" type="number" inputMode="decimal" step="0.1" placeholder="62.5" value={form.weight} onChange={set('weight')} aria-label="Cân nặng" />
        </section>

        <section className="form-card">
          <div className="form-card-title">
            <span className="metric-icon purple sm"><Droplet size={16} /></span>
            <strong>Đường huyết</strong> <span className="muted">(mmol/L)</span>
            {gluPreview && <span className={`chip chip-${gluPreview.level}`}>{gluPreview.label}</span>}
          </div>
          <div className="ctx-chips" role="radiogroup" aria-label="Thời điểm đo đường huyết">
            {Object.entries(GLUCOSE_CTX).map(([id, label]) => (
              <button type="button" key={id} role="radio" aria-checked={form.glucoseCtx === id} className={form.glucoseCtx === id ? 'active' : ''}
                onClick={() => setForm({ ...form, glucoseCtx: id })}>{label}</button>
            ))}
          </div>
          <input className="plain-input" type="number" inputMode="decimal" step="0.1" placeholder="5.6" value={form.glucose} onChange={set('glucose')} aria-label="Đường huyết" />
          <p className="hint small">Máy đo hiển thị mg/dL? Chia cho 18 để ra mmol/L (ví dụ 100 mg/dL ≈ 5,6 mmol/L).</p>
        </section>

        <section className="form-card">
          <div className="form-card-title"><strong>Ghi chú</strong> <span className="muted">(tùy chọn)</span></div>
          <textarea className="plain-input" rows="3" maxLength={200} placeholder="Ví dụ: Sức khỏe ổn định, đo sau khi nghỉ 5 phút…" value={form.note} onChange={set('note')} aria-label="Ghi chú" />
        </section>

        {error && <div className="form-error" role="alert"><TriangleAlert size={16} /> {error}</div>}

        <button className="btn btn-primary btn-block btn-lg" type="submit">
          <Download size={19} /> {editing ? 'Cập nhật chỉ số' : 'Lưu chỉ số'}
        </button>
        <p className="hint center">Chỉ cần nhập những chỉ số bạn có. Dữ liệu được lưu trên thiết bị này.</p>
      </form>
    </div>
  )
}
