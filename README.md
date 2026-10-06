# Link2QR — Turn Any Link Into a QR Code

![Link2QR Banner](https://img.shields.io/badge/Link2QR-QR%20Code%20Generator-6366f1?style=for-the-badge&logoColor=white)
![HTML](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![License](https://img.shields.io/badge/License-MIT-green?style=flat)

> Convert any URL into a high-quality QR code instantly — free, fast, and private. Your links never leave your browser.

---

## 🌐 Live Demo

**[→ Try Link2QR Live](https://ayushjaiswal454.github.io/QR-converter/)**

---

## ✨ Features

- 🔗 **Paste any URL** — supports all valid `http://` and `https://` links
- ⚡ **Instant QR generation** — no server, no signup, no wait
- 📥 **Download as PNG** — high-resolution 440×440px QR image
- 📋 **Copy link** — one-click clipboard copy with success feedback
- 📤 **Web Share API** — native share on supported devices
- 🔄 **Generate Another** — quick reset to make more QR codes
- ♿ **Fully accessible** — ARIA labels, keyboard navigation, error announcements
- 📱 **Responsive** — works on mobile, tablet, and desktop
- 🎨 **Dark mode UI** — sleek glassmorphism design with smooth animations

---

## 🛡️ Privacy

All QR code generation happens **100% in your browser** using [qrcode.js](https://github.com/davidshimjs/qrcodejs). No URLs, data, or analytics are ever sent to any server.

---

## 🚀 Getting Started

No installation or build step needed. It's a pure static site.

### Run Locally

```bash
# Clone the repo
git clone https://github.com/AYUshJaiswal454/QR-converter.git

# Open in browser
cd QR-converter
open index.html
```

Or simply double-click `index.html` to open it in your browser.

---

## 📁 Project Structure

```
QR-converter/
├── index.html      # App structure, semantic HTML, SEO meta tags
├── style.css       # Design system, dark theme, animations, responsive layout
├── app.js          # URL validation, QR generation, download, copy, share logic
└── README.md       # Project documentation
```

---

## 🧰 Tech Stack

| Technology | Purpose |
|---|---|
| **HTML5** | Semantic structure, accessibility (ARIA), SEO |
| **Vanilla CSS** | Design system with CSS variables, animations |
| **Vanilla JavaScript** | App logic, URL validation, clipboard, share |
| **[qrcode.js](https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js)** | QR code rendering via `<canvas>` |
| **Google Fonts (Inter)** | Modern typography |

---

## 🔒 URL Validation

Only `http://` and `https://` URLs are accepted to prevent XSS/injection attacks via `javascript:`, `data:`, `file:`, `vbscript:` etc. Validation uses the native `URL` constructor — not regex.

---

## 📄 License

This project is licensed under the **MIT License** — feel free to use, modify, and distribute it.

---

## 🙌 Author

Made with ❤️ by **[Ayush Jaiswal](https://github.com/AYUshJaiswal454)**
