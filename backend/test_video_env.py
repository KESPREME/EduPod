
import subprocess
import asyncio
import sys
import os
sys.path.append(os.getcwd())
from backend.synth import generate_video_from_audio, get_chatterbox_url

def test_ffmpeg():
    try:
        subprocess.run(["ffmpeg", "-version"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
        print("✅ FFmpeg is installed and accessible.")
    except Exception as e:
        print(f"❌ FFmpeg check failed: {e}")
        sys.exit(1)

def test_imports():
    print(f"✅ Chatterbox URL function loaded: {get_chatterbox_url}")
    print(f"✅ Video Gen function loaded: {generate_video_from_audio}")

if __name__ == "__main__":
    test_ffmpeg()
    test_imports()
    print("Backend verification passed!")
