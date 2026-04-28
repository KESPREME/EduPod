"""
LLM Provider Module - OpenRouter Integration
Uses the OpenAI-compatible API via OpenRouter to access Step 3.5 Flash (free tier).
"""

import os

from openai import OpenAI

# Lazy-initialized client
_client = None


def _get_client() -> OpenAI:
    """Get or create the OpenRouter client (lazy initialization)."""
    global _client
    if _client is None:
        api_key = os.environ.get("OPENROUTER_API_KEY", "")
        if not api_key:
            raise ValueError(
                "OPENROUTER_API_KEY environment variable is required. "
                "Get one at https://openrouter.ai/keys"
            )
        _client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=api_key,
        )
        print("🔧 OpenRouter client initialized (Step 3.5 Flash)")
    return _client


# Model to use — stepfun/step-3.5-flash:free on OpenRouter
MODEL_ID = "tencent/hy3-preview:free"


def invoke_llm(prompt: str, max_tokens: int = 4096, temperature: float = 0.7) -> str:
    """
    Send a prompt to the LLM via OpenRouter and return the response text.

    Args:
        prompt: The full prompt text
        max_tokens: Maximum response length
        temperature: Creativity level (0.0 = deterministic, 1.0 = creative)

    Returns:
        The model's response text
    """
    client = _get_client()

    try:
        response = client.chat.completions.create(
            model=MODEL_ID,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=max_tokens,
            temperature=temperature,
        )
        content = response.choices[0].message.content
        if content is None:
            return ""
        return content.strip()
    except Exception as e:
        print(f"⚠️  OpenRouter API error: {e}")
        raise


def invoke_llm_json(prompt: str, max_tokens: int = 2048) -> str:
    """
    Send a prompt expecting JSON output. Uses lower temperature for structured output.

    Args:
        prompt: The full prompt text (should instruct model to output JSON)
        max_tokens: Maximum response length

    Returns:
        The model's response text (should be JSON parseable)
    """
    return invoke_llm(prompt, max_tokens=max_tokens, temperature=0.3)
