import urllib.request
import json
from backend.config import settings

key = settings.gemini_api_key

models_to_test = ['gemini-2.5-flash', 'gemini-3.6-flash', 'gemini-3.7-flash']
configs_to_test = [
    ('budget_0', {'thinkingBudget': 0}),
    ('budget_128', {'thinkingBudget': 128}),
    ('level_low', {'thinkingLevel': 'LOW'}),
    ('level_minimal', {'thinkingLevel': 'MINIMAL'}),
    ('no_thinking_config', None),
]

for m in models_to_test:
    print(f"\n=== Testing {m} ===")
    for cfg_name, cfg in configs_to_test:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={key}"
        gen_cfg = {"responseMimeType": "application/json"}
        if cfg:
            gen_cfg["thinkingConfig"] = cfg
        payload = {
            "contents": [{"parts": [{"text": "Respond in json: {\"ok\": true}"}]}],
            "generationConfig": gen_cfg
        }
        req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers={'Content-Type': 'application/json'})
        try:
            with urllib.request.urlopen(req, timeout=12) as resp:
                data = json.loads(resp.read().decode())
                text = data['candidates'][0]['content']['parts'][0]['text']
                print(f"  [{cfg_name}]: SUCCESS (code {resp.status}) -> {text.strip()[:40]}")
        except urllib.error.HTTPError as e:
            err = e.read().decode('utf-8')
            try:
                msg = json.loads(err).get('error', {}).get('message', '')
            except Exception:
                msg = err[:100]
            print(f"  [{cfg_name}]: HTTP {e.code} - {msg}")
        except Exception as e:
            print(f"  [{cfg_name}]: ERR - {e}")
