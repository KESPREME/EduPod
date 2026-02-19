from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_ollama import OllamaLLM
import os
import json

# Language prompts for multi-language support
LANGUAGE_PROMPTS = {
    "en": "Generate the script in English.",
    "hi": "Generate the script in Hindi (हिंदी में).",
    "es": "Generate the script in Spanish (en español).",
    "fr": "Generate the script in French (en français).",
    "de": "Generate the script in German (auf Deutsch).",
    "zh": "Generate the script in Mandarin Chinese (用中文).",
}

# ============ MEMORY OPTIMIZATION ============
# Cache LLM instances to avoid repeated model loading
# keep_alive="5m" auto-unloads model from GPU after 5 min idle
_llm_cache = {}

def get_llm(model_name: str, num_ctx: int = 4096):
    """
    Get or create a cached LLM instance with memory-optimized settings.
    - Caches instances to prevent repeated model loading
    - Uses keep_alive to auto-unload from GPU after idle
    - Limits context window to reduce VRAM usage
    """
    if model_name not in _llm_cache:
        _llm_cache[model_name] = OllamaLLM(
            model=model_name,
            num_ctx=num_ctx,
            keep_alive="5m"  # Unload after 5 minutes of inactivity
        )
        print(f"🔧 Loaded LLM: {model_name} (keep_alive=5m)")
    return _llm_cache[model_name]

def process_pdf(pdf_path: str):
    """
    Ingests a PDF, splits it into chunks, and returns the first 3 chunks combined.
    """
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"PDF not found at {pdf_path}")
        
    loader = PyPDFLoader(pdf_path)
    docs = loader.load()
    
    # Split text to fit LLM context window efficiently
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=3000, chunk_overlap=200)
    splits = text_splitter.split_documents(docs)
    
    # Process just the first 3 chunks to keep generation time reasonable and context safe
    combined_text = " ".join([doc.page_content for doc in splits[:3]])
    return combined_text

def generate_script(text: str, language: str = "en", tts_provider: str = "edge"):
    """
    Generates a dialogue script between a Teacher (Host) and a Student (Guest).
    
    Args:
        text: The source text to convert to a podcast
        language: Output language code (en, hi, es, etc.)
        tts_provider: TTS engine being used ('chatterbox', 'melo', 'edge')
                      If 'chatterbox', adds emotional paralinguistic tags.
    """
    llm = get_llm("gemma3:4b", num_ctx=4096)
    
    lang_instruction = LANGUAGE_PROMPTS.get(language, LANGUAGE_PROMPTS["en"])
    
    # Chatterbox Turbo supports emotional tags in square brackets
    if tts_provider == "chatterbox":
        emotion_instruction = """
    7. EMOTIONS & EXPRESSIONS: Add natural emotional expressions using these EXACT tags in square brackets:
       - [laugh] - for genuine laughter
       - [chuckle] - for light amusement
       - [sigh] - for relief, frustration, or thoughtfulness
       - [gasp] - for surprise or excitement
       - [cough] - for clearing throat or emphasis
       - [yawn] - sparingly, for tiredness
       Place these naturally within dialogue, e.g.: "Well [chuckle], that's actually a great question!"
       Use 2-4 emotional tags per speaker per conversation naturally."""
        bracket_instruction = ""
    else:
        emotion_instruction = ""
        bracket_instruction = "6. NO BRACKETS: Do NOT use any expressions in brackets like (laughs), (sighs), [laugh], etc."
    
    prompt = f"""
    You are a professional podcast writer for a high-end educational series.
    Convert the technical text below into a detailed, human-sounding podcast script.
    
    {lang_instruction}
    
    Cast:
    - host_1 (The Professor): Warm, uses analogies, avoids being too formal.
    - host_2 (The Student): Relatable, curious, asks clarifying questions.
    
    Script Requirements:
    1. CONVERSATIONAL FILLERS: Include "Well...", "Hmm,", "Actually,", "Right,".
    2. VERBAL NODS: "Exactly,", "Mhm,", "I see."
    3. DEPTH & LENGTH: At least 15-20 turns of dialogue.
    4. FLOW: Organic discussion, not Q&A. Use '...' for pauses.
    5. FORMAT: Each line MUST start with 'host_1:' or 'host_2:'.
    {bracket_instruction}
    {emotion_instruction}
    
    Technical Text:
    {text}
    
    Podcast Script:
    """
    
    response = llm.invoke(prompt)
    return response

def generate_quiz(script: str):
    """
    Generates multiple choice questions from the podcast script.
    """
    llm = get_llm("gemma3:4b", num_ctx=2048)  # Smaller context for quizzes
    
    prompt = f"""
    Based on the following podcast script, generate 5 multiple choice questions to test understanding.
    
    Format your response as a JSON array with this structure:
    [
        {{
            "question": "The question text",
            "options": ["A) First option", "B) Second option", "C) Third option", "D) Fourth option"],
            "correct": "A",
            "explanation": "Brief explanation of why this answer is correct"
        }}
    ]
    
    Only output the JSON array, nothing else.
    
    Podcast Script:
    {script[:2000]}
    
    Quiz Questions (JSON):
    """
    
    response = llm.invoke(prompt)
    
    # Try to parse JSON, fallback to empty list
    try:
        # Find JSON array in response
        start_idx = response.find('[')
        end_idx = response.rfind(']') + 1
        if start_idx != -1 and end_idx > start_idx:
            json_str = response[start_idx:end_idx]
            quiz = json.loads(json_str)
            return quiz
    except:
        pass
    
    # Fallback quiz if parsing fails
    return [
        {
            "question": "What was the main topic discussed in this podcast?",
            "options": ["A) The content of the PDF", "B) Cooking recipes", "C) Sports news", "D) Weather forecast"],
            "correct": "A",
            "explanation": "The podcast was generated from the uploaded PDF content."
        }
    ]

def generate_flashcards(text: str):
    """
    Generates flashcards (Term/Definition) from the text.
    """
    llm = get_llm("gemma3:4b", num_ctx=2048)
    
    prompt = f"""
    Extract 8 key terms and their definitions from the text below for study flashcards.
    
    Format your response as a JSON array:
    [
        {{
            "term": "Term 1",
            "definition": "Clear, concise definition."
        }}
    ]
    
    Only output the JSON array.
    
    Text:
    {text[:3000]}
    
    Flashcards (JSON):
    """
    
    response = llm.invoke(prompt)
    
    try:
        start_idx = response.find('[')
        end_idx = response.rfind(']') + 1
        return json.loads(response[start_idx:end_idx])
    except:
        return [{"term": "Error", "definition": "Could not generate flashcards."}]

def generate_notes(text: str):
    """
    Generates structured study notes from the text.
    """
    llm = get_llm("gemma3:4b", num_ctx=4096)
    
    prompt = f"""
    Create structured study notes from the following text.
    Use Markdown formatting.
    Include:
    1. 🎯 **Summary**: A brief overview (2-3 sentences).
    2. 🔑 **Key Concepts**: Bullet points of main ideas.
    3. 🧠 **Deep Dive**: Detailed explanation of the most complex topic.
    4. 💡 **Takeaway**: One practical application or insight.
    
    Text:
    {text[:4000]}
    
    Study Notes:
    """
    return llm.invoke(prompt)

def ask_tutor(context: str, question: str, history: list = []):
    """
    Real-time AI Tutor chat.
    """
    llm = get_llm("gemma3:4b", num_ctx=4096)
    
    # Simple history formatting
    chat_hist = "\\n".join([f"Student: {h[0]}\\nTutor: {h[1]}" for h in history[-3:]])
    
    prompt = f"""
    You are an AI Tutor helping a student understand a lesson.
    
    Reference Context:
    {context[:3000]}
    
    Recent Chat:
    {chat_hist}
    
    Student Question: {question}
    
    Answer concisely and encouragingly. Use emojis occasionally.
    AI Tutor:
    """
    return llm.invoke(prompt)

if __name__ == "__main__":
    pass
