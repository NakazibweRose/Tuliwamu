import logging
import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

from .answer import answer_question


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Tuliwamu AI Legal Assistant API",
    description=(
        "A retrieval-augmented AI assistant for answering questions "
        "using Tuliwamu's legal and child-protection documents."
    ),
    version="1.0.0",
)

# Allow the frontend development servers to communicate with this API.
allowed_origins = os.getenv(
    "FRONTEND_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000,"
    "http://localhost:5173,http://127.0.0.1:5173",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin.strip()
        for origin in allowed_origins.split(",")
        if origin.strip()
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
)


class LegalQuestion(BaseModel):
    question: str = Field(
        ...,
        min_length=1,
        max_length=2000,
        description="The legal or child-protection question to answer.",
    )
    top_k: int = Field(
        default=5,
        ge=1,
        le=10,
        description="Number of relevant document passages to retrieve.",
    )

    @field_validator("question")
    @classmethod
    def question_must_not_be_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Question cannot be blank.")
        return value


@app.get("/")
def home():
    return {
        "message": "Welcome to the Tuliwamu AI Legal Assistant API.",
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Tuliwamu AI Legal Assistant",
    }


@app.post("/ask")
@app.post("/api/legal-assistant/ask")
def ask_legal_question(payload: LegalQuestion):
    try:
        result = answer_question(
            question=payload.question,
            top_k=payload.top_k,
            structured=True,
        )
        return result

    except Exception:
        logger.exception("An error occurred while answering a legal question.")
        raise HTTPException(
            status_code=500,
            detail="The legal assistant could not process your question. Please try again.",
        )

