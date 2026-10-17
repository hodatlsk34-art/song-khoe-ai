import { useEffect, useRef, useState } from 'react'
import { Bell, Download, FileSpreadsheet, Info, ShieldCheck, Sparkles, Trash2, Upload, User, Smartphone } from 'lucide-react'
import { useApp } from '../AppContext.js'
import { Confirm, ScreenHeader, Switch } from '../components/ui.jsx'
import { downloadFile } from '../lib/storage.js'
import { calcBMI, sortReadings, todayKey } from '../lib/health.js'

export default function SettingsScreen() {
  const app = useApp()
  const { profile, setProfile, settings, setSettings, readings, meds, intakes, chat, back, showToast, wipeAll, setReadings, setMeds, setIntakes, setChat, sortedReadings } = app
  const [confirm, setConfirm] = useState(null)
  const [aiStatus, setAiStatus] = useState('checking')
  const [installEvt, setInstallEvt] = useState(null)
  const fileRef = useRef()

  useEffect(() => {
    fetch('/api/health').then((r) => (r.ok ? r.json() : Promise.reject())).then((d) => setAiStatus(d.ai ? 'online' : 'nokey')).catch(() => setAiStatus('offline'))
    const onPrompt = (e) => { e.preventDefault(); setInstallEvt(e) }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  const latestW = sortedReadings.find((r) => r.weight)
  const bmi = latestW && calcBMI(latestW.weight, profile.heightCm)
  const sampleCount = readings.filter((r) => r.sample).length + meds.filter((m) => m.sample).length

  async function toggleNotify(on) {
    if (!on) { setSettings({ ...settings, notify: false }); return }
    if (!('Notification' in window)) { showToast('Trình duyệt này không hỗ trợ thông báo.', 'warn'); return }
    const perm = await Notification.requestPermission()
    if (perm === 'granted') {
      setSettings({ ...settings, notify: true })
      showToast('Đã bật thông báo nhắc thuốc.')
    } else showToast('Bạn chưa cho phép thông báo. Hãy bật trong cài đặt trình duyệt.', 'warn', 6000)
  }

  function exportJSON() {
    const data = { app: 'song-khoe-ai', version: 1, exportedAt: new Date().toISOString(), readings, meds, intakes, chat, profile, settings }
    downloadFile(`song-khoe-ai-sao-luu-${todayKey()}.json`, JSON.stringify(data, null, 2))
    showToast('Đã tải file sao lưu.')
  }

  function exportCSV() {
    const rows = [['Ngày', 'Giờ', 'Tâm thu (mmHg)', 'Tâm trương (mmHg)', 'Nhịp tim (bpm)', 'Cân nặng (kg)', 'Ghi chú']]
    sortReadings(readings).forEach((r) => rows.push([r.date, r.time, r.sys, r.dia, r.pulse, r.weight, r.note]))
    const csv = '﻿' + rows.map((row) => row.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n')
    downloadFile(`chi-so-suc-khoe-${todayKey()}.csv`, csv, 'text/csv;charset=utf-8')
    showToast('Đã xuất file CSV (mở được bằng Excel).')
  }

  function importJSON(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const d = JSON.parse(reader.result)
        if (d.app !== 'song-khoe-ai' || !Array.isArray(d.readings)) throw new Error()
        setConfirm({
          title: 'Khôi phục dữ liệu?',
          message: `File có ${d.readings.length} bản ghi chỉ số và ${(d.meds || []).length} thuốc. Dữ liệu hiện tại sẽ được thay thế.`,
          confirmText: 'Khôi phục',
          action: () => {
            setReadings(d.readings); setMeds(d.meds || []); setIntakes(d.intakes || {}); setChat(d.chat || [])
            if (d.profile) setProfile(d.profile)
            showToast('Đã khôi phục dữ liệu.')
          },
        })
      } catch { showToast('File không hợp lệ. Hãy chọn file sao lưu của Sống Khỏe AI.', 'error') }
    }
    reader.readAsText(file)
  }

  const statusText = {
    checking: ['Đang kiểm tra…', ''],
    online: ['Đã kết nối AI', 'ok'],
    nokey: ['Máy chủ chưa có khóa API — dùng thư viện ngoại tuyến', 'pending'],
    offline: ['Chưa kết nối máy chủ AI — dùng thư viện ngoại tuyến', 'pending'],
  }[aiStatus]

  return (
    <div className="settings">
      <ScreenHeader title="Cài đặt" onBack={back} />

      <section className="card settings-group">
        <h3><User size={18} /> Hồ sơ</h3>
        <label>Tên gọi<input value={profile.name} maxLength={30} onChange={(e) => setProfile({ ...profile, name: e.target.value })} placeholder="Ví dụ: Lan" /></label>
        <div className="row-2">
          <label>Năm sinh<input type="number" inputMode="numeric" value={profile.birthYear} onChange={(e) => setProfile({ ...profile, birthYear: e.target.value })} placeholder="1965" /></label>
          <label>Chiều cao (cm)<input type="number" inputMode="numeric" value={profile.heightCm} onChange={(e) => setProfile({ ...profile, heightCm: e.target.value })} placeholder="158" /></label>
        </div>
        {bmi && <p className="hint">BMI hiện tại: <strong>{bmi.value}</strong> — <span className={`chip chip-${bmi.level}`}>{bmi.label}</span> (ngưỡng người châu Á)</p>}
      </section>

      <section className="card settings-group">
        <h3><Bell size={18} /> Thông báo</h3>
        <div className="setting-row">
          <div><strong>Nhắc giờ uống thuốc</strong><span>Hiện thông báo khi đến giờ uống thuốc</span></div>
          <Switch checked={settings.notify} onChange={toggleNotify} label="Bật thông báo" />
        </div>
        <p className="hint"><Info size={14} /> Trên trình duyệt, thông báo chỉ hoạt động khi ứng dụng đang mở (có thể chạy nền ở tab khác). Hãy cài ứng dụng ra màn hình chính để tiện dùng hơn.</p>
        {installEvt && (
          <button className="btn btn-outline btn-block" onClick={async () => { installEvt.prompt(); await installEvt.userChoice; setInstallEvt(null) }}>
            <Smartphone size={18} /> Cài ứng dụng ra màn hình chính
          </button>
        )}
      </section>

      <section className="card settings-group">
        <h3><Sparkles size={18} /> Trợ lý AI</h3>
        <div className={`status-line ${statusText[1]}`}><i /> {statusText[0]}</div>
        <div className="setting-row">
          <div><strong>Gửi chỉ số gần nhất kèm câu hỏi</strong><span>Giúp AI trả lời sát với tình trạng của bạn (chỉ khi đã kết nối AI)</span></div>
          <Switch checked={settings.shareReadingsWithAI} onChange={(v) => setSettings({ ...settings, shareReadingsWithAI: v })} label="Chia sẻ chỉ số với AI" />
        </div>
      </section>

      <section className="card settings-group">
        <h3><ShieldCheck size={18} /> Dữ liệu & quyền riêng tư</h3>
        <p className="hint">Mọi dữ liệu được lưu trên trình duyệt của thiết bị này, không gửi lên máy chủ. Hãy sao lưu định kỳ để tránh mất dữ liệu.</p>
        <div className="btn-grid">
          <button className="btn btn-outline" onClick={exportJSON}><Download size={17} /> Sao lưu</button>
          <button className="btn btn-outline" onClick={() => fileRef.current.click()}><Upload size={17} /> Khôi phục</button>
          <button className="btn btn-outline" onClick={exportCSV}><FileSpreadsheet size={17} /> Xuất Excel (CSV)</button>
          {sampleCount > 0 && (
            <button className="btn btn-outline" onClick={() => {
              setReadings((r) => r.filter((x) => !x.sample)); setMeds((m) => m.filter((x) => !x.sample))
              showToast('Đã xóa dữ liệu mẫu.')
            }}><Trash2 size={17} /> Xóa dữ liệu mẫu</button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={importJSON} />
        <button className="btn btn-danger-soft btn-block" onClick={() => setConfirm({
          title: 'Xóa toàn bộ dữ liệu?',
          message: 'Tất cả chỉ số, thuốc, lịch sử uống thuốc và hội thoại trên thiết bị này sẽ bị xóa. Không thể hoàn tác.',
          confirmText: 'Xóa tất cả', danger: true,
          action: () => { wipeAll(); showToast('Đã xóa toàn bộ dữ liệu.') },
        })}><Trash2 size={17} /> Xóa toàn bộ dữ liệu</button>
      </section>

      <section className="about">
        <strong>Sống Khỏe AI</strong> · Phiên bản 1.0.0
        <p>Ứng dụng hỗ trợ theo dõi sức khỏe cá nhân và gia đình. Thông tin trong ứng dụng chỉ mang tính tham khảo, không thay thế chẩn đoán và điều trị của bác sĩ. Khi có dấu hiệu cấp cứu, hãy gọi <strong>115</strong>.</p>
      </section>

      {confirm && (
        <Confirm title={confirm.title} message={confirm.message} confirmText={confirm.confirmText} danger={confirm.danger}
          onConfirm={() => { confirm.action(); setConfirm(null) }} onCancel={() => setConfirm(null)} />
      )}
    </div>
  )
}
