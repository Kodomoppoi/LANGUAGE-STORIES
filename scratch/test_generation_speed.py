import urllib.request
import json
import time
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

print("Iniciando medição de velocidade de geração em /api/stories/generate/stream...", flush=True)
payload = {
    "language": "ja",
    "proficiency": "N5",
    "theme": "Cafeteria em Tokyo",
    "story_length": "standard",
    "repetition_density": "high",
    "target_vocab_count": 6,
    "native_lang": "Portuguese",
    "gemini_model": "gemini-3.5-flash"
}

url = "http://127.0.0.1:8000/api/stories/generate/stream"
req = urllib.request.Request(
    url,
    data=json.dumps(payload).encode('utf-8'),
    headers={'Content-Type': 'application/json'}
)

start_time = time.time()
last_event_time = start_time
story_data = None
current_event_type = "message"

try:
    with urllib.request.urlopen(req, timeout=30) as resp:
        buffer = ""
        while True:
            chunk = resp.read(1024)
            if not chunk:
                break
            buffer += chunk.decode('utf-8', errors='ignore')
            lines = buffer.split('\n')
            buffer = lines.pop()

            for line in lines:
                if line.startswith("event: "):
                    current_event_type = line[7:].strip()
                elif line.startswith("data: "):
                    now = time.time()
                    raw_data = line[6:].strip()
                    try:
                        event_payload = json.loads(raw_data)
                        delta = now - last_event_time
                        total = now - start_time
                        last_event_time = now
                        stage = event_payload.get("stage") or current_event_type
                        msg = event_payload.get("message") or ""
                        print(f"[{total:5.2f}s (+{delta:4.2f}s)] Evento: {current_event_type} | Etapa: {stage} {msg}", flush=True)
                        if current_event_type == "stage_done" or "story" in event_payload:
                            story_data = event_payload.get("story")
                    except Exception as parse_err:
                        print(f"Parse err: {parse_err}", flush=True)

    total_time = time.time() - start_time
    print(f"\n==========================================", flush=True)
    print(f"Tempo total de geração: {total_time:.2f} segundos", flush=True)
    print(f"==========================================", flush=True)

    if story_data:
        title = story_data.get("title")
        print(f"Título: {title}", flush=True)
        sentences = story_data.get("sentences", [])
        if not sentences and "paragraphs" in story_data:
            for p in story_data.get("paragraphs", []):
                sentences.extend(p.get("sentences", []))
        print(f"Total de sentenças geradas: {len(sentences)}", flush=True)

        print("\nAmostra de Tokens e Leituras Ruby:", flush=True)
        all_tokens = []
        for s in sentences:
            for t in s.get("tokens", []):
                if t.get("ruby"):
                    all_tokens.append(f"{t.get('text')} -> {t.get('ruby')}")

        for tok in all_tokens[:20]:
            print(f"  • {tok}", flush=True)

        has_hiragana_ruby = False
        has_katakana_ruby = False
        for s in sentences:
            for t in s.get("tokens", []):
                ruby = t.get("ruby") or ""
                if any('\u3040' <= c <= '\u309f' for c in ruby):
                    has_hiragana_ruby = True
                if any('\u30a0' <= c <= '\u30ff' for c in ruby):
                    has_katakana_ruby = True

        target_vocab = story_data.get("targetVocabulary", [])
        for tv in target_vocab:
            ruby = tv.get("ruby") or ""
            if any('\u3040' <= c <= '\u309f' for c in ruby):
                has_hiragana_ruby = True
            if any('\u30a0' <= c <= '\u30ff' for c in ruby):
                has_katakana_ruby = True

        print(f"\nVocabulário Alvo (Amostra):", flush=True)
        for tv in target_vocab[:6]:
            print(f"  • {tv.get('word')} ({tv.get('ruby')}): {tv.get('translation')}", flush=True)

        print(f"\nVerificação Fonética Katakana:", flush=True)
        print(f"  - Total de tokens anotados com Ruby: {len(all_tokens)}", flush=True)
        print(f"  - Contém Katakana Ruby: {'SIM ✅' if has_katakana_ruby else 'NÃO ❌'}", flush=True)
        print(f"  - Contém Hiragana Furigana: {'SIM ⚠️' if has_hiragana_ruby else 'NÃO ✅ (Substituído com 100% de sucesso por Katakana)'}", flush=True)

except Exception as e:
    print(f"Erro ao testar geração: {e}", flush=True)
