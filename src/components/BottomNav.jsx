import { Bell, HeartPulse, Home, MessageCircle, Settings } from 'lucide-react'

const ITEMS = [
  { id: 'home', label: 'Trang chủ', icon: Home },
  { id: 'history', label: 'Chỉ số', icon: HeartPulse },
  { id: 'meds', label: 'Nhắc thuốc', icon: Bell },
  { id: 'ai', label: 'Hỏi AI', icon: MessageCircle },
  { id: 'settings', label: 'Cài đặt', icon: Settings },
]

export default function BottomNav({ active, onChange }) {
  return (
    <nav className="bottom-nav" aria-label="Điều hướng chính">
      {ITEMS.map(({ id, label, icon: Icon }) => {
        const on = active === id
        return (
          <button key={id} data-tab={id} className={on ? "active" : ""} onClick={() => !on && onChange(id)} aria-current={on ? 'page' : undefined}>
            <Icon size={22} strokeWidth={on ? 2.3 : 2} fill={on ? 'currentColor' : 'none'} fillOpacity={on ? 0.18 : 0} />
            <span>{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
