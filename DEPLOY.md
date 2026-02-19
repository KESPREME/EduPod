# EduPod — Deployment & Local Run Guide

> Transform PDFs into immersive audio learning experiences with AI.

---

## Architecture Overview

```
┌─────────────────┐          ┌────────────────────────┐
│   Next.js App   │←─REST──→ │    FastAPI Backend      │
│   (Vercel)      │          │ (Railway / Render / VPS)│
│                 │          │                         │
│ NEXT_PUBLIC_    │          │ OpenRouter API ───→ LLM │
│ API_URL=backend │          │ Azure Speech ───→ TTS   │
└─────────────────┘          │ Edge TTS ───→ Fallback  │
                             └────────────────────────┘
```

---

## 🏠 Local Development

### Prerequisites
- **Node.js** 18+ and npm
- **Python** 3.10+
- **FFmpeg** (optional, for video generation)
- **OpenRouter API key** (free tier available)
- **Azure Speech key** (optional — falls back to Edge TTS)

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate   # Windows
# source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env  # Windows
# cp .env.example .env  # Linux/Mac

# Edit .env — set your keys:
# OPENROUTER_API_KEY=sk-or-v1-your-key
# AZURE_SPEECH_KEY=your-azure-key       (optional)
# AZURE_SPEECH_REGION=eastus            (optional)

# Start the backend
python main.py
# → Running on http://0.0.0.0:8005
```

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies  
npm install

# Create local env (already provided)
# .env.local should have: NEXT_PUBLIC_API_URL=http://localhost:8005

# Start dev server
npm run dev
# → Running on http://localhost:3000
```

### 3. Quick Test
1. Open http://localhost:3000
2. Upload any PDF from the Create page
3. Watch the terminal for:
   - `🔧 OpenRouter client initialized`
   - `🎙️ Synthesizing ... lines with Azure Neural TTS` (or Edge TTS)
   - `✅ Audio synthesis complete!`
4. Listen to the generated podcast, try quiz/flashcards/notes

---

## 🚀 Production Deployment

### Frontend → Vercel

1. **Push to GitHub** (if not already)

2. **Deploy on Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your repository
   - Set **Root Directory** to `frontend`
   - Set **Framework Preset** to `Next.js`
   - Add Environment Variable:
     ```
     NEXT_PUBLIC_API_URL = https://your-backend-url.com
     ```
   - Click **Deploy**

3. **After Vercel deploy**, update your backend `.env`:
   ```
   FRONTEND_URL=https://your-app.vercel.app
   ```

### Backend → Railway / Render / Fly.io

#### Option A: Railway

1. Go to [railway.app](https://railway.app) → New Project → Deploy from Repo
2. Set **Root Directory** to `backend`
3. Add environment variables:
   ```
   OPENROUTER_API_KEY=sk-or-v1-...
   AZURE_SPEECH_KEY=your-key
   AZURE_SPEECH_REGION=eastus
   FRONTEND_URL=https://your-app.vercel.app
   ```
4. Set **Start Command**: `python main.py`
5. Railway will auto-detect Python + install requirements

#### Option B: Render

1. Go to [render.com](https://render.com) → New Web Service
2. Connect repo, set **Root Directory** to `backend`
3. **Build Command**: `pip install -r requirements.txt`
4. **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables (same as Railway)

#### Option C: Any VPS / Docker

```dockerfile
# backend/Dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*
COPY . .
EXPOSE 8005
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8005"]
```

```bash
docker build -t edupod-backend .
docker run -p 8005:8005 --env-file .env edupod-backend
```

---

## 🔑 Environment Variables Reference

### Frontend (.env.local)
| Variable | Required | Default | Description |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | Yes | `http://localhost:8005` | Backend API URL |

### Backend (.env)
| Variable | Required | Default | Description |
|---|---|---|---|
| `OPENROUTER_API_KEY` | **Yes** | — | OpenRouter API key for Step 3.5 Flash |
| `AZURE_SPEECH_KEY` | No | — | Azure Speech key (falls back to Edge TTS) |
| `AZURE_SPEECH_REGION` | No | — | Azure region (e.g., `eastus`) |
| `FRONTEND_URL` | No | `http://localhost:3000` | Frontend URL for CORS |

---

## 🧪 Troubleshooting

| Issue | Fix |
|---|---|
| `OPENROUTER_API_KEY not set` | Copy `.env.example` → `.env` and add your key |
| Azure TTS not working | Check `AZURE_SPEECH_KEY` and `AZURE_SPEECH_REGION` are set. Falls back to Edge TTS automatically. |
| CORS errors in browser | Ensure `FRONTEND_URL` in backend `.env` matches your frontend URL |
| Audio not playing | Check FFmpeg is installed (`ffmpeg -version`) for video. MP3 should work without it. |
| `next build` fails | Run `npm install` in frontend first |
