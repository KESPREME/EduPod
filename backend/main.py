from fastapi import FastAPI, UploadFile, File, BackgroundTasks, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import shutil
import os
import uuid
import asyncio
import json
import gc
from pydantic import BaseModel
from typing import List, Optional
from processor import process_pdf, generate_script, generate_quiz, generate_flashcards, generate_notes, ask_tutor
from synth import synthesize_podcast, generate_video_from_audio

# Try to import torch for GPU memory cleanup (optional)
try:
    import torch
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False

class AskTutorRequest(BaseModel):
    job_id: str
    question: str
    history: List[List[str]] = []

app = FastAPI()

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
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
        except:
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

@app.get("/")
async def root():
    return {"message": "EduPod API V2 is running"}

@app.post("/upload")
async def upload_pdf(
    file: UploadFile = File(...),
    language: str = Form(default="en"),
    tts_provider: str = Form(default="chatterbox")
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
        
        # Parallel generation of aux learning materials
        update_job(job_id, {"status": "Generating quiz, flashcards & notes..."})
        
        # We run these while TTS is warming up/processing or just sequentially
        quiz_data = generate_quiz(script)
        flashcards_data = generate_flashcards(text)
        notes_data = generate_notes(text)
        
        update_job(job_id, {"status": f"Synthesizing audio ({tts_provider})..."})
        output_file = os.path.join(OUTPUT_DIR, f"{job_id}.mp3")
        metadata = await synthesize_podcast(script, output_file, voices, tts_provider, language)
        
        update_job(job_id, {
            "status": "Completed",
            "output_url": f"/download/{job_id}",
            "metadata": metadata,
            "quiz": quiz_data,
            "flashcards": flashcards_data,
            "notes": notes_data
        })
        
        # ===== MEMORY CLEANUP =====
        await cleanup_memory(job_id)
        
    except Exception as e:
        update_job(job_id, {"status": f"Error: {str(e)}"})
        print(f"Error processing job {job_id}: {e}")
        # Still try to cleanup on error
        await cleanup_memory(job_id)

async def cleanup_memory(job_id: str):
    """
    Cleans up RAM and GPU memory after job processing.
    - Runs Python garbage collector
    - Clears PyTorch CUDA cache if available
    - Logs stabilization
    """
    print(f"🧹 [Job {job_id[:8]}] Starting memory cleanup...")
    
    # Force garbage collection
    collected = gc.collect()
    print(f"   ↳ GC collected {collected} objects")
    
    # Clear GPU memory if PyTorch with CUDA is available
    if HAS_TORCH and torch.cuda.is_available():
        torch.cuda.empty_cache()
        torch.cuda.synchronize()
        print(f"   ↳ CUDA cache cleared")
    
    # Give the system a moment to stabilize
    await asyncio.sleep(0.5)
    print(f"✅ [Job {job_id[:8]}] Memory cleanup complete. System stabilized.")

@app.get("/status/{job_id}")
async def get_status(job_id: str):
    # Check if job exists in memory/file
    if job_id in jobs:
        return jobs[job_id]
    
    # Check if audio file exists (job completed before restart)
    output_file = os.path.join(OUTPUT_DIR, f"{job_id}.mp3")
    if os.path.exists(output_file):
        # Reconstruct minimal job data
        return {
            "status": "Completed",
            "output_url": f"/download/{job_id}",
            "metadata": []  # Metadata lost but audio exists
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
    if "script" not in jobs[job_id]:
        raise HTTPException(status_code=400, detail="Script not ready yet")
    
    # Generate quiz from script
    script = jobs[job_id]["script"]
    quiz = generate_quiz(script)
    return {"quiz": quiz}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8005, reload=True)

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
    
    # Use cover image if available, else try to find one or None
    # For now, we'll try to find a cover image or use a default
    # If we had a cover_image in job metadata we'd use it.
    # Simple logic: check if job_id.png exists in uploads (if user uploaded cover?) 
    # Or just use None -> black background.
    cover_image = None
    
    # Check if video already exists
    if os.path.exists(output_mp4):
        return {"status": "Video already exists", "url": f"/download_video/{job_id}"}

    # Run generation synchronously (ffmpeg is fast for still images) or background?
    # It might take 10-20s. Let's do it in background or await if fast.
    # Actually, let's do it synchronously because the user is waiting for "Download" 
    # But usually browser waits.
    
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
    
    # Get context (use script if available, else generic info)
    context = job.get("script", "")
    if not context:
        context = "The user is asking about a document they uploaded but the script hasn't been generated yet."
        
    answer = ask_tutor(context, req.question, req.history)
    return {"answer": answer}
