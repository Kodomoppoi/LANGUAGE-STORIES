import httpx
import time
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

with open('.env') as f:
    for line in f:
        if line.startswith('GEMINI_API_KEY='):
            key = line.split('=', 1)[1].strip()

models = ['gemini-3.7-flash', 'gemini-3.5-flash', 'gemini-3.5-flash-lite']
prompt = "Return a JSON array with 5 Japanese words for a cafe theme with ruby in katakana and translation in portuguese."

for m in models:
    t0 = time.time()
    try:
        r = httpx.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={key}",
            json={
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {
                    "responseMimeType": "application/json",
                    "thinkingConfig": {"thinkingLevel": "LOW"} if "3.7" in m else {"thinkingBudget": 128}
                }
            },
            timeout=25.0
        )
        elapsed = time.time() - t0
        print(f"[{m}] Status: {r.status_code} in {elapsed:.2f}s | Chars: {len(r.text)}")
        if r.status_code != 200:
            print("  Err:", r.text[:150])
    except Exception as e:
        print(f"[{m}] Error: {e}")
