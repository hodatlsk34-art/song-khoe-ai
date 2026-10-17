import { useMemo, useState } from 'react'
import { formatShort } from '../lib/health.js'

/**
 * Biểu đồ đường SVG đơn giản, không cần thư viện.
 * points: [{ x: 'YYYY-MM-DD', label, values: { key: number } }]
 * series: [{ key, name, color }]
 */
export default function LineChart({ points, series, yMin, yMax, yTicks, unit = '' }) {
  const [active, setActive] = useState(null)
  const W = 320, H = 190, L = 32, R = 10, T = 12, B = 26
  const innerW = W - L - R, innerH = H - T - B

  const { min, max, ticks } = useMemo(() => {
    if (yTicks) return { min: yTicks[0], max: yTicks[yTicks.length - 1], ticks: yTicks }
    const vals = points.flatMap((p) => series.map((s) => p.values[s.key])).filter((v) => v != null)
    let lo = yMin ?? Math.floor(Math.min(...vals) - 2)
    let hi = yMax ?? Math.ceil(Math.max(...vals) + 2)
    if (!isFinite(lo) || !isFinite(hi)) { lo = 0; hi = 10 }
    if (hi - lo < 4) { hi += 2; lo -= 2 }
    const step = (hi - lo) / 4
    const t = Array.from({ length: 5 }, (_, i) => +(lo + step * i).toFixed(1))
    return { min: lo, max: hi, ticks: t }
  }, [points, series, yMin, yMax, yTicks])

  if (!points.length) {
    return <div className="chart-empty">Chưa có dữ liệu trong khoảng thời gian này</div>
  }

  const xAt = (i) => L + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW)
  const yAt = (v) => T + innerH - ((v - min) / (max - min)) * innerH

  // Chọn tối đa 5 nhãn trục X
  const labelIdx = new Set()
  const n = points.length
  const count = Math.min(5, n)
  for (let i = 0; i < count; i++) labelIdx.add(count === 1 ? 0 : Math.round((i * (n - 1)) / (count - 1)))

  const act = active != null ? points[active] : null

  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Biểu đồ chỉ số theo thời gian" onMouseLeave={() => setActive(null)}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={L} x2={W - R} y1={yAt(t)} y2={yAt(t)} className="grid" />
            <text x={L - 7} y={yAt(t) + 3.5} className="axis" textAnchor="end">{t}</text>
          </g>
        ))}
        {points.map((p, i) => labelIdx.has(i) && (
          <text key={p.x + i} x={xAt(i)} y={H - 6} className="axis" textAnchor="middle">{formatShort(p.x)}</text>
        ))}
        {act && <line x1={xAt(active)} x2={xAt(active)} y1={T} y2={T + innerH} className="cursor" />}
        {series.map((s) => {
          const pts = points.map((p, i) => (p.values[s.key] != null ? [xAt(i), yAt(p.values[s.key])] : null)).filter(Boolean)
          return (
            <g key={s.key}>
              <polyline points={pts.map((q) => q.join(',')).join(' ')} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
              {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3.6" fill={s.color} stroke="#fff" strokeWidth="1.4" />)}
            </g>
          )
        })}
        {/* Vùng chạm để xem giá trị */}
        {points.map((p, i) => (
          <rect key={`hit-${i}`} x={xAt(i) - innerW / Math.max(points.length - 1, 1) / 2} y={T} width={innerW / Math.max(points.length - 1, 1)} height={innerH}
            fill="transparent" onMouseEnter={() => setActive(i)} onClick={() => setActive(i)} />
        ))}
      </svg>
      {act && (
        <div className="chart-tip" style={{ left: `${(xAt(active) / W) * 100}%` }}>
          <strong>{formatShort(act.x)}{act.time ? ` · ${act.time}` : ''}</strong>
          {series.map((s) => act.values[s.key] != null && (
            <span key={s.key}><i style={{ background: s.color }} />{s.name}: {act.values[s.key]} {unit}</span>
          ))}
        </div>
      )}
    </div>
  )
}
