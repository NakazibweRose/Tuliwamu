import hashlib
import json
import os
from pathlib import Path

import psycopg
from dotenv import load_dotenv
from fastembed import TextEmbedding
from langchain_text_splitters import RecursiveCharacterTextSplitter
from pgvector.psycopg import register_vector
from pypdf import PdfReader


BASE_DIR = Path(__file__).resolve().parent
DOCUMENTS_DIR = BASE_DIR / "legal_documents"

load_dotenv(BASE_DIR / ".env")

EMBEDDING_MODEL = os.getenv(
    "EMBEDDING_MODEL",
    "BAAI/bge-small-en-v1.5",
)

CHUNK_SIZE = 1000
CHUNK_OVERLAP = 150
BATCH_SIZE = 32
VECTOR_DIMENSION = 384


def get_database_connection():
    required = [
        "POSTGRES_HOST",
        "POSTGRES_PORT",
        "POSTGRES_DB",
        "POSTGRES_USER",
        "POSTGRES_PASSWORD",
    ]

    missing = [key for key in required if not os.getenv(key)]
    if missing:
        raise RuntimeError(
            "Missing database settings in ai_service/.env: "
            + ", ".join(missing)
        )

    return psycopg.connect(
        host=os.getenv("POSTGRES_HOST"),
        port=int(os.getenv("POSTGRES_PORT")),
        dbname=os.getenv("POSTGRES_DB"),
        user=os.getenv("POSTGRES_USER"),
        password=os.getenv("POSTGRES_PASSWORD"),
    )


def create_table(connection):
    with connection.cursor() as cursor:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS legal_document_chunks (
                id BIGSERIAL PRIMARY KEY,
                chunk_id TEXT UNIQUE NOT NULL,
                content TEXT NOT NULL,
                embedding VECTOR(384) NOT NULL,
                metadata JSONB NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        """)
    connection.commit()


def extract_chunks():
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        add_start_index=True,
    )

    all_chunks = []
    skipped_pages = []

    pdf_files = sorted(DOCUMENTS_DIR.rglob("*.pdf"))

    if not pdf_files:
        raise RuntimeError(
            f"No PDF documents found in {DOCUMENTS_DIR}"
        )

    for pdf_path in pdf_files:
        print(f"\nReading: {pdf_path.name}")

        reader = PdfReader(str(pdf_path))
        document_title = pdf_path.stem.replace("-", " ").replace("_", " ")

        for page_number, page in enumerate(reader.pages, start=1):
            page_text = page.extract_text() or ""
            page_text = page_text.strip()

            if len(page_text) < 50:
                skipped_pages.append(
                    f"{pdf_path.name} — page {page_number}"
                )
                continue

            page_chunks = splitter.create_documents([page_text])

            for chunk_index, chunk in enumerate(page_chunks):
                content = chunk.page_content.strip()

                if not content:
                    continue

                start_index = chunk.metadata.get("start_index")

                unique_source = (
                    f"{pdf_path.relative_to(BASE_DIR)}|"
                    f"{page_number}|{chunk_index}|{content}"
                )

                chunk_id = hashlib.sha256(
                    unique_source.encode("utf-8")
                ).hexdigest()

                metadata = {
                    "document_title": document_title,
                    "source_file": str(pdf_path.relative_to(BASE_DIR)),
                    "category": pdf_path.parent.name,
                    "pdf_page": page_number,
                    "chunk_index": chunk_index,
                    "start_char": start_index,
                    "extraction_method": "pypdf",
                    "review_status": "unverified",
                }

                all_chunks.append({
                    "chunk_id": chunk_id,
                    "content": content,
                    "metadata": metadata,
                })

        print(f"Pages read: {len(reader.pages)}")

    print(f"\nTotal chunks prepared: {len(all_chunks)}")

    if skipped_pages:
        print("\nPages skipped because too little text was extracted:")
        for page in skipped_pages:
            print(f"  - {page}")

    return all_chunks


def store_chunks(connection, chunks):
    print(f"\nLoading embedding model: {EMBEDDING_MODEL}")
    embedding_model = TextEmbedding(model_name=EMBEDDING_MODEL)

    register_vector(connection)

    stored_count = 0

    for batch_start in range(0, len(chunks), BATCH_SIZE):
        batch = chunks[batch_start:batch_start + BATCH_SIZE]

        texts = [item["content"] for item in batch]
        embeddings = list(embedding_model.embed(texts))

        with connection.cursor() as cursor:
            for item, embedding in zip(batch, embeddings):
                if len(embedding) != VECTOR_DIMENSION:
                    raise ValueError(
                        f"Expected {VECTOR_DIMENSION} embedding values, "
                        f"received {len(embedding)}"
                    )

                cursor.execute(
                    """
                    INSERT INTO legal_document_chunks
                        (chunk_id, content, embedding, metadata)
                    VALUES (%s, %s, %s, %s)
                    ON CONFLICT (chunk_id)
                    DO UPDATE SET
                        content = EXCLUDED.content,
                        embedding = EXCLUDED.embedding,
                        metadata = EXCLUDED.metadata || jsonb_build_object(
                            'review_status',
                            COALESCE(
                                legal_document_chunks.metadata->>'review_status',
                                'unverified'
                            )
                        );
                    """,
                    (
                        item["chunk_id"],
                        item["content"],
                        embedding,
                        json.dumps(item["metadata"]),
                    ),
                )

        connection.commit()
        stored_count += len(batch)

        print(
            f"Processed {stored_count}/{len(chunks)} chunks"
        )

    return stored_count


def main():
    chunks = extract_chunks()

    if not chunks:
        print("No usable text chunks were found.")
        return

    print("\nConnecting to PostgreSQL...")

    with get_database_connection() as connection:
        create_table(connection)

        stored_count = store_chunks(connection, chunks)

        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT COUNT(*) FROM legal_document_chunks;"
            )
            total_in_database = cursor.fetchone()[0]

    print("\nIngestion completed.")
    print(f"Chunks processed this run: {stored_count}")
    print(f"Total chunks in database: {total_in_database}")


if __name__ == "__main__":
    main()
