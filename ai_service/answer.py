
import os

from dotenv import load_dotenv
from langchain_openai import ChatOpenAI

from retrieve import retrieve_documents


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"), override=True)


def get_llm():
    """Create the OpenRouter language model."""

    api_key = os.getenv("OPENROUTER_API_KEY")
    model_name = os.getenv("OPENROUTER_MODEL", "openrouter/free")

    if not api_key:
        raise RuntimeError(
            "OPENROUTER_API_KEY is missing from ai_service/.env"
        )

    return ChatOpenAI(
        model=model_name,
        api_key=api_key.strip(),
        base_url="https://openrouter.ai/api/v1",
        temperature=0,
        max_tokens=4000,
    )


def build_context(results):
    """Prepare retrieved passages and their source references."""

    context_parts = []
    sources = []

    for index, (content, metadata, distance) in enumerate(
        results, start=1
    ):
        source_id = f"S{index}"

        source = {
            "id": source_id,
            "document": metadata.get(
                "document_title", "Unknown document"
            ),
            "page": metadata.get("pdf_page", "Unknown"),
            "category": metadata.get("category", "Unknown"),
            "review_status": metadata.get(
                "review_status", "unknown"
            ),
            "similarity": (1 - float(distance)) * 100,
        }

        sources.append(source)

        context_parts.append(
            f"""
[{source_id}]
Document: {source['document']}
Category: {source['category']}
PDF page: {source['page']}
Review status: {source['review_status']}

Passage:
{content}
"""
        )

    return "\n".join(context_parts), sources


def answer_question(question, top_k=5):
    """Answer a question using retrieved legal documents."""

    question = question.strip()

    if not question:
        return "Please enter a question."

    print("\nSearching the legal document database...")

    results = retrieve_documents(question, top_k=top_k)

    if not results:
        return "I could not find relevant passages in the available documents."

    context, sources = build_context(results)

    prompt = f"""
You are Tuliwamu's AI Legal and Child Protection Assistant.

You support officers working in child protection and justice coordination
in Uganda.

Answer the user's question using ONLY the document passages supplied below.

STRICT RULES:

1. Do not invent laws, legal provisions, section numbers, deadlines,
   procedures, or institutional responsibilities.

2. Do not use outside knowledge to fill gaps in the supplied passages.

3. If the passages do not adequately answer the question, clearly say
   that the available documents do not provide sufficient evidence.

4. Cite factual and legal claims using the source identifiers provided,
   for example [S1] or [S2].

5. Never invent a source identifier or reference.

6. Distinguish legislation from guidelines, handbooks, and other
   operational documents. Do not describe guidance as a statutory
   requirement unless the passage supports that description.

7. The passages may contain OCR or text-extraction errors.
   Do not silently correct uncertain legal wording.

8. All retrieved passages currently have their review status recorded
   in the source metadata. If a source is unverified, explicitly warn
   the user that its extracted text must be checked against the
   original document before relying on it.

9. Do not claim that a document reflects the latest law or amendments
   unless the supplied evidence establishes this.

10. You are an assistant, not a replacement for professional legal
    judgment or official procedures.

Use this response structure:

ANSWER:
Give a clear, practical response.

LEGAL OR PROCEDURAL BASIS:
Explain what the retrieved documents actually support.

LIMITATIONS:
Mention missing evidence, uncertainty, or unverified text.

Cite sources throughout the answer using [S1], [S2], etc.

USER QUESTION:
{question}

RETRIEVED DOCUMENT PASSAGES:
{context}
"""

    llm = get_llm()

    print("\nGenerating an evidence-based response...")

    response = llm.invoke(prompt)
    finish_reason = response.response_metadata.get("finish_reason")
    answer = response.content
    if finish_reason == "length":
        answer = (
            str(answer)
            + "\n\nWARNING: This response may be incomplete because "
            "the model reached its output token limit."
        )

    if isinstance(answer, list):
        answer = "\n".join(
            str(item.get("text", item))
            if isinstance(item, dict)
            else str(item)
            for item in answer
        )

    output = [
        "\n" + "=" * 65,
        "TULIWAMU - AI LEGAL ASSISTANT",
        "=" * 65,
        str(answer),
        "\n" + "-" * 65,
        "RETRIEVED SOURCES",
        "-" * 65,
    ]

    for source in sources:
        output.append(
            f"[{source['id']}] {source['document']} "
            f"| PDF page: {source['page']} "
            f"| Category: {source['category']} "
            f"| Review status: {source['review_status']}"
        )

    output.extend([
        "\nIMPORTANT:",
        "Retrieved passages are currently marked UNVERIFIED.",
        "Check the original documents before relying on their legal content.",
        "=" * 65,
    ])

    return "\n".join(output)


def main():
    print("=" * 65)
    print("TULIWAMU - AI LEGAL AND CHILD PROTECTION ASSISTANT")
    print("=" * 65)

    question = input("\nEnter your question: ").strip()

    try:
        response = answer_question(question)
        print(response)

    except Exception as error:
        print("\nAn error occurred while generating the answer.")
        print(f"Error: {error}")


if __name__ == "__main__":
    main()
