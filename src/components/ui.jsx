import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ChevronLeft, MoreVertical, X } from 'lucide-react'

/** Logo trái tim có đường nhịp tim */
export function Logo({ size = 38 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <defs>
        <linearGradient id="lg-heart" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3cc3a6" />
          <stop offset="1" stopColor="#0f8a78" />
        </linearGradient>
      </defs>
      <path d="M24 42S5 30.5 5 17.5C5 11 10 6.5 15.6 6.5c3.7 0 6.6 2 8.4 4.8 1.8-2.8 4.7-4.8 8.4-4.8C38 6.5 43 11 43 17.5 43 30.5 24 42 24 42z" fill="url(#lg-heart)" />
      <path d="M9 23h8l3-6 5 12 3-6h11" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Tiêu đề màn hình con: nút quay lại + tiêu đề + hành động bên phải */
export function ScreenHeader({ title, onBack, right, arrow = 'arrow' }) {
  return (
    <header className="screen-header">
      {onBack ? (
        <button className="icon-btn" onClick={onBack} aria-label="Quay lại">
          {arrow === 'chevron' ? <ChevronLeft size={24} /> : <ArrowLeft size={22} />}
        </button>
      ) : <span className="icon-btn-placeholder" />}
      <h1>{title}</h1>
      <div className="screen-header-right">{right || <span className="icon-btn-placeholder" />}</div>
    </header>
  )
}

/** Bảng trượt từ dưới lên (bottom sheet) */
export function Sheet({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [onClose])
  return (
    <div className="sheet-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <section className="sheet" role="dialog" aria-modal="true" aria-label={title}>
        <div className="sheet-grip" />
        <div className="sheet-head">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Đóng"><X size={20} /></button>
        </div>
        <div className="sheet-body">{children}</div>
      </section>
    </div>
  )
}

/** Hộp thoại xác nhận */
export function Confirm({ title, message, confirmText = 'Xác nhận', danger, onConfirm, onCancel }) {
  return (
    <div className="sheet-backdrop center" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <section className="dialog" role="alertdialog" aria-modal="true" aria-label={title}>
        <h2>{title}</h2>
        <p>{message}</p>
        <div className="dialog-actions">
          <button className="btn btn-ghost" onClick={onCancel}>Hủy</button>
          <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>{confirmText}</button>
        </div>
      </section>
    </div>
  )
}

/** Menu ba chấm */
export function KebabMenu({ items, label = 'Tùy chọn' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef()
  useEffect(() => {
    if (!open) return
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    document.addEventListener('touchstart', close)
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('touchstart', close) }
  }, [open])
  return (
    <div className="kebab" ref={ref}>
      <button className="kebab-btn" aria-label={label} onClick={(e) => { e.stopPropagation(); setOpen(!open) }}>
        <MoreVertical size={18} />
      </button>
      {open && (
        <div className="kebab-menu" role="menu">
          {items.map(({ label: l, icon: Icon, onClick, danger }) => (
            <button key={l} role="menuitem" className={danger ? 'danger' : ''} onClick={(e) => { e.stopPropagation(); setOpen(false); onClick() }}>
              {Icon && <Icon size={16} />} {l}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/** Thanh chọn dạng tab (segmented) */
export function Segmented({ options, value, onChange, variant = 'tabs' }) {
  return (
    <div className={`segmented ${variant}`} role="tablist">
      {options.map(([id, label]) => (
        <button key={id} role="tab" aria-selected={value === id} className={value === id ? 'active' : ''} onClick={() => onChange(id)}>
          {label}
        </button>
      ))}
    </div>
  )
}

export function Switch({ checked, onChange, label }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} className={`switch ${checked ? 'on' : ''}`} onClick={() => onChange(!checked)}>
      <span />
    </button>
  )
}

/** Hiển thị văn bản có **in đậm** và xuống dòng */
export function RichText({ text }) {
  return text.split('\n').map((line, i) => (
    <p key={i} className={line.trim() === '' ? 'blank' : ''}>
      {line.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
        part.startsWith('**') && part.endsWith('**') ? <strong key={j}>{part.slice(2, -2)}</strong> : part
      )}
    </p>
  ))
}
