import os

import psycopg
from dotenv import load_dotenv
from fastembed import TextEmbedding
from pgvector.psycopg import register_vector


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))

EMBEDDING_MODEL = os.getenv(
    "EMBEDDING_MODEL",
    "BAAI/bge-small-en-v1.5",
)


def get_connection():
    return psycopg.connect(
        host=os.getenv("POSTGRES_HOST"),
        port=int(os.getenv("POSTGRES_PORT")),
        dbname=os.getenv("POSTGRES_DB"),
        user=os.getenv("POSTGRES_USER"),
        password=os.getenv("POSTGRES_PASSWORD"),
    )


def retrieve_documents(question, top_k=5):
    print("\nLoading embedding model...")
    model = TextEmbedding(model_name=EMBEDDING_MODEL)

    # Convert the user's question into an embedding.
    query_embedding = list(model.embed([question]))[0]

    with get_connection() as connection:
        register_vector(connection)
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT
                    content,
                    metadata,
                    embedding <=> %s AS distance
                FROM legal_document_chunks
                ORDER BY embedding <=> %s
                LIMIT %s;
                """,
                (query_embedding, query_embedding, top_k),
            )

            results = cursor.fetchall()

    return results


def main():
    print("=" * 60)
    print("TULIWAMU - AI LEGAL DOCUMENT SEARCH")
    print("=" * 60)

    question = input("\nEnter your legal or child-protection question: ").strip()

    if not question:
        print("Please enter a question.")
        return

    results = retrieve_documents(question)

    if not results:
        print("\nNo matching document passages were found.")
        return

    print(f"\nTop {len(results)} matching passages")
    print("=" * 60)

    for index, (content, metadata, distance) in enumerate(results, start=1):
        similarity = (1 - float(distance)) * 100

        print(f"\nRESULT {index}")
        print("-" * 60)
        print(f"Document: {metadata.get('document_title')}")
        print(f"Category: {metadata.get('category')}")
        print(f"PDF page: {metadata.get('pdf_page')}")
        print(f"Similarity: {similarity:.2f}%")
        print(f"Review status: {metadata.get('review_status')}")
        print("\nPassage:")
        print(content)

    print("\n" + "=" * 60)
    print("IMPORTANT: Retrieved passages are currently UNVERIFIED.")
    print("Verify the original document before relying on legal content.")
    print("=" * 60)


if __name__ == "__main__":
    main()
