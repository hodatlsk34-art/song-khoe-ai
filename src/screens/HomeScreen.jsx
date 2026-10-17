import { useMemo } from 'react'
import { Bell, CalendarCheck, ChevronRight, MessageCircle, Plus, Settings, StickyNote, Weight, Heart, HeartPulse, Pill } from 'lucide-react'
import { useApp } from '../AppContext.js'
import { Logo } from '../components/ui.jsx'
import { GreetingScene } from '../components/Illustrations.jsx'
import { classifyBP, classifyPulse, dosesForDay, relativeDayLabel, todayKey } from '../lib/health.js'

function greeting() {
  const h = new Date().getHours()
  if (h < 11) return 'Chào buổi sáng'
  if (h < 14) return 'Chào buổi trưa'
  if (h < 18) return 'Chào buổi chiều'
  return 'Chào buổi tối'
}

export default function HomeScreen() {
  const { sortedReadings, meds, intakes, profile, go, setReadings, setMeds, showToast } = useApp()
  const latestOf = (field) => sortedReadings.find((r) => r[field])
  const bp = latestOf('sys'), pulse = latestOf('pulse'), weight = latestOf('weight')
  const noteR = sortedReadings.find((r) => r.note)
  const newest = sortedReadings[0]
  const bpClass = bp && classifyBP(bp.sys, bp.dia)
  const pulseClass = pulse && classifyPulse(pulse.pulse)
  const hasSample = sortedReadings.some((r) => r.sample) || meds.some((m) => m.sample)

  const today = todayKey()
  const doses = useMemo(() => dosesForDay(meds, today), [meds, today])
  const taken = intakes[today] || {}
  const takenCount = doses.filter((d) => taken[d.key]).length
  const nextDose = doses.find((d) => !taken[d.key])

  const removeSample = () => {
    setReadings((r) => r.filter((x) => !x.sample))
    setMeds((m) => m.filter((x) => !x.sample))
    showToast('Đã xóa dữ liệu mẫu. Hãy nhập chỉ số đầu tiên của bạn!')
  }

  return (
    <div className="home">
      <header className="home-header">
        <div className="brand">
          <Logo size={40} />
          <div>
            <h1>Sống Khỏe AI</h1>
            <p>Đồng hành cùng sức khỏe gia đình</p>
          </div>
        </div>
        <button className="icon-btn" onClick={() => go('settings')} aria-label="Cài đặt"><Settings size={22} /></button>
      </header>

      <section className="greeting-card">
        <GreetingScene />
        <div className="greeting-text">
          <h2>{profile.name ? `Chào ${profile.name}!` : 'Chào bạn!'}</h2>
          <p>{greeting()}, hôm nay bạn cảm thấy thế nào?</p>
        </div>
      </section>

      {hasSample && (
        <div className="sample-note">
          <span>Đang hiển thị <strong>dữ liệu mẫu</strong> để bạn xem thử.</span>
          <button onClick={removeSample}>Xóa dữ liệu mẫu</button>
        </div>
      )}

      <div className="section-title">
        <h2>Chỉ số gần nhất</h2>
        <span>{newest ? `${relativeDayLabel(newest.date)}, ${newest.time}` : 'Chưa có dữ liệu'}</span>
      </div>

      <section className="metric-grid">
        <button className="metric-card" onClick={() => go('history', { tab: 'bp' })}>
          <span className="metric-icon red"><Heart size={18} fill="currentColor" /></span>
          <div className="metric-body">
            <span className="metric-label">Huyết áp</span>
            <strong className="metric-value">{bp ? `${bp.sys}/${bp.dia}` : '--/--'}</strong>
            <span className="metric-unit">mmHg</span>
            {bpClass && <span className={`chip chip-${bpClass.level}`}>{bpClass.label}</span>}
          </div>
        </button>
        <button className="metric-card" onClick={() => go('history', { tab: 'pulse' })}>
          <span className="metric-icon red"><HeartPulse size={18} /></span>
          <div className="metric-body">
            <span className="metric-label">Nhịp tim</span>
            <strong className="metric-value">{pulse ? pulse.pulse : '--'}</strong>
            <span className="metric-unit">bpm</span>
            {pulseClass && <span className={`chip chip-${pulseClass.level}`}>{pulseClass.label}</span>}
          </div>
        </button>
        <button className="metric-card" onClick={() => go('history', { tab: 'weight' })}>
          <span className="metric-icon blue"><Weight size={18} /></span>
          <div className="metric-body">
            <span className="metric-label">Cân nặng</span>
            <strong className="metric-value">{weight ? weight.weight : '--'}</strong>
            <span className="metric-unit">kg</span>
          </div>
        </button>
        <button className="metric-card" onClick={() => go('history')}>
          <span className="metric-icon yellow"><StickyNote size={18} /></span>
          <div className="metric-body">
            <span className="metric-label">Ghi chú</span>
            <span className="metric-note">{noteR ? noteR.note : 'Chưa có ghi chú'}</span>
          </div>
        </button>
      </section>

      <button className="btn btn-primary btn-block btn-lg" onClick={() => go('add')}>
        <Plus size={20} /> Nhập chỉ số mới
      </button>

      {doses.length > 0 && (
        <button className="today-meds" onClick={() => go('meds')}>
          <span className="today-meds-icon"><Pill size={20} /></span>
          <div>
            <strong>Thuốc hôm nay: {takenCount}/{doses.length} lần đã uống</strong>
            <span>{nextDose ? `Tiếp theo: ${nextDose.med.name} lúc ${nextDose.time}` : 'Bạn đã uống đủ thuốc hôm nay 🎉'}</span>
            <div className="progress"><i style={{ width: `${(takenCount / doses.length) * 100}%` }} /></div>
          </div>
          <ChevronRight size={18} />
        </button>
      )}

      <div className="section-title"><h2>Tiện ích nhanh</h2></div>
      <section className="quick-grid">
        <button className="quick-item" onClick={() => go('history')}>
          <span className="quick-icon blue"><CalendarCheck size={18} /></span> Lịch sử chỉ số
        </button>
        <button className="quick-item" onClick={() => go('meds')}>
          <span className="quick-icon amber"><Bell size={18} /></span> Nhắc thuốc
        </button>
        <button className="quick-item" onClick={() => go('ai')}>
          <span className="quick-icon sky"><MessageCircle size={18} /></span> Hỏi AI sức khỏe
        </button>
        <button className="quick-item" onClick={() => go('settings')}>
          <span className="quick-icon indigo"><Settings size={18} /></span> Cài đặt
        </button>
      </section>
    </div>
  )
}
