# Language Stories — Backend API

Backend em Python (FastAPI + SQLite) para o projeto **Language Stories**, implementando pipeline de IA de 2 estágios, streaming SSE para o mascote de carregamento, registro modular de traços linguísticos (iniciando com Mandarim), algoritmo de retenção SRS contínuo (curva de Ebbinghaus e SuperMemo-2) e síntese de voz neural (Edge-TTS com cache SHA256 em disco).

---

## 🏗️ Estrutura do Projeto

```
backend/
├── main.py                     # Inicialização do FastAPI, CORS, rotas e eventos
├── config.py                   # Configurações (Gemini API Key, Ollama URL, caminhos)
├── database.py                 # Engine SQLite, sessões e modelos ORM (SQLAlchemy)
├── requirements.txt            # Dependências Python
│
├── languages/                  # [REGISTRY MODULAR DE IDIOMAS]
│   ├── base.py                 # Classe abstrata LanguageProfile
│   ├── chinese.py              # Perfil de Mandarim (Hanzi, Pinyin com tons, Radicais 部首, HSK 1–6)
│   ├── generic.py              # Fallback robusto para outros idiomas (ja, es, ar, fr, it, etc.)
│   └── registry.py             # LanguageRegistry (singleton)
│
├── services/                   # [SERVIÇOS CENTRAIS]
│   ├── ai_service.py           # Pipeline IA de 2 Estágios (Curadoria + Geração Interlinear + Hidratação)
│   ├── srs_engine.py           # Algoritmo SM-2, pontuação contínua (0.0-1.0), pesos e cores
│   └── tts_service.py          # Edge-TTS com cache em disco SHA256 (0ms de latência)
│
├── routers/                    # [ENDPOINTS FASTAPI]
│   ├── stories.py              # POST /api/stories/generate e POST /api/stories/generate/stream (SSE)
│   ├── vocabulary.py           # GET /api/vocabulary, /lookup, /record-click, /toggle-pin, /srs-review
│   └── tts.py                  # GET e POST /api/tts/synthesize
│
└── tests/                      # [SUÍTE DE TESTES UNITÁRIOS]
    ├── test_srs.py             # Testes do algoritmo SRS e pontuação contínua
    ├── test_languages.py       # Testes de profiles e extração de traços
    └── test_api.py             # Testes de endpoints com TestClient
```

---

## 🚀 Como Executar

### 1. Criar e Ativar Ambiente Virtual (Recomendado)

```bash
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate
```

### 2. Instalar Dependências

```bash
pip install -r backend/requirements.txt
```

### 3. Configurar Variáveis de Ambiente (Opcional)

Crie um arquivo `.env` na raiz ou configure no sistema:
```env
GEMINI_API_KEY=sua_chave_gemini_aqui
OLLAMA_URL=http://localhost:11434
PORT=8000
```
> *Nota:* Caso nenhum provedor de IA esteja configurado, o backend utiliza automaticamente o sistema inteligente de **fallback com dados curados em conformidade estrita com o schema linguístico**.

### 4. Iniciar o Servidor FastAPI

```bash
uvicorn backend.main:app --reload --port 8000
```
Acesse a documentação interativa no navegador:
- Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health Check: [http://localhost:8000/health](http://localhost:8000/health)

---

## 🧪 Como Rodar os Testes

```bash
pytest backend/tests
```

---

## 📡 Endpoints da API

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/health` | Status da API e conectividade SQLite |
| `POST` | `/api/stories/generate` | Geração direta de história interlinear com vocabulário hidratado |
| `POST` | `/api/stories/generate/stream` | Geração em streaming SSE (notifica etapas para o mascote) |
| `GET` | `/api/vocabulary` | Consulta ao cofre global com filtros de status e busca |
| `POST` | `/api/vocabulary/lookup` | Análise rápida de palavra única em contexto (0ms se estiver no cofre) |
| `POST` | `/api/vocabulary/record-click` | Registro silencioso de clique ajustando a retenção SRS |
| `POST` | `/api/vocabulary/toggle-pin` | Fixar/desfixar palavra como prioridade máxima (⭐) |
| `POST` | `/api/vocabulary/srs-review` | Atualização do intervalo SM-2 após revisão |
| `POST` | `/api/vocabulary/add-vault` | Adição instantânea de palavra ao cofre |
| `GET` | `/api/tts/synthesize` | Síntese de áudio neural com streaming MP3 direto e cache |
| `POST` | `/api/tts/synthesize` | Síntese de áudio neural via payload JSON |
