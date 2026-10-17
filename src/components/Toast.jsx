import { CheckCircle2, Info, TriangleAlert, X } from 'lucide-react'

const ICONS = { success: CheckCircle2, info: Info, warn: TriangleAlert, error: TriangleAlert }

export default function Toast({ message, type = 'success', onClose }) {
  const Icon = ICONS[type] || Info
  return (
    <div className={`toast toast-${type}`} role="status" aria-live="polite">
      <Icon size={19} />
      <span>{message}</span>
      <button onClick={onClose} aria-label="Đóng thông báo"><X size={16} /></button>
    </div>
  )
}
