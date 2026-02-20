"""
Processor Module — PDF ingestion, script/quiz/flashcard/notes/tutor generation.
Uses OpenRouter (Step 3.5 Flash) via llm_provider for all LLM calls.
"""
import os
import json
from pypdf import PdfReader
from llm_provider import invoke_llm, invoke_llm_json

# Language prompts for multi-language support
LANGUAGE_PROMPTS = {
    "en": "Generate the script in English.",
    "hi": "Generate the script in Hindi (हिंदी में).",
    "es": "Generate the script in Spanish (en español).",
    "fr": "Generate the script in French (en français).",
    "de": "Generate the script in German (auf Deutsch).",
    "zh": "Generate the script in Mandarin Chinese (用中文).",
}


def process_pdf(pdf_path: str) -> str:
    """
    Ingests a PDF, extracts text from first pages, returns combined text.
    Uses pypdf directly (no langchain dependency).
    """
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"PDF not found at {pdf_path}")
    
    reader = PdfReader(pdf_path)
    
    # Extract text from first 5 pages (enough for a good podcast)
    pages_text = []
    for i, page in enumerate(reader.pages[:5]):
        text = page.extract_text()
        if text:
            pages_text.append(text)
    
    if not pages_text:
        raise ValueError("Could not extract any text from the PDF.")
    
    # Combine and limit to ~8000 chars for context window safety
    combined_text = " ".join(pages_text)
    return combined_text[:8000]


def generate_script(text: str, language: str = "en", tts_provider: str = "azure") -> str:
    """
    Generates a dialogue script between a Teacher (Host) and a Student (Guest).
    
    Args:
        text: The source text to convert to a podcast
        language: Output language code (en, hi, es, etc.)
        tts_provider: TTS engine being used ('azure' or 'edge')
    """
    lang_instruction = LANGUAGE_PROMPTS.get(language, LANGUAGE_PROMPTS["en"])
    
    # Azure TTS HD voices auto-detect emotion from context, so we
    # instruct the script to be naturally expressive without needing tags
    if tts_provider == "azure":
        emotion_instruction = """
    7. EXPRESSIVENESS: Write with natural emotional variation - excitement for discoveries,
       warmth for explanations, curiosity for questions. Azure TTS will auto-detect and
       express these emotions from the text context. No special tags needed.
    8. PAUSES: Use '...' for thoughtful pauses and '—' for dramatic emphasis."""
    else:
        emotion_instruction = ""
    
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
    6. NO BRACKETS: Do NOT use any expressions in brackets like (laughs), (sighs), [laugh], etc.
    {emotion_instruction}
    
    Technical Text:
    {text}
    
    Podcast Script:
    """
    
    return invoke_llm(prompt, max_tokens=4096, temperature=0.8)


def generate_quiz(script: str, num_questions: int = 5) -> list:
    """
    Generates multiple choice questions from the podcast script.
    """
    prompt = f"""
    Based on the following podcast script, generate {num_questions} multiple choice questions to test understanding.
    
    Format your response as a JSON array with this structure:
    [
        {{
            "question": "The question text",
            "options": ["A) First option", "B) Second option", "C) Third option", "D) Fourth option"],
            "correct": "A",
            "explanation": "Brief explanation of why this answer is correct"
        }}
    ]
    
    Only output the JSON array, nothing else. Make sure to generate exactly {num_questions} items.
    
    Podcast Script:
    {script[:3000]}
    
    Quiz Questions (JSON):
    """
    
    response = invoke_llm_json(prompt)
    
    # Try to parse JSON, fallback to empty list
    try:
        start_idx = response.find('[')
        end_idx = response.rfind(']') + 1
        if start_idx != -1 and end_idx > start_idx:
            json_str = response[start_idx:end_idx]
            quiz = json.loads(json_str)
            return quiz
    except Exception:
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


def generate_flashcards(text: str, num_flashcards: int = 8) -> list:
    """
    Generates flashcards (Term/Definition) from the text.
    """
    prompt = f"""
    Extract {num_flashcards} key terms and their definitions from the text below for study flashcards.
    
    Format your response as a JSON array:
    [
        {{
            "term": "Term 1",
            "definition": "Clear, concise definition."
        }}
    ]
    
    Only output the JSON array. Make sure to generate exactly {num_flashcards} items.
    
    Text:
    {text[:4000]}
    
    Flashcards (JSON):
    """
    
    response = invoke_llm_json(prompt)
    
    try:
        start_idx = response.find('[')
        end_idx = response.rfind(']') + 1
        return json.loads(response[start_idx:end_idx])
    except Exception:
        return [{"term": "Error", "definition": "Could not generate flashcards."}]


def generate_notes(text: str) -> str:
    """
    Generates structured study notes from the text.
    """
    prompt = f"""
    Create structured study notes from the following text.
    Use Markdown formatting.
    Include:
    1. 🎯 **Summary**: A brief overview (2-3 sentences).
    2. 🔑 **Key Concepts**: Bullet points of main ideas.
    3. 🧠 **Deep Dive**: Detailed explanation of the most complex topic.
    4. 💡 **Takeaway**: One practical application or insight.
    
    Text:
    {text[:5000]}
    
    Study Notes:
    """
    return invoke_llm(prompt, max_tokens=2048)


def ask_tutor(context: str, question: str, history: list = []) -> str:
    """
    Real-time AI Tutor chat.
    """
    # Simple history formatting
    chat_hist = "\n".join([f"Student: {h[0]}\nTutor: {h[1]}" for h in history[-3:]])
    
    prompt = f"""
    You are an AI Tutor helping a student understand a lesson.
    
    Reference Context:
    {context[:4000]}
    
    Recent Chat:
    {chat_hist}
    
    Student Question: {question}
    
    Answer concisely and encouragingly. Use emojis occasionally. CRITICAL: DO NOT use any asterisks (*) for actions, emphasis, or markup (e.g. no *smiles* or *nods*).
    AI Tutor:
    """
    return invoke_llm(prompt, max_tokens=1024, temperature=0.6)


if __name__ == "__main__":
    pass
