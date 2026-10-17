// Hỏi đáp sức khỏe: ưu tiên gọi AI qua backend (/api/chat). Nếu chưa cấu hình backend
// hoặc mất mạng, dùng thư viện kiến thức ngoại tuyến bên dưới.

export const SUGGESTED_QUESTIONS = [
  'Huyết áp bao nhiêu là bình thường?',
  'Người tiểu đường nên ăn gì?',
  'Tập thể dục như thế nào là phù hợp?',
  'Khi nào cần đi khám bác sĩ?',
]

const EMERGENCY = ['đau ngực', 'tức ngực', 'khó thở', 'ngất', 'méo miệng', 'yếu liệt', 'liệt nửa', 'nói ngọng', 'co giật', 'nôn ra máu', 'tự tử', 'muốn chết']

const norm = (s) => s.toLowerCase().normalize('NFC')

const KB = [
  {
    keys: ['huyết áp bao nhiêu', 'huyết áp bình thường', 'chỉ số huyết áp', 'huyết áp chuẩn', 'huyết áp cao', 'tăng huyết áp', 'cao huyết áp'],
    answer: `**Mức huyết áp tham khảo ở người trưởng thành** (đo khi nghỉ ngơi):
• Tối ưu: dưới 120/80 mmHg
• Bình thường: 120–129 / 80–84 mmHg
• Bình thường cao: 130–139 / 85–89 mmHg
• Tăng huyết áp: từ 140/90 mmHg trở lên
• Huyết áp thấp: thường dưới 90/60 mmHg

**Đo đúng cách:** nghỉ 5 phút, ngồi tựa lưng, chân chạm sàn, không nói chuyện, không hút thuốc hay uống cà phê 30 phút trước khi đo. Nên đo 2 lần cách nhau 1–2 phút và ghi lại kết quả.

Nếu nhiều lần đo đều ≥140/90 mmHg, bạn nên đi khám để được bác sĩ đánh giá.`,
  },
  {
    keys: ['tiểu đường', 'đái tháo đường', 'đường huyết', 'đường máu'],
    answer: `**Gợi ý ăn uống cho người tiểu đường:**
• Ưu tiên rau xanh (chiếm khoảng ½ đĩa), đạm nạc (cá, thịt nạc, đậu phụ, trứng), tinh bột ít (khoảng ¼ đĩa).
• Chọn tinh bột hấp thu chậm: gạo lứt, yến mạch, khoai lang, bánh mì nguyên cám thay cho cơm trắng nhiều, bánh ngọt.
• Hạn chế đồ ngọt, nước ngọt, nước ép đóng hộp, trái cây quá ngọt (sầu riêng, mít, nhãn…); ăn trái cây nguyên quả, lượng vừa phải.
• Ăn đúng bữa, không bỏ bữa, đặc biệt khi đang dùng thuốc hạ đường huyết.
• Hạn chế rượu bia, đồ chiên rán, mỡ động vật.

Mỗi người có nhu cầu khác nhau — hãy hỏi bác sĩ hoặc chuyên gia dinh dưỡng để có thực đơn phù hợp.`,
  },
  {
    keys: ['đường huyết bao nhiêu', 'đường huyết bình thường', 'chỉ số đường huyết', 'đường huyết lúc đói', 'đường huyết sau ăn', 'hạ đường huyết', 'đo đường huyết'],
    answer: `**Mức đường huyết tham khảo** (người chưa được chẩn đoán tiểu đường, đơn vị mmol/L):
• Lúc đói (nhịn ăn ít nhất 8 giờ): bình thường dưới 5,6; từ 5,6–6,9 là rối loạn đường huyết lúc đói (tiền đái tháo đường); từ 7,0 trở lên là cao.
• Sau ăn 2 giờ: bình thường dưới 7,8; từ 7,8–11,0 là hơi cao; từ 11,1 trở lên là cao.
• Dưới 3,9 là **hạ đường huyết**: ăn hoặc uống ngay chút đồ ngọt (nước đường, nước trái cây), đo lại sau 15 phút.

Đổi đơn vị: mg/dL ÷ 18 = mmol/L (ví dụ 126 mg/dL = 7,0 mmol/L).

**Người đang điều trị tiểu đường** thường có mục tiêu riêng do bác sĩ đặt (hay gặp: lúc đói 4,4–7,2; sau ăn dưới 10). Chỉ bác sĩ mới chẩn đoán được tiểu đường dựa trên xét nghiệm.`,
  },
  {
    keys: ['tập thể dục', 'vận động', 'thể dục', 'đi bộ', 'tập luyện', 'chạy bộ', 'tập gym'],
    answer: `**Khuyến nghị vận động cho người trưởng thành (WHO):**
• Ít nhất 150–300 phút/tuần vận động cường độ vừa (đi bộ nhanh, đạp xe, bơi), ví dụ 30 phút × 5 ngày.
• Thêm bài tập tăng cơ 2 ngày/tuần (squat, chống đẩy nhẹ, dây kháng lực).
• Người lớn tuổi nên có bài tập thăng bằng (đứng một chân, đi trên đường thẳng) để phòng té ngã.

**Lưu ý:** khởi động 5–10 phút, tăng dần cường độ. Dừng tập và đi khám nếu thấy đau ngực, khó thở bất thường, chóng mặt. Người có bệnh tim mạch, tiểu đường nên hỏi bác sĩ trước khi bắt đầu chương trình mới.`,
  },
  {
    keys: ['khi nào cần đi khám', 'khi nào đi khám', 'đi khám bác sĩ', 'khám bác sĩ', 'khám sức khỏe', 'đi khám'],
    answer: `**Nên đi khám sớm khi:**
• Huyết áp nhiều lần ≥140/90 mmHg, hoặc thấp kèm chóng mặt, mệt lả.
• Nhịp tim lúc nghỉ thường xuyên >100 hoặc <50 lần/phút, hồi hộp, đánh trống ngực.
• Sụt cân không rõ lý do, sốt kéo dài, ho kéo dài trên 2–3 tuần.
• Triệu chứng mới hoặc nặng dần, tác dụng phụ khi dùng thuốc.

**Gọi cấp cứu 115 ngay khi:** đau ngực dữ dội, khó thở, ngất, méo miệng, yếu/liệt tay chân, nói khó đột ngột, co giật.

Ngoài ra, người trưởng thành nên khám sức khỏe định kỳ ít nhất mỗi năm một lần.`,
  },
  {
    keys: ['nhịp tim', 'mạch', 'tim đập', 'hồi hộp', 'bpm'],
    answer: `**Nhịp tim lúc nghỉ** của người trưởng thành thường từ **60–100 lần/phút**. Người hay tập thể thao có thể thấp hơn (50–60) mà vẫn bình thường.

Nhịp tim có thể tăng tạm thời khi vận động, lo lắng, sốt, uống cà phê. Nên đo khi đã nghỉ ngơi 5 phút.

Hãy đi khám nếu nhịp tim lúc nghỉ thường xuyên >100 hoặc <50 lần/phút, hoặc kèm chóng mặt, ngất, đau ngực, khó thở.`,
  },
  {
    keys: ['cân nặng', 'bmi', 'giảm cân', 'béo phì', 'thừa cân', 'tăng cân'],
    answer: `**Chỉ số BMI** = cân nặng (kg) ÷ [chiều cao (m)]². Với người châu Á:
• Dưới 18,5: thiếu cân
• 18,5–22,9: bình thường
• 23–24,9: thừa cân
• Từ 25: béo phì

Bạn có thể nhập chiều cao trong **Cài đặt → Hồ sơ** để ứng dụng tự tính BMI.

Giảm cân an toàn khoảng 0,5–1 kg/tuần: ăn đủ rau, giảm đồ ngọt và chiên rán, ngủ đủ, vận động đều đặn.`,
  },
  {
    keys: ['quên uống thuốc', 'quên thuốc', 'uống bù', 'bỏ thuốc', 'ngừng thuốc'],
    answer: `**Nếu quên một liều thuốc:** cách xử lý tùy từng loại thuốc. Hãy xem hướng dẫn trong tờ thông tin thuốc hoặc hỏi dược sĩ/bác sĩ. **Không tự ý uống gấp đôi liều** để bù.

Không tự ngừng hoặc đổi liều thuốc huyết áp, tiểu đường khi chưa hỏi bác sĩ, kể cả khi chỉ số đã ổn.

Mẹo: dùng mục **Nhắc thuốc** và bật thông báo trong **Cài đặt**, để thuốc ở nơi dễ thấy, gắn việc uống thuốc với thói quen cố định (sau bữa sáng…).`,
  },
  {
    keys: ['muối', 'ăn mặn', 'ăn uống', 'chế độ ăn', 'ăn gì', 'dinh dưỡng'],
    answer: `**Ăn uống lành mạnh cho tim mạch:**
• Giảm muối: dưới 5 g muối/ngày (khoảng 1 thìa cà phê), hạn chế nước chấm, mì gói, đồ muối chua, thực phẩm chế biến sẵn.
• Nhiều rau xanh, trái cây, ngũ cốc nguyên hạt, đậu.
• Ưu tiên cá, thịt gia cầm bỏ da; hạn chế mỡ động vật, nội tạng, đồ chiên.
• Hạn chế rượu bia, đồ ngọt; uống đủ nước.`,
  },
  {
    keys: ['ngủ', 'mất ngủ', 'khó ngủ', 'giấc ngủ'],
    answer: `**Người trưởng thành nên ngủ 7–9 giờ mỗi đêm.** Gợi ý ngủ ngon:
• Đi ngủ và thức dậy cùng giờ mỗi ngày.
• Tránh cà phê, trà đặc sau 14 giờ; tránh ăn no, rượu bia trước khi ngủ.
• Tắt màn hình điện thoại 30–60 phút trước giờ ngủ; phòng ngủ tối, yên tĩnh, mát.

Nếu mất ngủ kéo dài trên 3 tuần, ngáy to kèm ngưng thở khi ngủ, hãy đi khám.`,
  },
  {
    keys: ['uống nước', 'bao nhiêu nước', 'nước mỗi ngày'],
    answer: `Người trưởng thành khỏe mạnh thường cần khoảng **1,5–2 lít nước/ngày** (gồm cả nước từ canh, sữa, trái cây), nhiều hơn khi trời nóng hoặc vận động.

Người bệnh tim, thận có thể cần hạn chế nước theo chỉ định của bác sĩ.`,
  },
]

export function offlineAnswer(question) {
  const q = norm(question)
  if (EMERGENCY.some((k) => q.includes(k))) {
    return `⚠️ **Đây có thể là tình huống khẩn cấp.** Nếu bạn hoặc người thân đang bị đau ngực, khó thở, ngất, méo miệng, yếu liệt tay chân, nói khó, co giật — **hãy gọi cấp cứu 115 ngay** hoặc đến cơ sở y tế gần nhất. Không chờ đợi xem triệu chứng có tự hết không.

Nếu bạn đang có ý nghĩ làm hại bản thân, hãy nói ngay với người thân bên cạnh hoặc gọi đường dây hỗ trợ/cấp cứu tại địa phương.`
  }
  let best = null, bestScore = 0
  for (const item of KB) {
    const score = item.keys.reduce((s, k) => s + (q.includes(k) ? k.length : 0), 0)
    if (score > bestScore) { best = item; bestScore = score }
  }
  if (best) return best.answer
  return `Mình chưa có sẵn thông tin cho câu hỏi này trong thư viện ngoại tuyến. Bạn có thể thử hỏi về: huyết áp, nhịp tim, cân nặng/BMI, chế độ ăn, tiểu đường, tập thể dục, giấc ngủ, quên uống thuốc, khi nào cần đi khám.

Khi ứng dụng được kết nối AI (xem hướng dẫn trong README), mình sẽ trả lời được nhiều câu hỏi hơn.`
}

/**
 * Gửi câu hỏi. Trả về { text, source: 'ai' | 'offline' }
 * @param history mảng {role, text}
 * @param context chuỗi mô tả chỉ số gần nhất (chỉ gửi khi người dùng cho phép)
 */
export async function askHealthAI(history, context) {
  const lastQuestion = history[history.length - 1]?.text || ''
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 30000)
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: history.slice(-12).map((m) => ({ role: m.role, content: m.text })),
        context: context || '',
      }),
      signal: controller.signal,
    })
    clearTimeout(timer)
    if (!res.ok) throw new Error('backend unavailable')
    const data = await res.json()
    if (!data.text) throw new Error('empty')
    return { text: data.text, source: 'ai' }
  } catch {
    await new Promise((r) => setTimeout(r, 500))
    return { text: offlineAnswer(lastQuestion), source: 'offline' }
  }
}
