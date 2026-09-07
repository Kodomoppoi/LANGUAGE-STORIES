#  Language Stories

> **Immersive natural language acquisition platform based on the *Comprehensible Input* principle, featuring 3D open-book reading, full phonetic annotations (100% Ruby / Pinyin / Furigana), Spaced Repetition System (SRS), and real-time synchronized audio.**

---

##  Project Overview

**Language Stories** transforms language learning into a continuous literary and sensory experience. Instead of mechanical drills or disconnected flashcard lists, students read original stories crafted by Generative Artificial Intelligence, strictly calibrated to their exact comprehension level (CEFR A1–C2, HSK 1–6, JLPT N5–N1, TOPIK 1–6).

The application integrates an end-to-end learning ecosystem:
1. **3D Literary Notebook & Open Book**: Skeuomorphic presentation featuring organic parchment textures, debossed hardcover stitching, sewn fabric headbands, and realistic central spine shading.
2. **100% Phonetic Coverage (Ruby)**: Every character or ideogram receives phonetic reading annotations (Pinyin with official tone diacritics for Mandarin, and Furigana in Hiragana for Japanese).
3. **In-Book Error Diagnostics**: Zero silent failures or fake mockups. API key issues, quota limits, and missing voice packs render directly on parchment pages with wax seals and actionable resolution steps.
4. **Synchronized Audio**: Sentence-by-sentence karaoke highlighting powered by Edge-TTS (neural voices) and the browser Web Speech API.
5. **Interactive Lexicon & Morphological Deep Dive**: Instant lookup with etymological analysis, semantic/phonetic radical breakdown, and contextual examples.
6. **Spaced Repetition System (SRS - SuperMemo SM-2)**: Adaptive spaced repetition intervals that inject prioritized vocabulary into upcoming chapters and provide retention mini-quizzes.

---

##  Quick Start (1-Click Launch)

To simplify setup and daily practice, the project includes unified automated launchers:

### Option A: Windows Executable (Fastest)
Double-click the launcher:
```bat
run.bat
```
*(Located in the project root. It checks dependencies, installs anything missing automatically, and launches both the FastAPI Backend on port 8000 and the Vite Frontend on port 5173).*

---

### Option B: Unified Terminal Command
In the `LANGUAGE-STORIES` root directory:
```bash
npm run dev
```
*(Uses `concurrently` and automated setup hooks to verify dependencies and run Python backend and React frontend together with colored logs).*

---

## 🛠️ Architecture & Tech Stack

```
                            ┌─────────────────────────────────────────┐
                            │        FRONTEND (React 18 + Vite)       │
                            │  • 3D Open Book • BookErrorCard • SRS   │
                            │  • Auxiliary Phonetics Lookup Table     │
                            └────────────────────┬────────────────────┘
                                                 │
                                ┌────────────────┴────────────────┐
                                │ HTTP / Server-Sent Events (SSE) │
                                └────────────────┬────────────────┘
                                                 │
                            ┌────────────────────▼────────────────────┐
                            │        BACKEND (FastAPI + Python)       │
                            │  • 2-Stage Story Pipeline (AI Service)  │
                            │  • Pypinyin Tonal (100% Ruby Annotator) │
                            │  • Edge-TTS Neural Audio Cache          │
                            │  • Local Persistent SQLite Database     │
                            └────────────────────┬────────────────────┘
                                                 │
                        ┌────────────────────────┴────────────────────────┐
                        │                                                 │
            ┌───────────▼───────────┐                         ┌───────────▼───────────┐
            │   Google Gemini API   │                         │  Local Ollama (Opt.)  │
            │ (2.5 / 3.6 Flash LLM) │                         │      (llama3.2)       │
            └───────────────────────┘                         └───────────────────────┘
```

| Layer | Technology | Role in System |
| :--- | :--- | :--- |
| **Frontend Core** | React 18, TypeScript, Vite | Reactive user interface, Context API state management |
| **Design System** | Vanilla CSS Design Tokens | Immersive skeuomorphic aesthetics, parchment texture, custom fonts |
| **Backend API** | FastAPI, Uvicorn, Pydantic | AI orchestration, SSE streaming, vocabulary routes, neural TTS |
| **Artificial Intelligence** | Google GenAI SDK (`google-genai`) | Gemini 2.5/3.6 Flash models for calibrated interlinear generation |
| **Phonetic Engine** | `pypinyin` + `auxiliaryPhonetics.ts` | Pinyin with tone diacritics and Japanese Furigana dictionary |
| **Voice Synthesis (TTS)**| `edge-tts` (Microsoft Azure Neural) | High-fidelity natural voice narration with browser fallback |
| **Database** | SQLite (`language_stories.db`) | Local persistence for user vocabulary vault, SRS metrics, and story history |

---

##  Detailed Features

### 1.  3D Open Book & Content-Aware Pagination
* **Balanced Spread Distribution**: Eliminates starved or blank pages by balancing sentences and paragraphs across left and right book spreads.
* **Welcome State**: When no active story exists and there are no errors, the notebook presents a welcoming layout with suggested theme chips (e.g., *Morning Coffee*, *Street Lanterns*, *Train Journey*) and custom prompt input.

### 2.  100% Phonetic Coverage (Ruby / Pinyin / Furigana)
* **Full Pinyin**: When learning Mandarin, **100% of characters and words** receive official diacritic tone marks above text (e.g., `wǒ`, `kàn`, `hē`), not just new target vocabulary.
* **Japanese Furigana**: Kanji characters receive corresponding Hiragana readings.
* **Dual-Layer Guarantee**: Native backend processing via `pypinyin` paired with a client-side auxiliary morphological dictionary (`auxiliaryPhonetics.ts`) ensures phonetic annotations remain consistent in any scenario.

### 3.  In-Book Error Diagnostics (`BookErrorCard`)
No API failures are hidden behind silent fallbacks or dummy mockups. If an error occurs, an ornate diagnostic card is displayed directly on the book's right page:
*  **Invalid or Missing Gemini API Key (HTTP 400/403)**: Clear explanation with a 1-click **"Open Settings"** button.
*  **Quota Exceeded (HTTP 429 / RESOURCE_EXHAUSTED)**: Helpful instructions regarding rate limits, replenishment periods, and model switching.
*  **Missing TTS Voice**: Guidance on installing OS language packs or selecting the backend Edge-TTS engine.
* **Composition Interrupted Left Page**: Informs the reader that the digital scribe paused due to the pending configuration, assuring that existing vocabulary and SRS metrics remain intact.

### 4.  Interactive Dictionary & Morphological Deep Dive
* **1-Click Lookup**: Click any token in the story to inspect its translation, phonetic reading, part of speech, and repetition history.
* **AI Deep Dive ("Raio-X")**: Clicking the robot icon generates a detailed morphological breakdown:
  * Character anatomy (semantic and phonetic radicals).
  * Compound words and related vocabulary.
  * Cultural context and usage nuances.

### 5. Spaced Repetition System (SRS - SuperMemo SM-2)
* Four continuous mastery stages: `New (0-25%)`, `Learning (26-50%)`, `Review (51-84%)`, and `Mastered (85-100%)`.
* **Starred Words (⭐)**: Words marked as favorites receive maximum priority in subsequent story generations.
* **Retention Mini-Quiz**: Upon reaching the last spread of a story, an interactive quiz consolidates target vocabulary retention.

### 6. Real-Time Processing Terminal
* Floating terminal window with live SSE logs streaming every generation phase:
  * `Stage 1`: User history curation and target vocabulary selection.
  * `Stage 2`: Interlinear narrative composition and calculated repetition.
  * `Stage 3`: Grammar validation and phonetic trait enrichment.

---

## Supported Languages & Proficiency Scales

| Language | Code | Proficiency Framework | Phonetic Support |
| :--- | :---: | :---: | :---: |
| **Mandarin Chinese** (中文) | `zh` | HSK 1, HSK 2, HSK 3, HSK 4, HSK 5, HSK 6 | 100% Pinyin with Tones (`pypinyin`) |
| **Japanese** (日本語) | `ja` | JLPT N5, JLPT N4, JLPT N3, JLPT N2, JLPT N1 | Furigana in Hiragana |
| **Korean** (한국어) | `ko` | TOPIK 1, TOPIK 2, TOPIK 3, TOPIK 4, TOPIK 5, TOPIK 6 | Hangul & Romanization |
| **Spanish** (Español) | `es` | CEFR A1, A2, B1, B2, C1, C2 | Contextual interlinear translation |
| **French** (Français) | `fr` | CEFR A1, A2, B1, B2, C1, C2 | Contextual interlinear translation |
| **German** (Deutsch) | `de` | CEFR A1, A2, B1, B2, C1, C2 | Contextual interlinear translation |
| **Italian** (Italiano) | `it` | CEFR A1, A2, B1, B2, C1, C2 | Contextual interlinear translation |
| **English** (English) | `en` | CEFR A1, A2, B1, B2, C1, C2 | Contextual interlinear translation |
| **Portuguese** (Português) | `pt` | CEFR A1, A2, B1, B2, C1, C2 | Contextual interlinear translation |

---

## Step-by-Step Installation

> [!TIP]
> **Automated Setup**: When running either `run.bat` or `npm run dev`, the project automatically checks if `node_modules`, the Python virtual environment (`.venv`), or the `.env` configuration file are missing, and installs them automatically before starting the application! The manual steps below are optional if you prefer configuring the environment manually.

### Prerequisites
* **Node.js**: v18.0.0 or higher ([nodejs.org](https://nodejs.org/))
* **Python**: v3.10 or higher ([python.org](https://www.python.org/))
* **Git** installed

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/your-username/LANGUAGE-STORIES.git
cd LANGUAGE-STORIES
```

---

### Step 2: Install General Dependencies
At the root of the project (`LANGUAGE-STORIES`):
```bash
npm install
```
Then, install the frontend dependencies:
```bash
cd frontend
npm install
cd ..
```

---

### Step 3: Set Up the Backend Python Environment
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
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
3. Install Python libraries:
   ```bash
   pip install -r requirements.txt
   ```
4. Return to the root directory:
   ```bash
   cd ..
   ```

---

### Step 4: Configure the Gemini API Key

1. Access [Google AI Studio](https://aistudio.google.com/) for free.
2. Sign in with your Google account and click **"Create API Key"**.
3. Create a `.env` file at the root of the project (or inside `backend/.env`):
   ```env
   GEMINI_API_KEY=AIzaSy...your_key_here
   GEMINI_MODEL=gemini-3.6-flash
   ```
   *(You can also enter and test the key directly through the GUI in Settings ⚙️).*

---

### Step 5: Start the Application
Simply run at the root:
```bash
npm run dev
```
Or double-click the [run.bat](file:///e:/Projects/Coding/Personal/LANGUAGE%20STORIES/run.bat) executable.

Access in your browser:
* **Frontend**: `http://localhost:5173`
* **API Backend (Swagger Docs)**: `http://localhost:8000/docs`

---

## Project Structure

```
LANGUAGE-STORIES/
├── run.bat                       # 1-Click smart auto-installing launcher (Windows)
├── package.json                  # Root orchestration & predev hook (concurrently)
├── .gitignore                    # Protects .env keys, caches, and local databases
├── README.md                     # Official project documentation
│
├── scripts/
│   ├── setup.js                  # Cross-platform automated setup script
│   └── start-backend.js          # Helper that executes Python from .venv automatically
│
├── backend/                      # FastAPI server & AI generation engine
│   ├── languages/
│   │   ├── base.py               # Language profile base classes
│   │   ├── chinese.py            # Mandarin phonetics, radicals, and HSK metadata
│   │   ├── phonetics.py          # 100% Ruby enrichment with pypinyin & Furigana
│   │   └── profiles.py           # Language registry for all supported locales
│   ├── routers/
│   │   ├── stories.py            # SSE streaming story generation endpoints
│   │   ├── vocabulary.py         # Morphological Deep Dive and vocabulary routes
│   │   └── tts.py                # Edge-TTS neural voice synthesis routes
│   ├── services/
│   │   ├── ai_service.py         # Gemini API integration & strict error handling
│   │   └── tts_service.py        # Audio caching and streaming conversion
│   ├── config.py                 # Dynamic environment variable loader (.env)
│   ├── database.py               # SQLAlchemy models and local SQLite database
│   ├── main.py                   # FastAPI entrypoint with CORS configuration
│   └── requirements.txt          # Python dependencies (fastapi, google-genai, pypinyin, edge-tts)
│
└── frontend/                     # Single-Page Web Application (React + TypeScript + Vite)
    ├── src/
    │   ├── components/
    │   │   ├── Reader/           # StoryReader (3D book), BookErrorCard, WordPopover
    │   │   ├── Dictionary/       # Vocabulary vault views and filters
    │   │   ├── Quiz/             # Post-reading retention mini-quizzes
    │   │   ├── Terminal/         # Floating real-time processing terminal
    │   │   └── Settings/         # API key configurations, models, and themes
    │   ├── context/
    │   │   └── AppContext.tsx    # Global state management, SRS engine, audio controls
    │   ├── services/
    │   │   ├── auxiliaryPhonetics.ts # Client-side auxiliary phonetics lookup table
    │   │   ├── apiService.ts     # Request orchestrator & AI strategies
    │   │   ├── storageService.ts # LocalStorage management & sanitization
    │   │   └── ttsService.ts     # Client-side audio playback with Web Speech API
    │   ├── types/                # Unified TypeScript interfaces
    │   └── index.css             # Skeuomorphic styling and CSS design tokens
    ├── package.json
    └── vite.config.ts
```

---

## Privacy & Data Security

* **Local-First Storage**: Your learned vocabulary vault, reading history, and SRS metrics remain securely stored on your own device (`localStorage` and `language_stories.db`).
* **Credential Protection**: The project `.gitignore` strictly prevents private API keys (`.env`), cached audio files (`.mp3`), and user databases from ever being committed to Git.

---

## 📄 License

Distributed under the **MIT License**. Feel free to use, study, and enhance the codebase.
