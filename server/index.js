// Máy chủ nhỏ cho Sống Khỏe AI (không cần cài thêm thư viện, chỉ cần Node.js 18+)
// - Phục vụ bản build trong thư mục dist/
// - Cung cấp API /api/chat: chuyển câu hỏi tới Claude API, giữ khóa API ở phía máy chủ
//
// Cấu hình bằng biến môi trường:
//   ANTHROPIC_API_KEY   khóa API (bắt buộc nếu muốn dùng AI thật)
//   AI_MODEL            tên model, mặc định: claude-haiku-5-5
//   PORT                cổng, mặc định 8787

import http from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const PORT = Number(process.env.PORT || 8787)
const API_KEY = process.env.ANTHROPIC_API_KEY || ''
const MODEL = process.env.AI_MODEL || 'claude-haiku-5-5'
const DIST = fileURLToPath(new URL('../dist/', import.meta.url))

const SYSTEM_PROMPT = `Bạn là "Trợ lý Sống Khỏe", trợ lý thông tin sức khỏe trong ứng dụng Sống Khỏe AI dành cho người Việt Nam và gia đình.
Nguyên tắc:
- Luôn trả lời bằng tiếng Việt, ngắn gọn, dễ hiểu với người lớn tuổi; dùng gạch đầu dòng "•" khi liệt kê, in đậm ý chính bằng **...**.
- Chỉ cung cấp thông tin sức khỏe phổ thông, dựa trên khuyến cáo y khoa được công nhận (Bộ Y tế Việt Nam, WHO, các hội chuyên ngành).
- Không chẩn đoán bệnh, không kê đơn, không đưa ra liều thuốc cụ thể, không khuyên ngừng/đổi thuốc; hướng người dùng hỏi bác sĩ hoặc dược sĩ.
- Nếu có dấu hiệu khẩn cấp (đau ngực, khó thở, ngất, yếu liệt, méo miệng, nói khó, co giật, huyết áp ≥180/110 kèm triệu chứng, ý định tự hại) phải khuyên gọi cấp cứu 115 ngay ở đầu câu trả lời.
- Nếu không chắc chắn, hãy nói rõ là chưa chắc.
- Kết thúc bằng một câu nhắc ngắn rằng thông tin chỉ để tham khảo khi câu hỏi liên quan đến điều trị.`

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.ico': 'image/x-icon',
}

// Giới hạn tần suất đơn giản theo IP: 20 câu hỏi / 5 phút
const hits = new Map()
function rateLimited(ip) {
  const now = Date.now()
  const list = (hits.get(ip) || []).filter((t) => now - t < 5 * 60 * 1000)
  list.push(now)
  hits.set(ip, list)
  return list.length > 20
}

function sendJSON(res, code, data) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(data))
}

async function readBody(req, limit = 50_000) {
  let size = 0
  const chunks = []
  for await (const c of req) {
    size += c.length
    if (size > limit) throw new Error('too large')
    chunks.push(c)
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')
}

async function handleChat(req, res) {
  if (!API_KEY) return sendJSON(res, 503, { error: 'AI chưa được cấu hình (thiếu ANTHROPIC_API_KEY).' })
  if (rateLimited(req.socket.remoteAddress)) return sendJSON(res, 429, { error: 'Bạn hỏi quá nhanh, vui lòng thử lại sau ít phút.' })
  let body
  try { body = await readBody(req) } catch { return sendJSON(res, 400, { error: 'Dữ liệu không hợp lệ.' }) }

  const messages = (Array.isArray(body.messages) ? body.messages : [])
    .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .slice(-12)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }))
  while (messages.length && messages[0].role !== 'user') messages.shift()
  if (!messages.length || messages[messages.length - 1].role !== 'user') return sendJSON(res, 400, { error: 'Thiếu câu hỏi.' })

  const context = typeof body.context === 'string' && body.context.trim()
    ? `\n\nThông tin người dùng tự nhập trong ứng dụng (chỉ để tham khảo, không dùng để chẩn đoán):\n${body.context.slice(0, 1500)}`
    : ''

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: MODEL, max_tokens: 900, system: SYSTEM_PROMPT + context, messages }),
    })
    const data = await r.json()
    if (!r.ok) {
      console.error('Lỗi Claude API:', r.status, data?.error?.message)
      return sendJSON(res, 502, { error: 'Không gọi được AI.' })
    }
    const text = (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim()
    return sendJSON(res, 200, { text })
  } catch (e) {
    console.error('Lỗi kết nối AI:', e.message)
    return sendJSON(res, 502, { error: 'Không kết nối được AI.' })
  }
}

async function serveStatic(req, res) {
  const url = new URL(req.url, 'http://x')
  let path = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '')
  let file = join(DIST, path)
  try {
    if (!file.startsWith(DIST) || !(await stat(file)).isFile()) throw new Error()
  } catch {
    file = join(DIST, 'index.html') // SPA: trả về index.html
  }
  try {
    const data = await readFile(file)
    const ext = extname(file)
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': file.includes('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache',
    })
    res.end(data)
  } catch {
    res.writeHead(404).end('Chưa có bản build. Hãy chạy: npm run build')
  }
}

http.createServer(async (req, res) => {
  if (req.url === '/api/health') return sendJSON(res, 200, { ok: true, ai: Boolean(API_KEY), model: API_KEY ? MODEL : null })
  if (req.url === '/api/chat' && req.method === 'POST') return handleChat(req, res)
  if (req.url.startsWith('/api/')) return sendJSON(res, 404, { error: 'Không tìm thấy.' })
  return serveStatic(req, res)
}).listen(PORT, () => {
  console.log(`Sống Khỏe AI đang chạy tại http://localhost:${PORT}`)
  console.log(API_KEY ? `AI: đã bật (model ${MODEL})` : 'AI: chưa có ANTHROPIC_API_KEY → ứng dụng dùng thư viện kiến thức ngoại tuyến')
})
