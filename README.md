# Sống Khỏe AI — Đồng hành cùng sức khỏe gia đình

Ứng dụng web (PWA, cài được lên điện thoại) giúp theo dõi chỉ số sức khỏe, nhắc uống thuốc và hỏi đáp sức khỏe. Giao diện tối ưu cho điện thoại, trên máy tính hiển thị dạng khung điện thoại ở giữa màn hình.

## Tính năng
| Màn hình | Chức năng |
|---|---|
| **Trang chủ** | Lời chào theo tên & buổi trong ngày, 4 thẻ chỉ số gần nhất (huyết áp, nhịp tim, cân nặng, ghi chú) kèm đánh giá, tiến độ uống thuốc hôm nay, tiện ích nhanh |
| **Nhập chỉ số** | Ngày/giờ đo, huyết áp (tâm thu/tâm trương), nhịp tim, cân nặng, ghi chú; đánh giá ngay khi nhập; kiểm tra dữ liệu hợp lệ; cảnh báo khi huyết áp rất cao; sửa bản ghi cũ |
| **Lịch sử chỉ số** | Tab Huyết áp / Nhịp tim / Cân nặng; lọc 7 ngày, 30 ngày, 3 tháng, 1 năm; biểu đồ đường (chạm để xem giá trị); thống kê trung bình/cao nhất/BMI; danh sách bản ghi có Sửa/Xóa |
| **Nhắc thuốc** | Tab Hôm nay / Tất cả thuốc; chuyển ngày; đánh dấu "Uống" ↔ "Đã uống"; báo "Quá giờ"; thêm/sửa/tạm dừng/xóa thuốc, nhiều giờ uống/ngày; mẹo nhỏ; thông báo khi đến giờ |
| **Hỏi AI sức khỏe** | Câu hỏi gợi ý, khung chat, lịch sử cuộc trò chuyện; nhận diện dấu hiệu khẩn cấp → khuyên gọi 115; dùng AI thật nếu đã cấu hình, nếu không dùng thư viện kiến thức ngoại tuyến |
| **Cài đặt** | Hồ sơ (tên, năm sinh, chiều cao → BMI), bật thông báo, trạng thái AI, sao lưu/khôi phục JSON, xuất Excel (CSV), xóa dữ liệu mẫu / toàn bộ dữ liệu |

Lần đầu mở, ứng dụng có **dữ liệu mẫu** để xem thử — bấm "Xóa dữ liệu mẫu" ở Trang chủ hoặc Cài đặt để bắt đầu dùng thật.

## Chạy thử trên máy (cần Node.js 18+)
```bash
npm install
npm run dev          # mở http://localhost:5173 (chưa có AI thật, dùng thư viện ngoại tuyến)
```

## Bật AI thật (Claude)
Khóa API được giữ ở máy chủ, **không bao giờ đặt trong mã giao diện**.
```bash
npm run build
ANTHROPIC_API_KEY=sk-ant-xxx npm start     # mở http://localhost:8787
# Windows PowerShell:  $env:ANTHROPIC_API_KEY="sk-ant-xxx"; npm start
```
Tùy chọn: `AI_MODEL` (mặc định `claude-haiku-5-5`), `PORT` (mặc định 8787).
Khi phát triển: chạy `npm run dev:server` (kèm biến khóa API) ở một cửa sổ và `npm run dev` ở cửa sổ khác — Vite tự chuyển `/api` sang máy chủ.

## Đưa lên mạng
- **Chỉ giao diện (không AI thật):** `npm run build` rồi tải thư mục `dist/` lên Netlify, Vercel, GitHub Pages…
- **Có AI thật:** triển khai cả dự án lên dịch vụ chạy Node (Render, Railway, VPS…): lệnh build `npm install && npm run build`, lệnh chạy `npm start`, thêm biến môi trường `ANTHROPIC_API_KEY`.
- Cần HTTPS để cài ứng dụng ra màn hình chính và nhận thông báo.

## Cấu trúc
```
server/index.js          Máy chủ: phục vụ dist/ + API /api/chat (proxy tới Claude, giới hạn 20 câu/5 phút/IP)
public/                  icon, manifest (PWA), service worker
src/App.jsx              Trạng thái chung, điều hướng, nhắc thuốc theo giờ
src/screens/             6 màn hình
src/components/          Thanh điều hướng, biểu đồ, hình minh họa, bảng trượt, menu…
src/lib/health.js        Ngày giờ, phân loại huyết áp/nhịp tim/BMI, dữ liệu mẫu
src/lib/ai.js            Gọi AI + thư viện kiến thức ngoại tuyến
src/lib/storage.js       Lưu trữ localStorage
```

## Giới hạn cần biết
- Dữ liệu lưu trong trình duyệt của từng thiết bị (chưa có tài khoản/đồng bộ). Xóa dữ liệu trình duyệt sẽ mất dữ liệu → hãy dùng **Sao lưu** định kỳ.
- Thông báo nhắc thuốc chỉ chạy khi ứng dụng đang mở (kể cả ở tab nền). Muốn nhắc cả khi đã đóng cần thêm Web Push có máy chủ hoặc đóng gói thành app native.
- Phân loại huyết áp theo khuyến cáo Hội Tim mạch học Việt Nam/ESC; BMI theo ngưỡng người châu Á. Mọi thông tin chỉ mang tính tham khảo, không thay thế chẩn đoán của bác sĩ.
