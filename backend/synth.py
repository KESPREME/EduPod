"""
Audio Synthesis Module — Azure Neural TTS (primary) + Edge TTS (fallback).
Converts podcast scripts into MP3 audio with emotional, expressive voices.
"""
import asyncio
import edge_tts
from pydub import AudioSegment
import os
import tempfile
import re
import subprocess

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

# Azure Neural TTS Voices — HD voices with emotional auto-detection
AZURE_VOICES = {
    "en": {
        "host_1": {"name": "en-US-AndrewMultilingualNeural", "style": "friendly"},
        "host_2": {"name": "en-US-AvaMultilingualNeural", "style": "cheerful"},
    },
    "hi": {
        "host_1": {"name": "hi-IN-MadhurNeural", "style": "friendly"},
        "host_2": {"name": "hi-IN-SwaraNeural", "style": "cheerful"},
    },
    "es": {
        "host_1": {"name": "es-ES-AlvaroNeural", "style": "friendly"},
        "host_2": {"name": "es-ES-ElviraNeural", "style": "cheerful"},
    },
    "fr": {
        "host_1": {"name": "fr-FR-HenriNeural", "style": "friendly"},
        "host_2": {"name": "fr-FR-DeniseNeural", "style": "cheerful"},
    },
    "de": {
        "host_1": {"name": "de-DE-ConradNeural", "style": "friendly"},
        "host_2": {"name": "de-DE-KatjaNeural", "style": "cheerful"},
    },
    "zh": {
        "host_1": {"name": "zh-CN-YunxiNeural", "style": "friendly"},
        "host_2": {"name": "zh-CN-XiaoxiaoNeural", "style": "cheerful"},
    },
}


def clean_text_for_tts(text: str) -> str:
    """Remove any bracket expressions like (laughs), [sighs] from text and clean up."""
    text = re.sub(r'\([^)]*\)', '', text)  # Remove (...)
    text = re.sub(r'\[[^\]]*\]', '', text)  # Remove [...]
    text = re.sub(r'\*[^*]*\*', '', text)   # Remove *...*
    text = text.replace('&', 'and')          # XML-safe for SSML
    text = text.replace('<', '').replace('>', '')  # Strip stray XML
    return text.strip()


def _escape_ssml(text: str) -> str:
    """Escape text for safe SSML embedding."""
    text = text.replace('&', '&amp;')
    text = text.replace('<', '&lt;')
    text = text.replace('>', '&gt;')
    text = text.replace('"', '&quot;')
    text = text.replace("'", '&apos;')
    return text


# ============== AZURE TTS ==============
_azure_available = None


def check_azure_available() -> bool:
    """Check if Azure Speech SDK and credentials are available."""
    global _azure_available
    if _azure_available is not None:
        return _azure_available
    
    try:
        import azure.cognitiveservices.speech as speechsdk
        key = os.environ.get("AZURE_SPEECH_KEY", "")
        region = os.environ.get("AZURE_SPEECH_REGION", "")
        if key and region:
            _azure_available = True
            print(f"✅ Azure Speech SDK available (region: {region})")
        else:
            _azure_available = False
            print("⚠️  Azure Speech credentials not set (AZURE_SPEECH_KEY, AZURE_SPEECH_REGION)")
    except ImportError:
        _azure_available = False
        print("⚠️  Azure Speech SDK not installed (pip install azure-cognitiveservices-speech)")
    
    return _azure_available


def synthesize_line_azure(text: str, voice_name: str, style: str, output_path: str) -> bool:
    """
    Synthesize a single line using Azure Neural TTS with SSML emotional expression.
    
    Args:
        text: The text to synthesize
        voice_name: Azure voice name (e.g., 'en-US-AndrewMultilingualNeural')
        style: Emotional style (e.g., 'friendly', 'cheerful')
        output_path: Path to save the WAV output
    """
    if not check_azure_available():
        return False
    
    try:
        import azure.cognitiveservices.speech as speechsdk
        
        speech_config = speechsdk.SpeechConfig(
            subscription=os.environ["AZURE_SPEECH_KEY"],
            region=os.environ["AZURE_SPEECH_REGION"]
        )
        # Output as WAV (we'll convert to MP3 later when merging)
        audio_config = speechsdk.audio.AudioOutputConfig(filename=output_path)
        synthesizer = speechsdk.SpeechSynthesizer(
            speech_config=speech_config,
            audio_config=audio_config
        )
        
        # Clean and escape text for SSML
        clean_text = clean_text_for_tts(text)
        ssml_text = _escape_ssml(clean_text)
        
        # Build SSML with emotional expression
        # Note: Not all voices support all styles — if style fails, it gracefully degrades
        ssml = f'''<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis"
       xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="en-US">
    <voice name="{voice_name}">
        <mstts:express-as style="{style}" styledegree="1.2">
            <prosody rate="-5%">
                {ssml_text}
            </prosody>
        </mstts:express-as>
    </voice>
</speak>'''
        
        result = synthesizer.speak_ssml_async(ssml).get()
        
        if result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
            return True
        elif result.reason == speechsdk.ResultReason.Canceled:
            cancellation = result.cancellation_details
            print(f"  ⚠️  Azure TTS canceled: {cancellation.reason}")
            if cancellation.error_details:
                print(f"      Error: {cancellation.error_details}")
            return False
        
        return False
        
    except Exception as e:
        print(f"  ⚠️  Azure TTS error: {e}")
        return False


# ============== EDGE TTS (Fallback) ==============
async def synthesize_line_edge(text: str, voice: str, output_path: str):
    """Synthesize a line using Edge TTS (Microsoft's free cloud TTS)."""
    clean_text = clean_text_for_tts(text)
    communicate = edge_tts.Communicate(clean_text, voice, rate="-5%")
    await communicate.save(output_path)


# ============== MAIN SYNTHESIS ==============
async def synthesize_podcast(
    script_text: str,
    output_file: str,
    voices: dict = None,
    provider: str = "azure",
    language: str = "en"
):
    """
    Parses the script, synthesizes each line, and merges them into a single MP3.
    
    Fallback chain: azure (SSML emotional) -> edge (cloud free)
    
    Args:
        provider: 'azure' (default, emotional HD) or 'edge' (free cloud)
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
            
            if not content:
                continue
            
            if "host_1" in host or "teacher" in host or "professor" in host:
                processed_lines.append(("host_1", content))
            elif "host_2" in host or "student" in host or "guest" in host:
                processed_lines.append(("host_2", content))

    if not processed_lines:
        raise ValueError("Could not parse any valid lines from the script.")

    metadata = [{"host": h, "content": c} for h, c in processed_lines]
    
    # Get Azure voice config for the language
    azure_voice_config = AZURE_VOICES.get(language, AZURE_VOICES.get("en", {}))
    
    # Try Azure TTS first
    use_azure = (provider == "azure") and check_azure_available()
    
    if use_azure:
        print(f"🎙️ Synthesizing {len(processed_lines)} lines with Azure Neural TTS...")
    else:
        if provider == "azure":
            print("ℹ️  Azure TTS unavailable, falling back to Edge TTS...")
        print(f"🎙️ Synthesizing {len(processed_lines)} lines with Edge TTS...")
    
    # Line-by-line synthesis
    combined_audio = AudioSegment.empty()
    
    with tempfile.TemporaryDirectory() as tmp_dir:
        for i, (host, content) in enumerate(processed_lines):
            # Output format depends on provider
            if use_azure:
                snippet_path = os.path.join(tmp_dir, f"line_{i}.wav")
            else:
                snippet_path = os.path.join(tmp_dir, f"line_{i}.mp3")
            
            synthesized = False
            
            # Try Azure TTS
            if use_azure:
                voice_config = azure_voice_config.get(host, azure_voice_config.get("host_1", {}))
                voice_name = voice_config.get("name", "en-US-AndrewMultilingualNeural")
                style = voice_config.get("style", "friendly")
                
                # Run Azure TTS in executor (it's synchronous)
                loop = asyncio.get_event_loop()
                synthesized = await loop.run_in_executor(
                    None,
                    synthesize_line_azure,
                    content,
                    voice_name,
                    style,
                    snippet_path
                )
                
                if synthesized:
                    if (i + 1) % 5 == 0 or i == len(processed_lines) - 1:
                        print(f"  ✅ Azure TTS: {i + 1}/{len(processed_lines)} lines")
            
            # Fallback to Edge TTS
            if not synthesized:
                snippet_path = os.path.join(tmp_dir, f"line_{i}.mp3")
                voice = voices.get(host, voices.get("host_1", VOICES["host_1"]))
                await synthesize_line_edge(content, voice, snippet_path)
                synthesized = True
            
            # Load and append audio segment
            if os.path.exists(snippet_path):
                try:
                    if snippet_path.endswith('.wav'):
                        segment = AudioSegment.from_wav(snippet_path)
                    else:
                        segment = AudioSegment.from_mp3(snippet_path)
                except Exception:
                    try:
                        segment = AudioSegment.from_file(snippet_path)
                    except Exception as e:
                        print(f"  ⚠️  Could not load audio file {snippet_path}: {e}")
                        continue
                
                duration = segment.duration_seconds
                metadata[i]["duration"] = duration
                combined_audio += segment + AudioSegment.silent(duration=700)
        
        combined_audio.export(output_file, format="mp3")
        print(f"✅ Audio synthesis complete! ({len(processed_lines)} segments)")
        return metadata


# ============== VIDEO GENERATION ==============
def generate_video_from_audio(audio_path: str, image_path: str, output_path: str) -> bool:
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

        # Default background image (Classroom)
        default_bg = os.path.join(os.path.dirname(__file__), "assets", "classroom_background.png")
        
        # Determine which image source to use
        final_image_path = None
        if image_path and os.path.exists(image_path):
            final_image_path = image_path
        elif os.path.exists(default_bg):
            final_image_path = default_bg
            print(f"ℹ️  Using default background: {default_bg}")
        
        input_args = []
        if final_image_path:
            input_args = ["-loop", "1", "-i", final_image_path]
        else:
            print("⚠️  No background image found. Using solid color.")
            input_args = ["-f", "lavfi", "-i", "color=c=#1a1a1a:s=1920x1080:r=1"]

        cmd = [
            "ffmpeg", "-y",
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
