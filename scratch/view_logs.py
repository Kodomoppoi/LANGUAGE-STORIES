import urllib.request
import json

try:
    with urllib.request.urlopen("http://127.0.0.1:8000/api/logs") as resp:
        logs = json.loads(resp.read().decode("utf-8"))
        for l in logs[-40:]:
            print(f"[{l.get('timestamp')}] [{l.get('source')}] [{l.get('level')}] {l.get('message')}")
except Exception as e:
    print(f"Error: {e}")
