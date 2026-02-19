import asyncio
import edge_tts
from pydub import AudioSegment
import os
import tempfile
import re
import subprocess
import httpx
import ssl

def get_chatterbox_url():
    """Get Chatterbox API URL from environment (read at runtime, not module load)."""
    return os.environ.get("CHATTERBOX_API_URL", "").strip()

# Edge TTS Voices (Fast cloud-based fallback)
VOICES = {
    "host_1": "en-US-ChristopherNeural",
    "host_2": "en-US-AnaNeural"
}

# Language to Edge TTS voice mapping
LANGUAGE_VOICES = {
    "en": {"host_1": "en-US-ChristopherNeural", "host_2": "en-US-AnaNeural"},
    "hi": {"host_1": "hi-IN-MadhurNeural", "host_2": "hi-IN-SwaraNeural"},
    "es": {"host_1": "es-ES-AlvaroNeural", "host_2": "es-ES-ElviraNeural"},
    "fr": {"host_1": "fr-FR-HenriNeural", "host_2": "fr-FR-DeniseNeural"},
    "de": {"host_1": "de-DE-ConradNeural", "host_2": "de-DE-KatjaNeural"},
    "zh": {"host_1": "zh-CN-YunxiNeural", "host_2": "zh-CN-XiaoxiaoNeural"},
    "ja": {"host_1": "ja-JP-KeitaNeural", "host_2": "ja-JP-NanamiNeural"},
    "ko": {"host_1": "ko-KR-InJoonNeural", "host_2": "ko-KR-SunHiNeural"},
}

# MeloTTS Language and Speaker Configuration
MELO_LANGUAGES = {
    "en": {"lang": "EN", "speakers": {"host_1": "EN-Default", "host_2": "EN-AU"}},
    "es": {"lang": "ES", "speakers": {"host_1": "ES", "host_2": "ES"}},
    "fr": {"lang": "FR", "speakers": {"host_1": "FR", "host_2": "FR"}},
    "zh": {"lang": "ZH", "speakers": {"host_1": "ZH", "host_2": "ZH"}},
    "ja": {"lang": "JP", "speakers": {"host_1": "JP", "host_2": "JP"}},
    "ko": {"lang": "KR", "speakers": {"host_1": "KR", "host_2": "KR"}},
}

# Lazy-loaded MeloTTS models
_melo_models = {}
_melo_available = None
_nltk_downloaded = False

def clean_text_for_tts(text: str) -> str:
    """Remove any bracket expressions like (laughs), (sighs) from text."""
    return re.sub(r'\([^)]*\)', '', text).strip()

# ============== CHATTERBOX TURBO TTS (Colab API) ==============
async def check_chatterbox_available():
    """Check if Chatterbox Turbo API is available."""
    url = get_chatterbox_url()
    if not url:
        print("⚠️  CHATTERBOX_API_URL not set in environment")
        return False
    
    print(f"🔍 Checking Chatterbox Turbo at: {url}")
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{url}/")
            print(f"📡 Chatterbox Turbo response: {response.status_code}")
            return response.status_code == 200
    except Exception as e:
        print(f"⚠️  Chatterbox Turbo connection error: {e}")
        return False

async def synthesize_dialogue_chatterbox(script_lines: list, output_path: str, max_retries: int = 3):
    """
    Synthesize dialogue using Chatterbox Turbo API running on Colab.
    Uses BATCHED generation to avoid SSL timeouts with ngrok.
    Each batch is 5 lines max to keep connections short.
    """
    url = get_chatterbox_url()
    if not url:
        print("⚠️  CHATTERBOX_API_URL not set")
        return False
    
    # Clean all lines
    lines_data = [{"host": h, "content": clean_text_for_tts(c)} for h, c in script_lines]
    
    # Split into batches of 5 lines (keeps each request under ~2 minutes)
    BATCH_SIZE = 5
    batches = [lines_data[i:i+BATCH_SIZE] for i in range(0, len(lines_data), BATCH_SIZE)]
    
    print(f"🎙️ Generating {len(lines_data)} lines in {len(batches)} batches (Chatterbox Turbo)...")
    
    all_audio_segments = []
    all_metadata = []
    
    for batch_idx, batch in enumerate(batches):
        print(f"📦 Batch {batch_idx + 1}/{len(batches)} ({len(batch)} lines)...")
        
        # Retry logic per batch
        batch_success = False
        for attempt in range(max_retries):
            try:
                if attempt > 0:
                    wait_time = 5 * (2 ** attempt)  # 10s, 20s, 40s
                    print(f"  🔄 Retry {attempt + 1}/{max_retries} in {wait_time}s...")
                    await asyncio.sleep(wait_time)
                
                # Shorter timeout for smaller batches (3 minutes)
                timeout = httpx.Timeout(180.0, connect=30.0)
                
                async with httpx.AsyncClient(timeout=timeout, verify=True) as client:
                    response = await client.post(
                        f"{url}/synthesize_dialogue",
                        json={"lines": batch}
                    )
                    
                    if response.status_code != 200:
                        print(f"  ⚠️  API error: {response.text}")
                        continue
                    
                    result = response.json()
                    audio_url = result.get("audio_url")
                    
                    if not audio_url:
                        print("  ⚠️  No audio URL in response")
                        continue
                    
                    # Download batch audio
                    audio_response = await client.get(f"{url}{audio_url}")
                    
                    if audio_response.status_code != 200:
                        print("  ⚠️  Failed to download audio")
                        continue
                    
                    # Save batch audio temporarily
                    batch_wav_path = output_path.replace('.mp3', f'_batch{batch_idx}.wav')
                    with open(batch_wav_path, 'wb') as f:
                        f.write(audio_response.content)
                    
                    # Load and store segment
                    batch_segment = AudioSegment.from_wav(batch_wav_path)
                    all_audio_segments.append(batch_segment)
                    all_metadata.extend(result.get("metadata", []))
                    os.remove(batch_wav_path)
                    
                    print(f"  ✅ Batch {batch_idx + 1} complete!")
                    batch_success = True
                    break
                    
            except httpx.TimeoutException:
                print(f"  ⚠️  Timeout on attempt {attempt + 1}/{max_retries}")
                continue
            except ssl.SSLError as e:
                print(f"  ⚠️  SSL error on attempt {attempt + 1}/{max_retries}")
                continue
            except Exception as e:
                error_str = str(e)
                if "SSL" in error_str or "ssl" in error_str or "decryption" in error_str.lower():
                    print(f"  ⚠️  SSL/Connection error on attempt {attempt + 1}/{max_retries}")
                    continue
                print(f"  ⚠️  Error: {e}")
                return False
        
        if not batch_success:
            print(f"⚠️  Batch {batch_idx + 1} failed after {max_retries} retries")
            return False
    
    # Combine all batches
    if all_audio_segments:
        print("🔗 Combining all batches...")
        combined = all_audio_segments[0]
        for seg in all_audio_segments[1:]:
            combined += seg
        
        combined.export(output_path, format="mp3")
        print(f"✅ Chatterbox Turbo generated {len(all_metadata)} segments successfully!")
        return True, all_metadata
    
    print("⚠️  No audio generated")
    return False


# ============== MELOTTS ==============
def ensure_nltk_data():
    """Download required NLTK data for MeloTTS."""
    global _nltk_downloaded
    if _nltk_downloaded:
        return
    
    try:
        import nltk
        required_data = ['averaged_perceptron_tagger_eng', 'punkt', 'punkt_tab']
        for data in required_data:
            try:
                nltk.data.find(f'taggers/{data}' if 'tagger' in data else f'tokenizers/{data}')
            except LookupError:
                print(f"📥 Downloading NLTK {data}...")
                nltk.download(data, quiet=True)
        _nltk_downloaded = True
    except Exception as e:
        print(f"⚠️  NLTK download warning: {e}")
        _nltk_downloaded = True

def get_melo_model(language: str = "en"):
    """Get or initialize the MeloTTS model for a specific language."""
    global _melo_models, _melo_available
    
    if _melo_available is False:
        return None, None
    
    melo_config = MELO_LANGUAGES.get(language)
    if not melo_config:
        return None, None
    
    melo_lang = melo_config["lang"]
    
    try:
        if melo_lang not in _melo_models:
            ensure_nltk_data()
            print(f"🔊 Loading MeloTTS model for {melo_lang}...")
            from melo.api import TTS
            
            device = 'auto'
            model = TTS(language=melo_lang, device=device)
            speaker_ids = model.hps.data.spk2id
            _melo_models[melo_lang] = (model, speaker_ids)
            print(f"✅ MeloTTS {melo_lang} loaded successfully")
        
        _melo_available = True
        return _melo_models[melo_lang]
        
    except Exception as e:
        print(f"⚠️  Failed to load MeloTTS: {e}")
        _melo_available = False
        return None, None

def synthesize_line_melo_sync(text: str, output_path: str, language: str = "en", host: str = "host_1"):
    """Synchronous MeloTTS synthesis."""
    global _melo_available
    
    if _melo_available is False:
        return False
    
    try:
        model, speaker_ids = get_melo_model(language)
        if model is None:
            return False
        
        melo_config = MELO_LANGUAGES.get(language)
        speaker_name = melo_config["speakers"].get(host, melo_config["speakers"]["host_1"])
        
        if speaker_name not in speaker_ids:
            speaker_name = list(speaker_ids.keys())[0]
        
        speaker_id = speaker_ids[speaker_name]
        wav_path = output_path.replace('.mp3', '.wav')
        
        clean_text = clean_text_for_tts(text)
        model.tts_to_file(clean_text, speaker_id, wav_path, speed=1.0)
        
        audio = AudioSegment.from_wav(wav_path)
        audio.export(output_path, format="mp3")
        os.remove(wav_path)
        
        return True
        
    except Exception as e:
        print(f"⚠️  MeloTTS error: {e}")
        return False

# ============== EDGE TTS ==============
async def synthesize_line_edge(text, voice, output_path):
    """Synthesize a line using Edge TTS (Microsoft's free cloud TTS)."""
    clean_text = clean_text_for_tts(text)
    communicate = edge_tts.Communicate(clean_text, voice, rate="-5%")
    await communicate.save(output_path)

# ============== MAIN SYNTHESIS ==============
async def synthesize_podcast(script_text: str, output_file: str, voices: dict = None, provider: str = "chatterbox", language: str = "en"):
    """
    Parses the script, synthesizes each line, and merges them into a single file.
    
    Fallback chain: chatterbox (Colab) -> melo (local CPU) -> edge (cloud)
    
    Args:
        provider: 'chatterbox' (default, Colab T4), 'melo', or 'edge'
    """
    if voices is None:
        voices = LANGUAGE_VOICES.get(language, VOICES)
    
    lines = script_text.strip().split("\n")
    processed_lines = []
    
    for line in lines:
        if ":" in line:
            parts = line.split(":", 1)
            host = parts[0].strip().lower()
            content = parts[1].strip()
            
            content = clean_text_for_tts(content)
            
            if "host_1" in host or "teacher" in host or "professor" in host:
                processed_lines.append(("host_1", content))
            elif "host_2" in host or "student" in host or "guest" in host:
                processed_lines.append(("host_2", content))

    if not processed_lines:
        raise ValueError("Could not parse any valid lines from the script.")

    metadata = [{"host": h, "content": c} for h, c in processed_lines]
    
    # Try Chatterbox first (Colab API - fast, high quality)
    if provider == "chatterbox":
        is_available = await check_chatterbox_available()
        
        if is_available:
            result = await synthesize_dialogue_chatterbox(processed_lines, output_file)
            
            if result:
                if isinstance(result, tuple):
                    _, api_metadata = result
                    if api_metadata:
                        return api_metadata
                
                # Calculate durations from file
                try:
                    total_audio = AudioSegment.from_mp3(output_file)
                    total_duration = total_audio.duration_seconds
                    avg_duration = total_duration / len(processed_lines)
                    for i in range(len(metadata)):
                        metadata[i]["duration"] = avg_duration
                except:
                    pass
                return metadata
        
        print("ℹ️  Chatterbox unavailable, trying MeloTTS...")

    # Fallback: Line-by-line synthesis
    combined_audio = AudioSegment.empty()
    
    with tempfile.TemporaryDirectory() as tmp_dir:
        snippet_paths = []
        melo_fallback_used = False
        edge_fallback_used = False
        
        for i, (host, content) in enumerate(processed_lines):
            snippet_path = os.path.join(tmp_dir, f"line_{i}.mp3")
            snippet_paths.append(snippet_path)
            
            synthesized = False
            
            # Try MeloTTS (Option 2 or fallback from Chatterbox)
            if provider == "melo" or (provider == "chatterbox" and not synthesized):
                loop = asyncio.get_event_loop()
                synthesized = await loop.run_in_executor(
                    None, 
                    synthesize_line_melo_sync, 
                    content, 
                    snippet_path, 
                    language,
                    host
                )
                
                if not synthesized and not melo_fallback_used:
                    print("ℹ️  MeloTTS unavailable, using Edge TTS...")
                    melo_fallback_used = True
            
            # Fallback to Edge TTS (Option 3)
            if not synthesized:
                voice = voices.get(host, voices.get("host_1", VOICES["host_1"]))
                await synthesize_line_edge(content, voice, snippet_path)
                if not edge_fallback_used:
                    edge_fallback_used = True
            
        # Merge audio
        for idx, path in enumerate(snippet_paths):
            if os.path.exists(path):
                try:
                    segment = AudioSegment.from_mp3(path)
                except Exception:
                    try:
                        segment = AudioSegment.from_file(path)
                    except Exception as e:
                        print(f"⚠️  Could not load audio file {path}: {e}")
                        continue
                
                duration = segment.duration_seconds
                metadata[idx]["duration"] = duration
                combined_audio += segment + AudioSegment.silent(duration=700)
        
        combined_audio.export(output_file, format="mp3")
        return metadata

# ============== VIDEO GENERATION ==============
def generate_video_from_audio(audio_path: str, image_path: str, output_path: str):
    """
    Generate an MP4 video from an audio file and a static image using FFmpeg.
    """
    try:
        print(f"🎬 Generating video: {output_path}")
        
        # Check if ffmpeg is available
        try:
            subprocess.run(["ffmpeg", "-version"], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        except FileNotFoundError:
            print("⚠️  FFmpeg not found. Cannot generate video.")
            return False

        # If image doesn't exist, use a solid color background
        use_image = image_path and os.path.exists(image_path)
        
        input_args = []
        if use_image:
            # -loop 1 -i image.png
            input_args = ["-loop", "1", "-i", image_path]
        else:
            # -f lavfi -i color=c=black:s=1920x1080:r=1
            input_args = ["-f", "lavfi", "-i", "color=c=#1a1a1a:s=1920x1080:r=1"]

        # FFmpeg command
        # ffmpeg -loop 1 -i image.png -i audio.mp3 -c:v libx264 -tune stillimage -c:a aac -b:a 192k -pix_fmt yuv420p -shortest out.mp4
        cmd = [
            "ffmpeg", "-y",  # Overwrite
            *input_args,
            "-i", audio_path,
            "-c:v", "libx264",
            "-tune", "stillimage",
            "-c:a", "aac",
            "-b:a", "192k",
            "-pix_fmt", "yuv420p",
            "-shortest",
            output_path
        ]
        
        subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        print("✅ Video generated successfully!")
        return True

    except Exception as e:
        print(f"⚠️  Video generation failed: {e}")
        return False

if __name__ == "__main__":
    pass
