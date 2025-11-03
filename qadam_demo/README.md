# Qadam — Svoy sayt. Svoy bot. Svoy mijozlar.

**Qadam** — Uzum/Yandex/eMak o‘rniga *mustaqil savdo tizimi*: komissiyasiz, to‘liq nazorat, o‘z brendingiz.

## ✨ Nega Qadam?
- **Komissiyasiz:** har bir savdodan foiz yo‘q.
- **To‘liq nazorat:** o‘z domeningiz, o‘z Telegram botingiz, o‘z mijozlaringiz.
- **Bir marta to‘lov:** tizim sizniki. Oyiga faqat VPS (~$3–5).

## 📦 Nima ichida?
- Landing (HTML/CSS/JS) — menyu, savatcha, buyurtma formasi
- Flask API — `/api/order` orqali buyurtmalarni qabul qiladi
- Telegram integratsiyasi — `.env` sozlansa, buyurtmalar admin chatiga yuboriladi

## 🚀 Tez start (demo)
```bash
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env   # va BOT_TOKEN/ADMIN_ID ni to'ldiring (ixtiyoriy)
python server.py
```
Brauzerda: **http://localhost:5500**

## 🧪 Test
- Savatchaga mahsulot qo‘shing → “Buyurtma berish” → formani to‘ldiring → jo‘nating.
- Terminalda buyurtma logini ko‘rasiz.
- Agar `.env` to‘ldirilgan bo‘lsa — buyurtma Telegram admin chatiga yuboriladi.

## 🛠 Klientga moslash
- `assets/logo.svg` — logoni almashtiring.
- Rangi/branding: `style.css` dagi rang o‘zgaruvchilarni yangilang (`--green`, `--yellow`).
- Menyu: `index.html` → `.products-grid` ichida kartalar.

## 🔒 Eslatma
Qadam — *platforma emas*, bu **sizga tegishli tizim**. Ma’lumotlar va mijozlar sizning qo‘lingizda.

— Qadam: *“qarshi tizim”*. 
