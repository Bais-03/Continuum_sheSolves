
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from openai import OpenAI, APIError
from pydantic import BaseModel, Field

from app.config import settings
from app.models.user import User
from app.services.auth_service import get_current_user


router = APIRouter(prefix="/assistant", tags=["Assistant"])


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=1500)


class ChatResponse(BaseModel):
    answer: str


SYSTEM_PROMPT = """
You are Continuum Assistant, a helpful guide to the Continuum application.

Continuum helps users organize important life information, understand readiness,
identify missing or conflicting information, manage documents, explore a
Knowledge Graph, complete Day-Zero actions, and understand Guardian workflows.

Guidelines:
- Explain features in clear, simple language.
- Give practical, step-by-step instructions when useful.
- Explain readiness scores as indicators, not guarantees.
- Never claim to have accessed the user's records, documents, scores, or graph
  unless that information was explicitly provided in the conversation.
- Never invent application features, account information, or results.
- For questions requiring account-specific data, explain where the user can
  check it in the application.
- Do not ask users to share passwords, API keys, or other authentication secrets.
- Do not present legal, medical, or financial advice as authoritative.
- If you are unsure about a Continuum feature, say so honestly.
"""


@router.post("/chat", response_model=ChatResponse)
def chat(
    payload: ChatRequest,
    current_user: Annotated[User, Depends(get_current_user)],
) -> ChatResponse:
    # Authentication is required. The user record is not sent to OpenAI.
    _ = current_user

    if not settings.OPENAI_API_KEY.strip():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The AI assistant is not configured yet.",
        )

    try:
        client = OpenAI(api_key=settings.OPENAI_API_KEY)

        response = client.responses.create(
            model=settings.OPENAI_MODEL,
            instructions=SYSTEM_PROMPT,
            input=payload.message.strip(),
            max_output_tokens=350,
        )

        answer = response.output_text.strip()
        if not answer:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="The AI assistant returned an empty response. Please try again.",
            )

        return ChatResponse(answer=answer)

    except HTTPException:
        raise

    except APIError as exc:
        print(
            f"OpenAI API error: {type(exc).__name__}; "
            f"status={getattr(exc, 'status_code', None)}"
        )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="The AI assistant is temporarily unavailable. Please try again.",
        )

