# 📖 Language Stories (📖 语言故事 / 言語の物語)

> **Plataforma imersiva de aquisição natural de idiomas baseada no princípio de *Comprehensible Input*, com leitura graduada em livro 3D, fonética integral (100% Ruby/Pinyin/Furigana), repetição espaçada calculada (SRS) e acompanhamento auditivo em tempo real.**

---

## 🌟 Visão Geral / Project Overview

O **Language Stories** transforma o aprendizado de idiomas em uma experiência literária e sensorial contínua. Em vez de exercícios mecânicos ou listas isoladas de palavras, o estudante lê histórias originais criadas por Inteligência Artificial generativa, estritamente calibradas para o seu nível real de compreensão (CEFR A1–C2, HSK 1–6, JLPT N5–N1, TOPIK 1–6).

A aplicação integra um ecossistema completo:
1. **Caderno Literário 3D**: Apresentação skeuomórfica com textura de pergaminho, encadernação em couro entalhado e calha central com sombreamento realista.
2. **Fonética Total (100% Ruby)**: Todo caractere ou ideograma recebe anotação de pronúncia (Pinyin com tons diacríticos em Mandarim e Furigana em Japonês).
3. **Diagnóstico Visível no Caderno**: Nenhuma falha é mascarada. Erros de chave, limite de cota ou voz são apresentados como cartões de pergaminho com selos de cera e passos claros para correção, sem criar histórias fictícias aleatórias.
4. **Áudio Sincronizado**: Leitura frase a frase com destaque tipo karaokê via Edge-TTS (vozes neurais) e Web Speech API.
5. **Dicionário & Raio-X Morfológico**: Consulta instantânea com análise etimológica e decomposição de radicais ideográficos.
6. **SRS (SuperMemo SM-2)**: Algoritmo de repetição espaçada que injeta vocabulário prioritário em novas histórias e realiza micro-quizzes de retenção.

---

## 🚀 Início Rápido (Execução em 1 Clique)

Para facilitar o desenvolvimento e uso diário, o projeto conta com inicialização unificada:

### Opção A: Executável Windows (Mais Rápido)
Dê um duplo clique no arquivo:
```bat
run.bat
```
*(Localizado na raiz da pasta do projeto. Ele abre e gerencia o Backend FastAPI na porta 8000 e o Frontend Vite na porta 5173 simultaneamente).*

---

### Opção B: Comando Unificado via Terminal
Na pasta `LANGUAGE-STORIES`:
```bash
npm run dev
```
*(Utiliza `concurrently` para rodar o backend Python e o frontend React no mesmo terminal com logs coloridos).*

---

## 🛠️ Tecnologias e Arquitetura

```
                            ┌─────────────────────────────────────────┐
                            │        FRONTEND (React 18 + Vite)       │
                            │  • Livro 3D • BookErrorCard • SRS Local │
                            │  • Dicionário Auxiliar de Fonética      │
                            └────────────────────┬────────────────────┘
                                                 │
                                ┌────────────────┴────────────────┐
                                │ HTTP / Server-Sent Events (SSE) │
                                └────────────────┬────────────────┘
                                                 │
                            ┌────────────────────▼────────────────────┐
                            │        BACKEND (FastAPI + Python)       │
                            │  • Curadoria em 2 Etapas (AI Service)   │
                            │  • Pypinyin Tonal (100% Ruby)           │
                            │  • Edge-TTS Neural Audio Cache          │
                            │  • SQLite Persistente Local             │
                            └────────────────────┬────────────────────┘
                                                 │
                        ┌────────────────────────┴────────────────────────┐
                        │                                                 │
            ┌───────────▼───────────┐                         ┌───────────▼───────────┐
            │   Google Gemini API   │                         │  Ollama Local (Opt.)  │
            │ (2.5 / 3.6 Flash LLM) │                         │      (llama3.2)       │
            └───────────────────────┘                         └───────────────────────┘
```

| Componente | Tecnologia | Papel no Sistema |
| :--- | :--- | :--- |
| **Frontend Core** | React 18, TypeScript, Vite | Interface responsiva, controle de estado via Context API |
| **Design System** | Vanilla CSS Tokens | Skeuomorfismo imersivo, pergaminho orgânico, couro entalhado |
| **Backend API** | FastAPI, Uvicorn, Pydantic | Orquestração da IA, SSE streaming, rotas de vocabulário e TTS |
| **Inteligência Artificial** | Google GenAI SDK (`google-genai`) | Modelos Gemini 2.5/3.6 Flash para redação interlinear calibrada |
| **Motor Fonético** | `pypinyin` + `auxiliaryPhonetics.ts` | Pinyin com marcas de tom diacríticas oficiais e Furigana |
| **Síntese de Voz (TTS)**| `edge-tts` (Microsoft Azure Neural) | Narração humana em alta fidelidade com fallback no navegador |
| **Banco de Dados** | SQLite (`language_stories.db`) | Persistência do cofre de vocabulário global e histórico de contos |

---

## ✨ Recursos Detalhados

### 1. 📚 Livro Aberto 3D & Paginação Inteligente
* **Paginação Balanceada**: Evita páginas órfãs ou textos vazios distribuindo parágrafos harmoniosamente entre a página esquerda e direita.
* **Modo Boas-Vindas Didático**: Quando não há histórias criadas e não há erros, a página exibe o estado de boas-vindas com chips de temas populares (ex: *Café Matinal*, *Festival de Rua*, *Viagem de Trem*) e campo para tema personalizado.

### 2. 🀄 100% de Cobertura Fonética (Ruby / Pinyin / Furigana)
* **Pinyin Integral**: Ao aprender Mandarim, **todas as palavras e ideogramas** do texto recebem anotação de Pinyin tonal sobre os caracteres (ex: `wǒ`, `kàn`, `hē`).
* **Furigana para Kanjis**: Ideogramas japoneses recebem a leitura correspondente em Hiragana.
* **Dupla Camada de Garantia**: Processamento nativo no backend aliado a um dicionário morfológico auxiliar no cliente (`auxiliaryPhonetics.ts`).

### 3. 🛡️ Diagnóstico Visível no Caderno (`BookErrorCard`)
Nenhuma falha de API é encoberta com dados falsos. Se ocorrer um problema, um cartão de pergaminho é exibido diretamente na página direita do livro:
* 🔑 **Chave Gemini Inválida ou Ausente (HTTP 400/403)**: Explica o motivo e fornece botão de atalho para abrir as Configurações.
* ⏳ **Cota Excedida (HTTP 429 / RESOURCE_EXHAUSTED)**: Informa sobre o limite de requisições por minuto/dia e instruções de espera ou troca de modelo.
* 🔇 **Voz TTS Indisponível**: Alerta quando o navegador não possui o pacote de voz instalado para a língua da história, orientando o uso do Edge-TTS do backend.
* **Página Esquerda de Salvaguarda**: Apresenta a notificação *"Interrupção na Composição"*, assegurando ao estudante que seu progresso e cofre de vocabulário continuam 100% preservados.

### 4. 🔍 Dicionário Interativo & Raio-X Morfológico
* **Consulta com 1 Clique**: Clique em qualquer vocábulo do livro para ver tradução, pronúncia fonética, classe gramatical e métricas de aprendizado.
* **Raio-X IA**: Ao clicar no ícone de robô, o sistema gera uma explicação detalhada da anatomia da palavra:
  * Decomposição de ideogramas (radicais semânticos e fonéticos).
  * Palavras compostas e vocábulos correlatos.
  * Contexto cultural e nuances de uso.

### 5. 🧠 Repetição Espaçada (SRS - SuperMemo SM-2)
* Classificação em quatro estágios contínuos: `Novo (0-25%)`, `Aprendendo (26-50%)`, `Revisão (51-84%)` e `Dominado (85-100%)`.
* **Fixação por Estrela (⭐)**: Palavras marcadas como favoritas recebem peso máximo de repetição nas próximas narrativas geradas.
* **Micro-Quiz**: Ao virar a última página de uma história, um questionário dinâmico consolida a retenção imediata das novas palavras.

### 6. ⚡ Terminal de Processamento em Tempo Real
* Janela flutuante com logs e streaming SSE que acompanha cada fase da criação da narrativa:
  * `Etapa 1`: Curadoria de vocabulário e histórico do usuário.
  * `Etapa 2`: Redação interlinear e cálculo de repetições.
  * `Etapa 3`: Validação gramatical e hidratação de traços fonéticos.

---

## 🌐 Idiomas Suportados e Escalas de Proficiência

| Idioma | Código | Escala de Proficiência | Suporte Fonético |
| :--- | :---: | :---: | :---: |
| **Mandarim** (中文) | `zh` | HSK 1, HSK 2, HSK 3, HSK 4, HSK 5, HSK 6 | 100% Pinyin Tonal (`pypinyin`) |
| **Japonês** (日本語) | `ja` | JLPT N5, JLPT N4, JLPT N3, JLPT N2, JLPT N1 | Furigana em Hiragana |
| **Coreano** (한국어) | `ko` | TOPIK 1, TOPIK 2, TOPIK 3, TOPIK 4, TOPIK 5, TOPIK 6 | Hangul e Romanização |
| **Espanhol** (Español) | `es` | CEFR A1, A2, B1, B2, C1, C2 | Tradução interlinear contextual |
| **Francês** (Français) | `fr` | CEFR A1, A2, B1, B2, C1, C2 | Tradução interlinear contextual |
| **Alemão** (Deutsch) | `de` | CEFR A1, A2, B1, B2, C1, C2 | Tradução interlinear contextual |
| **Italiano** (Italiano) | `it` | CEFR A1, A2, B1, B2, C1, C2 | Tradução interlinear contextual |
| **Inglês** (English) | `en` | CEFR A1, A2, B1, B2, C1, C2 | Tradução interlinear contextual |
| **Português** | `pt` | CEFR A1, A2, B1, B2, C1, C2 | Tradução interlinear contextual |

---

## ⚙️ Instalação Passo a Passo

### Pré-requisitos
* **Node.js**: v18.0.0 ou superior ([nodejs.org](https://nodejs.org/))
* **Python**: v3.10 ou superior ([python.org](https://www.python.org/))
* **Git** instalado

---

### Passo 1: Clonar o Repositório
```bash
git clone https://github.com/seu-usuario/LANGUAGE-STORIES.git
cd LANGUAGE-STORIES
```

---

### Passo 2: Instalar Dependências Gerais
Na raiz do projeto (`LANGUAGE-STORIES`):
```bash
npm install
```
Em seguida, instale as dependências do frontend:
```bash
cd frontend
npm install
cd ..
```

---

### Passo 3: Configurar o Ambiente Python do Backend
1. Navegue até a pasta `backend`:
   ```bash
   cd backend
   ```
2. Crie e ative o ambiente virtual:
   * **Windows (PowerShell)**:
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```
   * **Linux / macOS**:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```
3. Instale as bibliotecas Python:
   ```bash
   pip install -r requirements.txt
   ```
4. Volte à raiz do projeto:
   ```bash
   cd ..
   ```

---

### Passo 4: Configurar a Chave da API Gemini

1. Acesse gratuitamente o [Google AI Studio](https://aistudio.google.com/).
2. Faça login com sua conta Google e clique em **"Create API Key"**.
3. Crie um arquivo `.env` na raiz do projeto (ou dentro de `backend/.env`):
   ```env
   GEMINI_API_KEY=AIzaSy...sua_chave_aqui
   GEMINI_MODEL=gemini-3.6-flash
   ```
   *(Você também pode inserir e testar a chave diretamente pela interface gráfica nas Configurações ⚙️).*

---

### Passo 5: Iniciar a Aplicação
Basta executar na raiz:
```bash
npm run dev
```
Ou dê um duplo clique no executável [run.bat](file:///e:/Projects/Coding/Personal/LANGUAGE%20STORIES/run.bat).

Acesse no navegador:
* **Frontend**: `http://localhost:5173`
* **API Backend (Swagger Docs)**: `http://localhost:8000/docs`

---

## 📂 Estrutura do Projeto

```
LANGUAGE-STORIES/
├── run.bat                       # Inicializador rápido em 1 clique (Windows)
├── package.json                  # Scripts unificados de orquestração (concurrently)
├── .gitignore                    # Bloqueio de chaves .env, caches e bancos locais
├── README.md                     # Documentação oficial do projeto
│
├── backend/                      # Servidor FastAPI e Inteligência Artificial
│   ├── languages/
│   │   ├── base.py               # Estrutura base de perfis de idiomas
│   │   ├── chinese.py            # Regras fonéticas, radicais e HSK do Mandarim
│   │   ├── phonetics.py          # Enriquecimento com pypinyin (marcas de tom diacríticas)
│   │   └── profiles.py           # Registro dinâmico de todos os idiomas
│   ├── routers/
│   │   ├── stories.py            # Geração de narrativas com streaming SSE
│   │   ├── vocabulary.py         # Raio-X morfológico e gestão de vocabulário
│   │   └── tts.py                # Síntese neural de áudio com Edge-TTS
│   ├── services/
│   │   ├── ai_service.py         # Integração com Gemini API e tratamento estrito de erros
│   │   └── tts_service.py        # Cache e conversão de áudio para streaming
│   ├── config.py                 # Leitura dinâmica de variáveis de ambiente (.env)
│   ├── database.py               # Modelos SQLAlchemy e SQLite local
│   ├── main.py                   # Ponto de entrada FastAPI com CORS configurado
│   └── requirements.txt          # Dependências Python (fastapi, google-genai, pypinyin, edge-tts)
│
└── frontend/                     # Aplicação Web SPA (React + TypeScript + Vite)
    ├── src/
    │   ├── components/
    │   │   ├── Reader/           # StoryReader (livro 3D), BookErrorCard, WordPopover
    │   │   ├── Dictionary/       # Visualização e filtro do cofre de vocabulário
    │   │   ├── Quiz/             # Mini-quizzes de retenção pós-leitura
    │   │   ├── Terminal/         # Terminal flutuante de processamento em tempo real
    │   │   └── Settings/         # Painel de chaves de API, modelos e temas
    │   ├── context/
    │   │   └── AppContext.tsx    # Gerenciamento de estado global, SRS e controle de áudio
    │   ├── services/
    │   │   ├── auxiliaryPhonetics.ts # Tabela fonética auxiliar de Pinyin e Furigana
    │   │   ├── apiService.ts     # Orquestrador de requisições e estratégias de IA
    │   │   ├── storageService.ts # Armazenamento e sanitização de dados no localStorage
    │   │   └── ttsService.ts     # Síntese de áudio no cliente com Web Speech API
    │   ├── types/                # Interfaces TypeScript unificadas
    │   └── index.css             # Design tokens e folhas de estilo skeuomórficas
    ├── package.json
    └── vite.config.ts
```

---

## 🔒 Privacidade e Segurança de Dados

* **Armazenamento Local**: Todo o seu cofre de palavras aprendidas, histórico e notas SRS são armazenados de forma privada no seu próprio computador (`localStorage` e `language_stories.db`).
* **Proteção de Credenciais**: O arquivo `.gitignore` impede que chaves privadas (`.env`), caches de áudio (`.mp3`) ou dados de usuário sejam enviados para versionamento Git.

---

## 📄 Licença

Distribuído sob a licença **MIT**. Sinta-se livre para usar, estudar e aprimorar o código.
