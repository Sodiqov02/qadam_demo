# Qadam demo Flask server
import os, json, datetime, requests
from flask import Flask, send_from_directory, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
load_dotenv()
BOT_TOKEN = os.getenv("BOT_TOKEN", "").strip()
ADMIN_ID = os.getenv("ADMIN_ID", "").strip()
app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)
@app.route('/')
def root():
    return send_from_directory('.', 'index.html')
@app.route('/api/order', methods=['POST'])
def api_order():
    try:
        data = request.get_json(force=True) or {}
        # Basic validation
        required = ['name', 'phone', 'address', 'items', 'total']
        if any(k not in data for k in required):
            return jsonify({'ok': False, 'message': 'Bad payload'}), 400
        
        # Log to server
        print('--- Qadam New Order ---')
        print(json.dumps(data, ensure_ascii=False, indent=2))
        
        # Optional: send to Telegram if env provided
        sent = False
        if BOT_TOKEN and ADMIN_ID:
            try:
                text_lines = [
                    '🟢 *Yangi buyurtma*',
                    f'👤 {data.get("name")}',
                    f'📞 {data.get("phone")}',
                    f'📍 {data.get("address")}',
                    f'📝 {data.get("note", "-")}',
                    '',
                    '🛒 *Tovarlar:*'
                ]
                for it in data.get('items', []):
                    text_lines.append(f'- {it.get("name")} x{it.get("quantity")} — {it.get("price")} so\'m')
                text_lines.append('')
                text_lines.append(f'💰 *Jami:* {data.get("total")} so\'m')
                text_lines.append(f'⏱ {datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")}')
                
                msg = '\n'.join(text_lines)
                url = f'https://api.telegram.org/bot{BOT_TOKEN}/sendMessage'
                payload = {
                    'chat_id': ADMIN_ID,
                    'text': msg,
                    'parse_mode': 'Markdown'
                }
                r = requests.post(url, json=payload, timeout=10)
                r.raise_for_status()
                sent = True
            except Exception as e:
                print('Telegram yuborishda xato:', e)
        
        return jsonify({'ok': True, 'message': 'Buyurtma qabul qilindi (demo)', 'telegram_sent': sent})
    except Exception as e:
        return jsonify({'ok': False, 'message': str(e)}), 500
if __name__ == '__main__':
    port = int(os.getenv('PORT', '5500'))
    print(f'✅ Qadam server is running on http://localhost:{port}')
    app.run(host='0.0.0.0', port=port, debug=True)
