# EduPod — Deployment & Local Run Guide

> Transform PDFs into immersive audio learning experiences with AI.

---

## Architecture Overview

```
┌─────────────────┐          ┌──────────────────────────────┐
│   Next.js App   │←─REST──→ │      FastAPI Backend          │
│   (Vercel)      │          │ (Vercel / Render / VPS)       │
│                 │          │                               │
│ NEXT_PUBLIC_    │          │ OpenRouter API ───→ LLM       │
│ API_URL=backend │          │ Azure Speech ───→ TTS         │
└─────────────────┘          │ Edge TTS ───→ Fallback        │
                             └──────────────────────────────┘
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

3. **After Vercel deploy**, update your backend env:
   ```
   FRONTEND_URL=https://your-app.vercel.app
   ```

### Backend Deployment Options

#### Option A: Vercel (Serverless) — Recommended for Free Tier

> [!IMPORTANT]
> Vercel serverless functions have a **10s timeout** (free) / **60s timeout** (Pro).
> Long-running podcast generation jobs may time out. For production workloads,
> consider Render or a VPS. For demos and light usage, Vercel works great.

1. **Create `vercel.json`** in the `backend/` folder (already created):
   ```json
   {
     "version": 2,
     "builds": [
       { "src": "main.py", "use": "@vercel/python" }
     ],
     "routes": [
       { "src": "/(.*)", "dest": "main.py" }
     ]
   }
   ```

2. **Deploy**:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import the **same repository**
   - Set **Root Directory** to `backend`
   - Framework Preset: **Other**
   - Add environment variables:
     ```
     OPENROUTER_API_KEY=sk-or-v1-...
     AZURE_SPEECH_KEY=your-key          (optional)
     AZURE_SPEECH_REGION=centralindia   (optional)
     FRONTEND_URL=https://your-app.vercel.app
     ```
   - Click **Deploy**

3. **Update frontend** `NEXT_PUBLIC_API_URL`:
   ```
   https://your-backend-project.vercel.app
   ```

> [!NOTE]
> Vercel serverless functions use `/tmp` for writable storage (ephemeral).
> Uploaded files and generated audio will not persist across function invocations.
> For persistent storage, integrate with an external service (e.g., Supabase Storage, S3).

#### Option B: Render (Persistent Server) — Recommended for Production

> [!TIP]
> Render free tier spins down after **15 min of inactivity** (~30-50s cold start).
> Use a free cron service to keep it alive (see step 6 below).

1. Go to [render.com](https://render.com) → **New Web Service**
2. Connect your GitHub repo, set **Root Directory** to `backend`
3. **Runtime**: `Python`
4. **Build Command**: `pip install -r requirements.txt`
5. **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Add environment variables:
   ```
   OPENROUTER_API_KEY=sk-or-v1-...
   AZURE_SPEECH_KEY=your-key          (optional)
   AZURE_SPEECH_REGION=centralindia   (optional)
   FRONTEND_URL=https://your-app.vercel.app
   ```
7. Click **Create Web Service**

**🔄 Keep-Alive Cron (Prevent Spin-Down):**

Your backend already has a `/health` endpoint. Use a free external cron service to ping it every **14 minutes**:

- **Option 1 — [cron-job.org](https://cron-job.org)** (free, no signup required):
  1. Go to [cron-job.org](https://cron-job.org) → Create Account → **Create Cron Job**
  2. **URL**: `https://your-render-backend.onrender.com/health`
  3. **Schedule**: Every **14 minutes** (`*/14 * * * *`)
  4. Save — your backend will never sleep! ✅

- **Option 2 — [UptimeRobot](https://uptimerobot.com)** (free, 50 monitors):
  1. Sign up → **Add New Monitor**
  2. **Monitor Type**: HTTP(s)
  3. **URL**: `https://your-render-backend.onrender.com/health`
  4. **Monitoring Interval**: 5 minutes
  5. Save — also gives you uptime alerts!

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
