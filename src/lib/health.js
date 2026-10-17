// ===== Tiện ích ngày giờ (dùng giờ địa phương, không dùng UTC) =====
const pad = (n) => String(n).padStart(2, '0')

export const toDateKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const toTimeStr = (d = new Date()) => `${pad(d.getHours())}:${pad(d.getMinutes())}`
export const todayKey = () => toDateKey(new Date())
export const parseDateKey = (key) => {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}
export const addDays = (key, n) => {
  const d = parseDateKey(key)
  d.setDate(d.getDate() + n)
  return toDateKey(d)
}
export const formatDate = (key) => {
  if (!key) return '—'
  const [y, m, d] = key.split('-')
  return `${d}/${m}/${y}`
}
export const formatShort = (key) => {
  const [, m, d] = key.split('-')
  return `${d}/${m}`
}
const WEEKDAYS = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']
export const formatWeekday = (key) => `${WEEKDAYS[parseDateKey(key).getDay()]}, ${formatDate(key)}`
export const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`)

export const relativeDayLabel = (key) => {
  const t = todayKey()
  if (key === t) return 'Hôm nay'
  if (key === addDays(t, -1)) return 'Hôm qua'
  return formatDate(key)
}

export const sortReadings = (list) =>
  [...list].sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`))

// ===== Thành viên gia đình =====
export const DEFAULT_MEMBER_ID = 'member-default'
export const MEMBER_COLORS = ['#15937f', '#e8743b', '#7a5cd6', '#2f8fd8', '#d64f7a', '#c99a1c']
export const RELATIONS = ['Tôi', 'Vợ/Chồng', 'Bố', 'Mẹ', 'Ông', 'Bà', 'Con', 'Anh/Chị/Em', 'Khác']
/** Dữ liệu cũ chưa có memberId được coi là của thành viên mặc định */
export const memberOf = (item) => item?.memberId || DEFAULT_MEMBER_ID
export const memberInitial = (m) => ((m?.name || m?.relation || 'T').trim()[0] || 'T').toUpperCase()

// ===== Đánh giá chỉ số (thông tin tham khảo, không phải chẩn đoán) =====
// Phân loại huyết áp theo khuyến cáo của Hội Tim mạch học Việt Nam / ESC.
export function classifyBP(sys, dia) {
  if (!sys || !dia) return null
  const s = Number(sys), d = Number(dia)
  if (s >= 180 || d >= 110) return { level: 'danger', label: 'Rất cao', advice: 'Huyết áp rất cao. Hãy nghỉ ngơi, đo lại sau 5 phút và liên hệ cơ sở y tế. Nếu kèm đau ngực, khó thở, yếu liệt, nói khó: gọi cấp cứu 115 ngay.' }
  if (s >= 160 || d >= 100) return { level: 'high', label: 'Tăng HA độ 2', advice: 'Huyết áp cao. Nên đo lại và trao đổi với bác sĩ sớm.' }
  if (s >= 140 || d >= 90) return { level: 'high', label: 'Tăng HA độ 1', advice: 'Huyết áp cao hơn mức bình thường. Theo dõi thêm và trao đổi với bác sĩ.' }
  if (s >= 130 || d >= 85) return { level: 'warn', label: 'Bình thường cao', advice: 'Hơi cao. Hạn chế muối, vận động đều và tiếp tục theo dõi.' }
  if (s < 90 || d < 60) return { level: 'warn', label: 'Huyết áp thấp', advice: 'Huyết áp thấp. Nếu có chóng mặt, mệt lả, hãy nghỉ ngơi và hỏi ý kiến bác sĩ.' }
  if (s < 120 && d < 80) return { level: 'good', label: 'Tối ưu', advice: 'Huyết áp ở mức tốt.' }
  return { level: 'good', label: 'Bình thường', advice: 'Huyết áp trong giới hạn bình thường.' }
}

// Đường huyết (mmol/L) — ngưỡng tham khảo theo Hiệp hội Đái tháo đường Hoa Kỳ (ADA) cho người chưa được chẩn đoán.
export const GLUCOSE_CTX = { fasting: 'Lúc đói', after: 'Sau ăn 2 giờ', random: 'Bất kỳ' }
export function classifyGlucose(value, ctx = 'random') {
  if (!value) return null
  const v = Number(value)
  if (v < 3.0) return { level: 'danger', label: 'Hạ đường huyết nặng', advice: 'Đường huyết rất thấp. Ăn/uống ngay đồ ngọt (nước đường, nước trái cây), đo lại sau 15 phút. Nếu lơ mơ, co giật: gọi cấp cứu 115.' }
  if (v < 3.9) return { level: 'warn', label: 'Hạ đường huyết', advice: 'Đường huyết thấp. Hãy ăn hoặc uống chút đồ ngọt và đo lại sau 15 phút.' }
  if (v >= 16.7) return { level: 'danger', label: 'Rất cao', advice: 'Đường huyết rất cao. Hãy uống nước, đo lại và liên hệ cơ sở y tế sớm, nhất là khi mệt lả, khát nhiều, buồn nôn.' }
  if (ctx === 'fasting') {
    if (v >= 7.0) return { level: 'high', label: 'Cao', advice: 'Đường huyết lúc đói cao. Trao đổi với bác sĩ nếu lặp lại nhiều lần.' }
    if (v >= 5.6) return { level: 'warn', label: 'Hơi cao', advice: 'Đường huyết lúc đói hơi cao. Hạn chế đồ ngọt, tinh bột và theo dõi thêm.' }
    return { level: 'good', label: 'Bình thường', advice: 'Đường huyết lúc đói trong giới hạn bình thường.' }
  }
  if (ctx === 'after') {
    if (v >= 11.1) return { level: 'high', label: 'Cao', advice: 'Đường huyết sau ăn cao. Trao đổi với bác sĩ.' }
    if (v >= 7.8) return { level: 'warn', label: 'Hơi cao', advice: 'Đường huyết sau ăn hơi cao. Theo dõi thêm.' }
    return { level: 'good', label: 'Bình thường', advice: 'Đường huyết sau ăn trong giới hạn bình thường.' }
  }
  if (v >= 11.1) return { level: 'high', label: 'Cao', advice: 'Đường huyết cao. Hãy đo lại lúc đói và trao đổi với bác sĩ.' }
  return { level: 'good', label: 'Trong giới hạn', advice: 'Đường huyết đo bất kỳ dưới 11,1 mmol/L.' }
}

export function classifyPulse(p) {
  if (!p) return null
  const v = Number(p)
  if (v > 120 || v < 45) return { level: 'danger', label: v > 120 ? 'Rất nhanh' : 'Rất chậm' }
  if (v > 100) return { level: 'warn', label: 'Nhanh' }
  if (v < 60) return { level: 'warn', label: 'Chậm' }
  return { level: 'good', label: 'Bình thường' }
}

export function calcBMI(weight, heightCm) {
  if (!weight || !heightCm) return null
  const h = Number(heightCm) / 100
  const bmi = Number(weight) / (h * h)
  // Ngưỡng BMI cho người châu Á (WHO 2004)
  let label = 'Bình thường', level = 'good'
  if (bmi < 18.5) { label = 'Thiếu cân'; level = 'warn' }
  else if (bmi >= 25) { label = 'Béo phì'; level = 'high' }
  else if (bmi >= 23) { label = 'Thừa cân'; level = 'warn' }
  return { value: bmi.toFixed(1), label, level }
}

// ===== Dữ liệu mẫu cho lần mở đầu tiên =====
export function makeSampleData() {
  const today = todayKey()
  const notes = ['Sức khỏe ổn định', 'Ngủ ngon', 'Hơi mệt', 'Đi bộ 30 phút', 'Ăn nhạt hơn', '']
  const readings = []
  for (let i = 30; i >= 0; i -= 2) {
    const k = 30 - i
    readings.push({
      id: `sample-r-${i}`,
      date: addDays(today, -i),
      time: `08:${pad(10 + (k % 4) * 5)}`,
      sys: String(118 + ((k * 7) % 9)),
      dia: String(76 + ((k * 5) % 7)),
      pulse: String(70 + ((k * 3) % 6)),
      weight: (62.4 + ((k * 13) % 5) / 10).toFixed(1),
      note: notes[k % notes.length],
      ...(k % 4 === 0 ? { glucose: (5.2 + ((k * 3) % 8) / 10).toFixed(1), glucoseCtx: 'fasting' } : {}),
      sample: true,
    })
  }
  readings[readings.length - 1] = { ...readings[readings.length - 1], sys: '120', dia: '80', pulse: '72', weight: '62.5', time: '08:30', note: 'Sức khỏe ổn định' }
  const meds = [
    { id: 'sample-m-1', name: 'Amlodipine 5mg', qty: '1 viên', purpose: 'Huyết áp', times: ['08:00', '20:00'], note: 'Uống sau ăn', active: true, sample: true, createdAt: addDays(today, -30) },
    { id: 'sample-m-2', name: 'Metformin 500mg', qty: '1 viên', purpose: 'Tiểu đường', times: ['12:00'], note: 'Uống trong bữa ăn', active: true, sample: true, createdAt: addDays(today, -30) },
  ]
  return { readings, meds }
}

// ===== Thuốc =====
export const doseKey = (medId, time) => `${medId}@${time}`

/** Danh sách các lần uống trong một ngày, sắp xếp theo giờ */
export function dosesForDay(meds, dateKey) {
  const out = []
  meds.filter((m) => m.active !== false && (!m.createdAt || m.createdAt <= dateKey) && (!m.endDate || m.endDate >= dateKey))
    .forEach((m) => (m.times || []).forEach((t) => out.push({ med: m, time: t, key: doseKey(m.id, t) })))
  return out.sort((a, b) => a.time.localeCompare(b.time))
}
