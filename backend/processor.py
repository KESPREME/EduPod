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


def generate_quiz(text: str, num_questions: int = 5) -> list:
    """
    Generates multiple choice questions from the source text.
    """
    prompt = f"""
    You are an expert educator creating a quiz to test a student's understanding of the material below.
    Generate exactly {num_questions} multiple choice questions.

    CRITICAL RULES:
    - Questions MUST be about the specific concepts, facts, and ideas in the text below.
    - Do NOT ask generic or meta questions like "What was the main topic?" or "What did the text discuss?"
    - Each question should test comprehension of a SPECIFIC concept from the text.
    - Do NOT use asterisks (*), markdown formatting, or emoji in any field.
    - Write all text in plain language.
    - Each option must be clearly distinct. The correct answer must be unambiguously correct.
    - Distractors (wrong answers) should be plausible but clearly incorrect to someone who read the material.

    Format your response as a JSON array with this exact structure:
    [
        {{
            "question": "Clear, specific question about a concept from the text",
            "options": ["A) First option", "B) Second option", "C) Third option", "D) Fourth option"],
            "correct": "A",
            "explanation": "Brief explanation of why this is correct, referencing the source material"
        }}
    ]

    Only output the JSON array, nothing else. Generate exactly {num_questions} items.

    Source Material:
    {text[:5000]}

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

    return []


def generate_flashcards(text: str, num_flashcards: int = 8) -> list:
    """
    Generates flashcards (Term/Definition) from the text.
    """
    prompt = f"""
    You are an expert educator creating study flashcards from the material below.
    Extract exactly {num_flashcards} important terms, concepts, or key ideas and provide clear definitions.

    CRITICAL RULES:
    - Each "term" should be a specific concept, keyword, or phrase directly from the text (2-5 words max).
    - Each "definition" should be a complete, self-contained sentence that explains the term.
    - Do NOT use asterisks (*), markdown formatting, or emoji anywhere.
    - Do NOT include generic terms like "Introduction" or "Conclusion".
    - Focus on the most important and specific ideas in the material.
    - Write in plain language without any special characters.

    Format your response as a JSON array:
    [
        {{
            "term": "Specific Term",
            "definition": "A clear, complete sentence defining or explaining this term."
        }}
    ]

    Only output the JSON array. Generate exactly {num_flashcards} items.

    Source Material:
    {text[:5000]}

    Flashcards (JSON):
    """

    response = invoke_llm_json(prompt)

    try:
        start_idx = response.find('[')
        end_idx = response.rfind(']') + 1
        return json.loads(response[start_idx:end_idx])
    except Exception:
        return []


def generate_notes(text: str) -> str:
    """
    Generates structured study notes from the text.
    """
    prompt = f"""
    Create structured study notes from the following text.
    Use simple Markdown formatting (## for headers, - for bullet points).

    CRITICAL RULES:
    - Do NOT use emoji or special Unicode characters anywhere.
    - Do NOT use asterisks (*) for emphasis or bold. Use plain text only.
    - Do NOT use decorative symbols or special characters.
    - Keep all text in plain, readable English.
    - Section headers should be plain text with ## prefix.

    Structure the notes as follows:
    ## Summary
    A brief overview of the material in 2-3 sentences.

    ## Key Concepts
    - Bullet points covering the main ideas and important facts.
    - Each bullet should be a complete, clear statement.

    ## Deep Dive
    A detailed explanation of the most complex or important topic from the material.
    Use multiple paragraphs if needed.

    ## Key Takeaway
    One practical application, insight, or important conclusion from the material.

    Source Material:
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
