import { useMemo, useState } from 'react'
import { Droplet, Heart, Pencil, Plus, Trash2, Weight } from 'lucide-react'
import { useApp } from '../AppContext.js'
import { Confirm, KebabMenu, ScreenHeader, Segmented } from '../components/ui.jsx'
import LineChart from '../components/LineChart.jsx'
import { MemberSwitcher } from '../components/Members.jsx'
import { GLUCOSE_CTX, addDays, calcBMI, classifyBP, classifyGlucose, formatDate, todayKey } from '../lib/health.js'

const TABS = [['bp', 'Huyết áp'], ['pulse', 'Nhịp tim'], ['glucose', 'Đường huyết'], ['weight', 'Cân nặng']]
const RANGES = [['7', '7 ngày'], ['30', '30 ngày'], ['90', '3 tháng'], ['365', '1 năm']]
const FIELD = { bp: 'sys', pulse: 'pulse', weight: 'weight', glucose: 'glucose' }

export default function HistoryScreen() {
  const { params, sortedReadings, setReadings, go, back, showToast, profile } = useApp()
  const [tab, setTab] = useState(params.tab || 'bp')
  const [range, setRange] = useState('30')
  const [toDelete, setToDelete] = useState(null)
  const [limit, setLimit] = useState(15)

  const from = addDays(todayKey(), -Number(range) + 1)
  const list = useMemo(
    () => sortedReadings.filter((r) => r.date >= from && r[FIELD[tab]]),
    [sortedReadings, from, tab]
  )
  const asc = useMemo(() => [...list].reverse(), [list])

  const chart = useMemo(() => {
    const points = asc.map((r) => ({
      x: r.date, time: r.time,
      values: tab === 'bp' ? { sys: +r.sys, dia: +r.dia } : tab === 'pulse' ? { pulse: +r.pulse } : tab === 'glucose' ? { glucose: +r.glucose } : { weight: +r.weight },
    }))
    if (tab === 'bp') {
      const hi = Math.max(180, ...asc.map((r) => +r.sys))
      const top = Math.ceil(hi / 30) * 30
      return {
        points, unit: 'mmHg',
        series: [{ key: 'sys', name: 'Tâm thu', color: '#ef5350' }, { key: 'dia', name: 'Tâm trương', color: '#3f7ee8' }],
        yTicks: Array.from({ length: top / 30 + 1 }, (_, i) => i * 30),
      }
    }
    if (tab === 'pulse') return { points, unit: 'bpm', series: [{ key: 'pulse', name: 'Nhịp tim', color: '#ef5350' }] }
    if (tab === 'glucose') {
      const top = Math.max(12, Math.ceil((Math.max(0, ...asc.map((r) => +r.glucose)) + 1) / 3) * 3)
      return { points, unit: 'mmol/L', series: [{ key: 'glucose', name: 'Đường huyết', color: '#8b5cf6' }], yTicks: Array.from({ length: top / 3 + 1 }, (_, i) => i * 3) }
    }
    return { points, unit: 'kg', series: [{ key: 'weight', name: 'Cân nặng', color: '#14907f' }] }
  }, [asc, tab])

  const stats = useMemo(() => {
    if (!list.length) return null
    const avg = (arr) => arr.reduce((s, v) => s + v, 0) / arr.length
    if (tab === 'bp') {
      const s = list.map((r) => +r.sys), d = list.map((r) => +r.dia)
      return [
        ['Trung bình', `${Math.round(avg(s))}/${Math.round(avg(d))}`],
        ['Cao nhất', `${Math.max(...s)}/${d[s.indexOf(Math.max(...s))]}`],
        ['Số lần đo', list.length],
      ]
    }
    const v = list.map((r) => +r[FIELD[tab]])
    const fmt = (x) => (tab === 'weight' || tab === 'glucose' ? x.toFixed(1) : Math.round(x))
    const res = [['Trung bình', fmt(avg(v))], ['Thấp – cao', `${fmt(Math.min(...v))} – ${fmt(Math.max(...v))}`]]
    if (tab === 'weight') {
      const change = v[0] - v[v.length - 1]
      const bmi = calcBMI(v[0], profile.heightCm)
      res.push(bmi ? ['BMI', `${bmi.value} · ${bmi.label}`] : ['Thay đổi', `${change > 0 ? '+' : ''}${change.toFixed(1)} kg`])
    } else res.push(['Số lần đo', list.length])
    return res
  }, [list, tab, profile.heightCm])

  const confirmDelete = () => {
    setReadings((all) => all.filter((r) => r.id !== toDelete.id))
    setToDelete(null)
    showToast('Đã xóa bản ghi.')
  }

  return (
    <div className="history">
      <ScreenHeader title="Lịch sử chỉ số" onBack={back} arrow="chevron"
        right={<button className="icon-btn accent" onClick={() => go('add')} aria-label="Nhập chỉ số mới"><Plus size={22} /></button>} />

      <div className="member-bar"><MemberSwitcher compact /></div>
      <Segmented options={TABS} value={tab} onChange={setTab} variant="tabs four" />
      <Segmented options={RANGES} value={range} onChange={setRange} variant="pills" />

      <section className="card chart-card">
        <div className="legend">
          {chart.series.map((s) => <span key={s.key}><i style={{ background: s.color }} />{s.name}</span>)}
        </div>
        <LineChart points={chart.points} series={chart.series} yTicks={chart.yTicks} unit={chart.unit} />
        {stats && (
          <div className="stats-row">
            {stats.map(([k, v]) => <div key={k}><span>{k}</span><strong>{v}</strong></div>)}
          </div>
        )}
      </section>

      <div className="section-title"><h2>Danh sách bản ghi</h2><span>{list.length} bản ghi</span></div>

      {list.length === 0 ? (
        <div className="empty">
          <p>Chưa có bản ghi {TABS.find((t) => t[0] === tab)[1].toLowerCase()} trong khoảng thời gian này.</p>
          <button className="btn btn-primary" onClick={() => go('add')}><Plus size={18} /> Nhập chỉ số</button>
        </div>
      ) : (
        <div className="record-list">
          {list.slice(0, limit).map((r, i) => {
            const bp = r.sys ? classifyBP(r.sys, r.dia) : null
            const gl = r.glucose ? classifyGlucose(r.glucose, r.glucoseCtx) : null
            return (
              <article key={r.id} className={`record ${i === 0 ? 'latest' : ''}`}>
                <div className="record-main">
                  <span className="record-date">{formatDate(r.date)} {r.time}{r.sample && <em className="tag-sample">mẫu</em>}</span>
                  <div className="record-values">
                    {r.sys && <span><Heart size={15} className="red" fill="currentColor" /><strong>{r.sys}/{r.dia}</strong> <small>mmHg</small></span>}
                    {r.pulse && <span><Heart size={15} className="red" fill="currentColor" /><strong>{r.pulse}</strong> <small>bpm</small></span>}
                    {r.glucose && (tab === 'glucose' || (!r.sys && !r.pulse)) && <span><Droplet size={15} className="purple" /><strong>{r.glucose}</strong> <small>mmol/L · {GLUCOSE_CTX[r.glucoseCtx] || ''}</small></span>}
                    {tab === 'weight' || (!r.sys && !r.pulse && !r.glucose)
                      ? r.weight && <span><Weight size={15} className="blue" /><strong>{r.weight}</strong> <small>kg</small></span>
                      : null}
                  </div>
                  {(r.note || bp || gl) && (
                    <span className="record-note">
                      {tab !== 'glucose' && bp && bp.level !== 'good' && <span className={`chip chip-${bp.level}`}>{bp.label}</span>}
                      {tab === 'glucose' && gl && gl.level !== 'good' && <span className={`chip chip-${gl.level}`}>{gl.label}</span>} {r.note}
                    </span>
                  )}
                </div>
                <KebabMenu items={[
                  { label: 'Sửa', icon: Pencil, onClick: () => go('add', { editId: r.id }) },
                  { label: 'Xóa', icon: Trash2, danger: true, onClick: () => setToDelete(r) },
                ]} />
              </article>
            )
          })}
          {list.length > limit && (
            <button className="btn btn-outline btn-block" onClick={() => setLimit(limit + 15)}>Xem thêm ({list.length - limit} bản ghi)</button>
          )}
        </div>
      )}

      {toDelete && (
        <Confirm title="Xóa bản ghi?" danger confirmText="Xóa"
          message={`Bản ghi ngày ${formatDate(toDelete.date)} lúc ${toDelete.time} sẽ bị xóa vĩnh viễn.`}
          onConfirm={confirmDelete} onCancel={() => setToDelete(null)} />
      )}
    </div>
  )
}
