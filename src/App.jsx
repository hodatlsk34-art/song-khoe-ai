import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AppContext } from './AppContext.js'
import { loadData, saveData, clearAppData } from './lib/storage.js'
import { DEFAULT_MEMBER_ID, MEMBER_COLORS, memberOf, makeSampleData, sortReadings, todayKey, toTimeStr, dosesForDay } from './lib/health.js'
import BottomNav from './components/BottomNav.jsx'
import Toast from './components/Toast.jsx'
import HomeScreen from './screens/HomeScreen.jsx'
import AddReadingScreen from './screens/AddReadingScreen.jsx'
import HistoryScreen from './screens/HistoryScreen.jsx'
import MedsScreen from './screens/MedsScreen.jsx'
import AskAIScreen from './screens/AskAIScreen.jsx'
import SettingsScreen from './screens/SettingsScreen.jsx'

const TAB_OF = { home: 'home', add: 'history', history: 'history', meds: 'meds', ai: 'ai', settings: 'settings' }

function initialData() {
  const initialized = loadData('initialized', false)
  if (initialized) {
    return { readings: loadData('readings', []), meds: loadData('meds', []) }
  }
  const sample = makeSampleData()
  saveData('initialized', true)
  return sample
}

export default function App() {
  const [init] = useState(initialData)
  const [readings, setReadings] = useState(init.readings)
  const [meds, setMeds] = useState(init.meds)
  const [intakes, setIntakes] = useState(() => loadData('intakes', {}))
  const [chat, setChat] = useState(() => loadData('chat', []))
  // ===== Thành viên gia đình =====
  const [members, setMembers] = useState(() => {
    const saved = loadData('members', null)
    if (saved && saved.length) return saved
    const old = loadData('profile', { name: '', heightCm: '', birthYear: '' }) // chuyển hồ sơ cũ sang thành viên đầu tiên
    return [{ id: DEFAULT_MEMBER_ID, name: old.name || '', relation: 'Tôi', heightCm: old.heightCm || '', birthYear: old.birthYear || '', color: MEMBER_COLORS[0] }]
  })
  const [activeMemberId, setActiveMemberId] = useState(() => loadData('activeMember', DEFAULT_MEMBER_ID))
  const activeMember = members.find((m) => m.id === activeMemberId) || members[0]
  const profile = activeMember
  const setProfile = useCallback((next) => setMembers((list) => list.map((m) => (m.id === activeMember.id ? { ...m, ...next } : m))), [activeMember.id])
  const [settings, setSettings] = useState(() => loadData('settings', { notify: false, shareReadingsWithAI: false }))
  const [stack, setStack] = useState([{ name: 'home', params: {} }])
  const [toast, setToast] = useState(null)
  const toastTimer = useRef()

  useEffect(() => { saveData('readings', readings) }, [readings])
  useEffect(() => { saveData('meds', meds) }, [meds])
  useEffect(() => { saveData('intakes', intakes) }, [intakes])
  useEffect(() => { saveData('chat', chat) }, [chat])
  useEffect(() => { saveData('members', members) }, [members])
  useEffect(() => { saveData('activeMember', activeMember.id) }, [activeMember.id])
  useEffect(() => { saveData('settings', settings) }, [settings])

  const current = stack[stack.length - 1]

  // ===== Giao diện sáng/tối =====
  const [systemDark, setSystemDark] = useState(() => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false)
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)')
    if (!mq) return
    const on = (e) => setSystemDark(e.matches)
    mq.addEventListener?.('change', on)
    return () => mq.removeEventListener?.('change', on)
  }, [])
  const theme = settings.theme || 'auto'
  const isDark = theme === 'dark' || (theme === 'auto' && systemDark)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', isDark ? '#111816' : '#14907f')
  }, [isDark])

  const showToast = useCallback((message, type = 'success', duration = 3200) => {
    clearTimeout(toastTimer.current)
    setToast({ message, type, id: Date.now() })
    toastTimer.current = setTimeout(() => setToast(null), duration)
  }, [])

  /** Điều hướng: tab gốc thay thế toàn bộ stack, màn hình con được đẩy vào stack */
  const go = useCallback((name, params = {}) => {
    const roots = ['home', 'history', 'meds', 'ai', 'settings']
    setStack((s) => (roots.includes(name) ? [{ name: 'home', params: {} }, ...(name === 'home' ? [] : [{ name, params }])] : [...s, { name, params }]))
    if (name !== 'home') window.history.pushState({ sk: true }, '')
    window.scrollTo(0, 0)
  }, [])
  const popScreen = useCallback(() => {
    setStack((s) => (s.length > 1 ? s.slice(0, -1) : s))
    window.scrollTo(0, 0)
  }, [])
  const back = useCallback(() => {
    if (window.history.state?.sk) window.history.back() // popstate sẽ gọi popScreen
    else popScreen()
  }, [popScreen])

  // Nút "quay lại" của trình duyệt / điện thoại Android
  useEffect(() => {
    window.addEventListener('popstate', popScreen)
    return () => window.removeEventListener('popstate', popScreen)
  }, [popScreen])

  const mine = useCallback((item) => memberOf(item) === activeMember.id, [activeMember.id])
  const sortedReadings = useMemo(() => sortReadings(readings.filter(mine)), [readings, mine])
  const myMeds = useMemo(() => meds.filter(mine), [meds, mine])
  const memberName = useCallback((id) => {
    const m = members.find((x) => x.id === id)
    return m ? (m.name || m.relation || 'Tôi') : ''
  }, [members])

  // ===== Nhắc thuốc khi ứng dụng đang mở =====
  const notified = useRef(new Set())
  useEffect(() => {
    const check = () => {
      const day = todayKey()
      const now = toTimeStr()
      const taken = intakes[day] || {}
      dosesForDay(meds, day).forEach((d) => {
        const id = `${day}|${d.key}`
        if (d.time === now && !taken[d.key] && !notified.current.has(id)) {
          notified.current.add(id)
          const who = members.length > 1 ? `${memberName(memberOf(d.med))}: ` : ''
          const body = `${who}${d.med.name} · ${d.med.qty || ''} · ${d.time}`
          showToast(`⏰ Đến giờ uống thuốc — ${who}${d.med.name} (${d.time})`, 'info', 10000)
          if (settings.notify && 'Notification' in window && Notification.permission === 'granted') {
            const opts = { body, icon: '/icon.svg', badge: '/icon.svg', tag: id }
            navigator.serviceWorker?.getRegistration().then((reg) => {
              if (reg) reg.showNotification('Đến giờ uống thuốc', opts)
              else new Notification('Đến giờ uống thuốc', opts)
            }).catch(() => { try { new Notification('Đến giờ uống thuốc', opts) } catch { /* bỏ qua */ } })
          }
        }
      })
    }
    check()
    const timer = setInterval(check, 15000)
    return () => clearInterval(timer)
  }, [meds, intakes, settings.notify, showToast, members, memberName])

  const toggleIntake = useCallback((day, key) => {
    setIntakes((old) => {
      const dayLog = { ...(old[day] || {}) }
      if (dayLog[key]) delete dayLog[key]
      else dayLog[key] = new Date().toISOString()
      return { ...old, [day]: dayLog }
    })
  }, [])

  const wipeAll = useCallback(() => {
    clearAppData()
    saveData('initialized', true)
    setReadings([]); setMeds([]); setIntakes({}); setChat([])
    setMembers([{ id: DEFAULT_MEMBER_ID, name: '', relation: 'Tôi', heightCm: '', birthYear: '', color: MEMBER_COLORS[0] }])
    setActiveMemberId(DEFAULT_MEMBER_ID)
    setSettings({ notify: false, shareReadingsWithAI: false })
  }, [])

  const ctx = {
    readings, setReadings, sortedReadings,
    meds: myMeds, allMeds: meds, setMeds, intakes,
    members, setMembers, activeMember, setActiveMemberId, memberName, setIntakes, toggleIntake,
    chat, setChat, profile, setProfile, settings, setSettings,
    go, back, showToast, wipeAll, params: current.params,
  }

  const screens = {
    home: HomeScreen, add: AddReadingScreen, history: HistoryScreen,
    meds: MedsScreen, ai: AskAIScreen, settings: SettingsScreen,
  }
  const Screen = screens[current.name] || HomeScreen

  return (
    <AppContext.Provider value={ctx}>
      <div className={`app font-${settings.fontSize || 'normal'}`}>
        <main className={`screen screen-${current.name}`} key={`${current.name}-${stack.length}`}>
          <Screen />
        </main>
        <BottomNav active={TAB_OF[current.name]} onChange={go} />
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      </div>
    </AppContext.Provider>
  )
}
