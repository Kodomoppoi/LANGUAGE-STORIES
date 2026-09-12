import asyncio
import time
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from backend.services.ai_service import ai_service
from backend.routers.stories import _enrich_story_response
from backend.database import SessionLocal

async def run_test():
    print("Iniciando teste de geracao com gemini-3.5-flash e verificacao de Rōmaji oficial...", flush=True)
    start = time.time()
    db = SessionLocal()

    try:
        # Estágio 1: Curadoria de Vocabulário
        t0 = time.time()
        print("[0.00s] Executando Estagio 1: Curadoria...", flush=True)
        curated_vocab = await ai_service.curate_vocabulary_stage1(
            language="ja",
            proficiency="N5",
            theme="Um cafe em Tokyo",
            target_count=4,
            db=db,
            native_lang="Portuguese",
            model="gemini-3.5-flash"
        )
        t_stage1 = time.time() - t0
        print(f"[{t_stage1:5.2f}s] Estagio 1 concluido ({len(curated_vocab)} termos selecionados).", flush=True)

        # Estágio 2: Geração Narrativa Interlinear
        t1 = time.time()
        print(f"[{time.time() - start:5.2f}s] Executando Estagio 2: Narrativa Interlinear...", flush=True)
        story_data = await ai_service.generate_interlinear_story_stage2(
            curated_vocab=curated_vocab,
            language="ja",
            proficiency="N5",
            theme="Um cafe em Tokyo",
            story_length="short",
            repetition_density="high",
            db=db,
            native_lang="Portuguese",
            model="gemini-3.5-flash"
        )
        t_stage2 = time.time() - t1
        print(f"[{time.time() - start:5.2f}s] Estagio 2 concluido em {t_stage2:.2f}s.", flush=True)

        if story_data:
            print("\n=======================================================", flush=True)
            print("                 RESULTADO DA HISTÓRIA                 ", flush=True)
            print("=======================================================", flush=True)
            enriched = _enrich_story_response(story_data, "ja")
            print(f"Título: {enriched.get('title')}", flush=True)

            print("\n--- VOCABULÁRIO ALVO (com Rōmaji oficial Hepburn) ---", flush=True)
            for v in enriched.get("targetVocabulary", []):
                print(f"  • {v.get('word')} [{v.get('ruby')}] - {v.get('translation')}", flush=True)

            print("\n--- AMOSTRA DE FRASES E TOKENS (com Ruby Rōmaji) ---", flush=True)
            for s in enriched.get("sentences", [])[:3]:
                print(f"\nFrase: {s.get('text')}", flush=True)
                print(f"Tradução: {s.get('translation')}", flush=True)
                tokens_str = " | ".join([f"{t['text']} [{t.get('ruby')}]" if t.get('ruby') else t['text'] for t in s.get('tokens', [])])
                print(f"Tokens: {tokens_str}", flush=True)

            total_time = time.time() - start
            print(f"\n⏱️ Tempo total de geracao (Estágio 1 + 2): {total_time:.2f}s", flush=True)

    except Exception as e:
        print(f"Erro no teste: {type(e).__name__}: {e}", flush=True)
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(run_test())
