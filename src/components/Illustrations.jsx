/** Tranh phong cảnh nhẹ nhàng cho thẻ chào (đồi xanh, lá cây) */
export function GreetingScene() {
  return (
    <svg className="greeting-scene" viewBox="0 0 360 120" preserveAspectRatio="xMaxYMax slice" aria-hidden="true">
      <defs>
        <linearGradient id="gs-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#eef9f5" />
          <stop offset="1" stopColor="#dff3ea" />
        </linearGradient>
        <linearGradient id="gs-hill1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#bfe6cf" />
          <stop offset="1" stopColor="#a6dcbd" />
        </linearGradient>
        <linearGradient id="gs-hill2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8fd0a8" />
          <stop offset="1" stopColor="#6fbf8f" />
        </linearGradient>
        <linearGradient id="gs-leaf" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5cbf6e" />
          <stop offset="1" stopColor="#2f9a54" />
        </linearGradient>
      </defs>
      <rect width="360" height="120" fill="url(#gs-sky)" />
      <circle cx="250" cy="34" r="16" fill="#fff6d8" opacity=".9" />
      <ellipse cx="170" cy="30" rx="24" ry="7" fill="#fff" opacity=".8" />
      <ellipse cx="196" cy="26" rx="14" ry="6" fill="#fff" opacity=".8" />
      <path d="M0 98 C60 78 120 86 170 92 S280 70 360 84 V120 H0Z" fill="url(#gs-hill1)" />
      <path d="M120 120 C170 96 230 92 280 100 S340 96 360 92 V120Z" fill="url(#gs-hill2)" />
      {/* Cây nhỏ phía xa */}
      <g transform="translate(208 78)">
        <rect x="-1.2" y="6" width="2.4" height="10" fill="#6a8f5a" />
        <circle r="8" fill="#7cc58a" />
      </g>
      <g transform="translate(226 82)">
        <rect x="-1" y="4" width="2" height="9" fill="#6a8f5a" />
        <circle r="6" fill="#92d19c" />
      </g>
      {/* Cành lá lớn bên phải */}
      <g transform="translate(318 120)">
        <path d="M0 0 C-4 -30 -2 -60 10 -92" stroke="#3f8f52" strokeWidth="2.4" fill="none" />
        {[
          [-2, -18, -38, 0.9], [2, -30, 30, 1], [-1, -46, -42, 1.05], [4, -60, 34, 0.95], [2, -76, -30, 0.85], [8, -88, 20, 0.7],
        ].map(([x, y, r, s], i) => (
          <path key={i} transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`} d="M0 0 C10 -10 30 -10 38 0 C30 10 10 10 0 0Z" fill="url(#gs-leaf)" opacity={0.92 - i * 0.03} />
        ))}
      </g>
      <g transform="translate(286 120)">
        <path d="M0 0 C2 -18 6 -34 16 -48" stroke="#4d9d5f" strokeWidth="2" fill="none" />
        {[[2, -14, -150, 0.7], [4, -26, -30, 0.75], [9, -38, -140, 0.65]].map(([x, y, r, s], i) => (
          <path key={i} transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`} d="M0 0 C10 -10 30 -10 38 0 C30 10 10 10 0 0Z" fill="#79c98a" />
        ))}
      </g>
    </svg>
  )
}

/** Hình đại diện trợ lý: bác sĩ minh họa (vẽ riêng cho ứng dụng) */
export function DoctorAvatar({ size = 96 }) {
  return (
    <svg width={size} height={size * 1.15} viewBox="0 0 100 115" aria-label="Trợ lý sức khỏe AI" role="img">
      <defs>
        <linearGradient id="da-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e3f5ef" />
          <stop offset="1" stopColor="#cdeee3" />
        </linearGradient>
      </defs>
      <ellipse cx="50" cy="66" rx="46" ry="46" fill="url(#da-bg)" />
      {/* Tóc phía sau */}
      <path d="M24 46 C22 24 36 12 51 12 C68 12 79 25 77 46 L79 78 C70 82 30 82 21 78Z" fill="#2c2a35" />
      {/* Cổ */}
      <rect x="43" y="58" width="14" height="14" rx="5" fill="#f2c8ad" />
      {/* Áo blouse */}
      <path d="M14 115 C14 88 28 74 50 72 C72 74 86 88 86 115Z" fill="#ffffff" stroke="#dbe7e3" />
      <path d="M41 73 L50 92 L59 73 C56 71 44 71 41 73Z" fill="#7ccfc0" />
      <path d="M41 73 L36 80 L46 96 L50 92Z M59 73 L64 80 L54 96 L50 92Z" fill="#f4f7f6" stroke="#dbe7e3" strokeWidth=".8" />
      {/* Ống nghe */}
      <path d="M36 80 C30 92 32 100 40 102" stroke="#3c4a5c" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M64 80 C70 92 68 100 60 102" stroke="#3c4a5c" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <circle cx="40" cy="103" r="3.6" fill="#93a3b4" stroke="#3c4a5c" strokeWidth="1.4" />
      {/* Khuôn mặt */}
      <ellipse cx="50" cy="42" rx="18" ry="21" fill="#f7d4bc" />
      {/* Tóc mái */}
      <path d="M31 40 C32 24 44 18 53 19 C64 20 71 28 69 40 C62 34 54 28 47 26 C42 31 37 36 31 40Z" fill="#2c2a35" />
      {/* Mắt, má, miệng */}
      <ellipse cx="43" cy="44" rx="2" ry="2.4" fill="#2c2a35" />
      <ellipse cx="57" cy="44" rx="2" ry="2.4" fill="#2c2a35" />
      <path d="M39.5 39.5 Q43 37.5 46 39" stroke="#2c2a35" strokeWidth="1.1" fill="none" strokeLinecap="round" />
      <path d="M54 39 Q57 37.5 60.5 39.5" stroke="#2c2a35" strokeWidth="1.1" fill="none" strokeLinecap="round" />
      <ellipse cx="40" cy="51" rx="3.2" ry="2" fill="#f3a9a0" opacity=".6" />
      <ellipse cx="60" cy="51" rx="3.2" ry="2" fill="#f3a9a0" opacity=".6" />
      <path d="M45 53 Q50 57.5 55 53" stroke="#c4605a" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      {/* Huy hiệu chữ thập */}
      <rect x="64" y="86" width="9" height="9" rx="2" fill="#e8f6f1" />
      <path d="M68.5 88 v5 M66 90.5 h5" stroke="#14907f" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}
