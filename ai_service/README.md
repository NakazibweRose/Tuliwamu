# Tuliwamu AI Legal Assistant

## 1. Overview

The Tuliwamu AI Legal Assistant is a Retrieval-Augmented Generation (RAG) service that helps users find information from a collection of Ugandan child protection and justice-related legal documents.

It retrieves relevant passages from the document database and uses an AI model to generate answers grounded in those passages.

The assistant provides:
- Answers based on retrieved document passages.
- Source references, including document names and page numbers where available.
- Warnings when retrieved passages have not been reviewed.

**Important:** The assistant supports access to legal information. It does not replace advice from a qualified legal professional.

## 2. Prerequisites

Before setting up the service, ensure you have:

- Python 3 installed.
- PostgreSQL installed and running.
- The pgvector extension installed for PostgreSQL.
- An OpenRouter API key.
- Access to the legal PDF documents used by the project.

## 3. Set up the Python environment

From the root directory of the Tuliwamu project, create a virtual environment:

```bash
python3 -m venv .venv
```

Activate it:

```bash
source .venv/bin/activate
```

Install the dependencies:

```bash
pip install -r ai_service/requirements.txt
```

## 4. Configure environment variables

Create your local environment file by copying the example:

```bash
cp ai_service/.env.example ai_service/.env
```

Open `ai_service/.env` in VS Code and provide your actual configuration:

```env
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=openrouter/free

POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=tuliwamu
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_database_password

EMBEDDING_MODEL=BAAI/bge-small-en-v1.5
```

Replace the example credentials with the values for your own environment.

Never commit the actual `.env` file or share your API key and database password.

## 5. Set up the PostgreSQL database

Create the database if it does not already exist. For example:

```bash
createdb -U postgres tuliwamu
```

Ensure pgvector is installed on the PostgreSQL server, then enable the extension in the project database:

```bash
psql -U postgres -d tuliwamu -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

Use the appropriate PostgreSQL username if yours is different.

## 6. Ingest the legal documents

Place the project's legal PDF documents in:

```text
ai_service/legal_documents/
```

From the root project directory, run:

```bash
python -m ai_service.ingest_documents
```

The ingestion process extracts text from the PDFs, divides it into smaller chunks, generates embeddings, and stores the chunks in PostgreSQL using pgvector.

Run ingestion again when you need to add or update documents.

## 7. Start the FastAPI service

From the root project directory, run:

```bash
uvicorn ai_service.main:app --reload --host 127.0.0.1 --port 8000
```

The API will be available at:

- Base URL: `http://127.0.0.1:8000`
- Interactive API documentation: `http://127.0.0.1:8000/docs`
- Health check: `http://127.0.0.1:8000/health`

Keep the terminal running while using the service.

## 8. API endpoints

### Health check

**Method:** GET

**Endpoint:**

```text
/health
```

Example response:

```json
{
  "status": "healthy",
  "service": "Tuliwamu AI Legal Assistant"
}
```

### Ask a legal question

**Method:** POST

**Endpoint:**

```text
/ask
```

The full endpoint is:

```text
http://127.0.0.1:8000/ask
```

The service also supports:

```text
POST /api/legal-assistant/ask
```

### Request body

Send a JSON request containing the question and the number of passages to retrieve:

```json
{
  "question": "What are the responsibilities of a Probation and Social Welfare Officer?",
  "top_k": 5
}
```

The `question` field is required and must contain between 1 and 2000 characters. The `top_k` field is optional and accepts values from 1 to 10. Its default value is 5.

### Example response

```json
{
  "question": "What are the responsibilities of a Probation and Social Welfare Officer?",
  "answer": "The answer generated from the retrieved legal document passages.",
  "sources": [
    {
      "id": "S1",
      "document": "Example legal document.pdf",
      "page": 34,
      "category": "child_protection",
      "review_status": "unverified",
      "similarity": 89.63
    }
  ],
  "warnings": [
    "Some retrieved passages have not been reviewed."
  ],
  "status": "success"
}
```

This is an illustrative response structure. Actual answers, source details, and warnings depend on the question and retrieved documents.

### Response fields

- `question`: The submitted question.
- `answer`: The AI-generated response grounded in retrieved passages.
- `sources`: The documents and passages used to generate the response.
- `warnings`: Important limitations or review warnings.
- `status`: Indicates the result of the request, such as `success` or `no_evidence`.

## 9. React frontend integration

The React frontend can communicate with the FastAPI service using the `/ask` endpoint.

Example JavaScript request:

```javascript
const response = await fetch(`${API_BASE_URL}/ask`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    question: userQuestion,
    top_k: 5
  })
});

const data = await response.json();

if (!response.ok) {
  throw new Error(data.detail || "Unable to process your question.");
}

console.log(data.answer);
console.log(data.sources);
console.log(data.warnings);
```

Replace `API_BASE_URL` with the backend address configured for your React project.

The frontend should display:
- The answer returned by the API.
- The source documents and page references.
- Any warnings returned by the API.

Warnings should remain visible so users can understand when retrieved legal passages have not been reviewed.

## 10. CORS configuration

The API allows these frontend origins by default:

```text
http://localhost:3000
http://127.0.0.1:3000
http://localhost:5173
http://127.0.0.1:5173
```

If the React frontend runs on a different origin, configure `FRONTEND_ORIGINS` in the backend environment file with the required comma-separated origins.

Restart the backend after changing the configuration.

## 11. Connecting from another computer

When the frontend runs on a different computer on the same trusted local network, the backend may need to listen on all network interfaces:

```bash
uvicorn ai_service.main:app --reload --host 0.0.0.0 --port 8000
```

Use the backend computer's local network IP address in the frontend configuration instead of `127.0.0.1`.

Ensure the frontend origin is allowed by CORS.

Do not expose the development server or database directly to the public internet.

## 12. Legal information and limitations

The assistant retrieves information from the legal documents available in its document database. Its responses depend on the quality and completeness of those documents and the relevance of retrieved passages.

Please observe the following:

- Check the source documents when relying on an answer.
- Pay attention to the review status of retrieved passages.
- Treat unreviewed or OCR-extracted passages with caution.
- Do not assume that retrieved documents reflect the latest amendments or current legal position.
- Seek qualified legal review before making decisions or taking action based on legal information

The AI assistant is intended to support access to information, not replace professional legal judgement.