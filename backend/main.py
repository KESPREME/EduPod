from fastapi import FastAPI, UploadFile, File, BackgroundTasks, HTTPException, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
import warnings
import shutil
import os
import tempfile
import uuid
import asyncio
import json
from pydantic import BaseModel
from typing import List, Optional
from dotenv import load_dotenv

# Suppress pydub SyntaxWarnings on Python 3.13+ (invalid escape sequences in their regex)
warnings.filterwarnings("ignore", category=SyntaxWarning, module="pydub")

# Load environment variables from .env file
load_dotenv()

from processor import process_pdf, generate_script, generate_quiz, generate_flashcards, generate_notes, ask_tutor
from synth import synthesize_podcast, generate_video_from_audio
from supabase import create_client, Client

# Initialize Supabase client
SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

supabase_client: Client | None = None
if SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("✅ Supabase client initialized.")
    except Exception as e:
        print(f"⚠️ Failed to initialize Supabase: {e}")


class AskTutorRequest(BaseModel):
    job_id: str
    question: str
    history: List[List[str]] = []

app = FastAPI(
    title="EduPod API",
    description="Transform PDFs into immersive audio learning experiences",
    version="3.0.0",
)

# CORS Configuration — supports env-based frontend URL
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")
allowed_origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    FRONTEND_URL,
]
# Also allow any Vercel preview deployments
if "vercel.app" not in FRONTEND_URL:
    allowed_origins.append("https://*.vercel.app")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
OUTPUT_DIR = "output"
JOBS_FILE = "jobs.json"

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Job persistence functions
def load_jobs():
    """Load jobs from JSON file."""
    if os.path.exists(JOBS_FILE):
        try:
            with open(JOBS_FILE, "r") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}

def save_jobs():
    """Save jobs to JSON file."""
    try:
        with open(JOBS_FILE, "w") as f:
            json.dump(jobs, f)
    except Exception as e:
        print(f"Warning: Could not save jobs: {e}")

def update_job(job_id: str, updates: dict):
    """Update a job and persist to disk."""
    if job_id in jobs:
        jobs[job_id].update(updates)
        save_jobs()

# Load existing jobs on startup
jobs = load_jobs()

# Language to TTS voice mapping
LANGUAGE_VOICES = {
    "en": {"host_1": "en-US-ChristopherNeural", "host_2": "en-US-AnaNeural"},
    "hi": {"host_1": "hi-IN-MadhurNeural", "host_2": "hi-IN-SwaraNeural"},
    "es": {"host_1": "es-ES-AlvaroNeural", "host_2": "es-ES-ElviraNeural"},
    "fr": {"host_1": "fr-FR-HenriNeural", "host_2": "fr-FR-DeniseNeural"},
    "de": {"host_1": "de-DE-ConradNeural", "host_2": "de-DE-KatjaNeural"},
    "zh": {"host_1": "zh-CN-YunxiNeural", "host_2": "zh-CN-XiaoxiaoNeural"},
}

@app.api_route("/", methods=["GET", "HEAD"])
async def root():
    return {
        "message": "EduPod API V3 is running",
        "version": "3.0.0",
        "llm": "Step 3.5 Flash (OpenRouter)",
        "tts": "Azure Neural TTS + Edge TTS fallback",
    }

@app.api_route("/health", methods=["GET", "HEAD"])
async def health_check():
    """Health check endpoint for deployment monitoring."""
    return {"status": "healthy"}

@app.post("/upload")
async def upload_pdf(
    file: UploadFile = File(...),
    language: str = Form(default="en"),
    tts_provider: str = Form(default="azure")
):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed.")
    
    job_id = str(uuid.uuid4())
    file_path = os.path.join(UPLOAD_DIR, f"{job_id}.pdf")
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Get voices for selected language
    voices = LANGUAGE_VOICES.get(language, LANGUAGE_VOICES["en"])
    
    jobs[job_id] = {
        "status": "Processing PDF...", 
        "file_path": file_path,
        "language": language,
        "voices": voices,
        "tts_provider": tts_provider
    }
    save_jobs()
    
    # Start background processing
    asyncio.create_task(process_job(job_id, file_path, language, voices, tts_provider))
    
    return {"job_id": job_id}

async def process_job(job_id: str, file_path: str, language: str, voices: dict, tts_provider: str):
    try:
        update_job(job_id, {"status": "Extracting text and chunking..."})
        text = process_pdf(file_path)
        
        update_job(job_id, {"status": "Generating podcast script (AI)..."})
        script = generate_script(text, language, tts_provider)
        update_job(job_id, {"script": script})
        
        # Generate auxiliary learning materials
        update_job(job_id, {"status": "Generating quiz, flashcards & notes..."})
        
        quiz_data = generate_quiz(text)
        flashcards_data = generate_flashcards(text)
        notes_data = generate_notes(text)
        
        update_job(job_id, {"status": f"Synthesizing audio ({tts_provider})..."})
        output_file = os.path.join(OUTPUT_DIR, f"{job_id}.mp3")
        metadata = await synthesize_podcast(script, output_file, voices, tts_provider, language)
        
        # Upload to Supabase if available
        public_url = None
        if supabase_client:
            update_job(job_id, {"status": "Uploading to Supabase..."})
            try:
                with open(output_file, "rb") as f:
                    # Upload the file
                    supabase_client.storage.from_("lessons-audio").upload(
                        path=f"{job_id}.mp3", 
                        file=f.read(),
                        file_options={"content-type": "audio/mpeg", "upsert": "true"}
                    )
                # Get the public URL
                public_url = supabase_client.storage.from_("lessons-audio").get_public_url(f"{job_id}.mp3")
            except Exception as up_e:
                print(f"⚠️ Supabase upload failed: {up_e}, falling back to local storage.")
        
        update_job(job_id, {
            "status": "Completed",
            "output_url": public_url if public_url else f"/download/{job_id}",
            "metadata": metadata,
            "quiz": quiz_data,
            "flashcards": flashcards_data,
            "notes": notes_data,
            "source_text": text
        })
        
        print(f"✅ Job {job_id[:8]} completed successfully!")
        
    except Exception as e:
        update_job(job_id, {"status": f"Error: {str(e)}"})
        print(f"❌ Error processing job {job_id}: {e}")
        import traceback
        traceback.print_exc()

@app.get("/status/{job_id}")
async def get_status(job_id: str):
    # Check if job exists in memory/file
    if job_id in jobs:
        return jobs[job_id]
    
    # Check if audio file exists (job completed before restart)
    output_file = os.path.join(OUTPUT_DIR, f"{job_id}.mp3")
    if os.path.exists(output_file):
        return {
            "status": "Completed",
            "output_url": f"/download/{job_id}",
            "metadata": []
        }
    
    raise HTTPException(status_code=404, detail="Job not found")

@app.get("/download/{job_id}")
async def download_podcast(job_id: str):
    output_file = os.path.join(OUTPUT_DIR, f"{job_id}.mp3")
    if not os.path.exists(output_file):
        raise HTTPException(status_code=404, detail="Audio file not found")
    return FileResponse(output_file, media_type="audio/mpeg", filename="podcast.mp3")

@app.get("/transcript/{job_id}")
async def get_transcript(job_id: str):
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    if "metadata" not in jobs[job_id]:
        raise HTTPException(status_code=400, detail="Transcript not ready yet")
    return {"transcript": jobs[job_id].get("metadata", [])}

@app.get("/quiz/{job_id}")
async def get_quiz(job_id: str):
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    if "script" not in jobs[job_id] and "source_text" not in jobs[job_id]:
        raise HTTPException(status_code=400, detail="Content not ready yet")
    
    text = jobs[job_id].get("source_text", jobs[job_id].get("script", ""))
    quiz = generate_quiz(text)
    return {"quiz": quiz}

@app.post("/generate_video/{job_id}")
async def create_video(job_id: str, background_tasks: BackgroundTasks):
    """Generate an MP4 video for a job."""
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
        
    job = jobs[job_id]
    if job.get("status") != "Completed":
        raise HTTPException(status_code=400, detail="Job not completed yet")
        
    output_mp3 = os.path.join(OUTPUT_DIR, f"{job_id}.mp3")
    output_mp4 = os.path.join(OUTPUT_DIR, f"{job_id}.mp4")
    
    cover_image = None
    
    if os.path.exists(output_mp4):
        return {"status": "Video already exists", "url": f"/download_video/{job_id}"}

    success = generate_video_from_audio(output_mp3, cover_image, output_mp4)
    
    if not success:
        raise HTTPException(status_code=500, detail="Video generation failed")
        
    return {"status": "Video generated", "url": f"/download_video/{job_id}"}

@app.get("/download_video/{job_id}")
async def download_video(job_id: str):
    file_path = os.path.join(OUTPUT_DIR, f"{job_id}.mp4")
    if os.path.exists(file_path):
        return FileResponse(file_path, media_type="video/mp4", filename=f"EduPod_Lesson_{job_id[:8]}.mp4")
    raise HTTPException(status_code=404, detail="Video not found")

@app.post("/ask_tutor")
async def ask_tutor_endpoint(req: AskTutorRequest):
    if req.job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
        
    job = jobs[req.job_id]
    
    context = job.get("script", "")
    if not context:
        context = "The user is asking about a document they uploaded but the script hasn't been generated yet."
        
    answer = ask_tutor(context, req.question, req.history)
    return {"answer": answer}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8005, reload=True)
