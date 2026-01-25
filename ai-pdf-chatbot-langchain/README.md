# AI PDF Chatbot with SochDB + LangChain

A production-ready Retrieval-Augmented Generation (RAG) chatbot that lets you chat with your PDF documents using SochDB vector store, LangChain, and Azure OpenAI.

## 🌟 Features

- **PDF Ingestion**: Automatically extract and chunk PDF documents
- **Vector Storage**: Store document embeddings in SochDB for fast retrieval
- **Semantic Search**: Find relevant document chunks using cosine similarity
- **RAG Pipeline**: Combine retrieval with LLM generation for accurate answers
- **Interactive Chat**: User-friendly command-line interface
- **Azure OpenAI**: Leverage GPT-4 and text-embedding-3-small
- **Source Attribution**: Shows which documents were used for each answer

## 🏗️ Architecture

```
┌─────────────┐
│   PDF Files │
└──────┬──────┘
       │ 1. Ingest
       ▼
┌────────────────┐
│ Text Splitter  │ (Chunks with overlap)
└────────┬───────┘
         │ 2. Embed
         ▼
┌──────────────────┐
│ Azure Embeddings │ (text-embedding-3-small)
└────────┬─────────┘
         │ 3. Store
         ▼
┌─────────────────┐
│ SochDB Vectors  │ (Semantic search ready)
└────────┬────────┘
         │ 4. Query
         ▼
┌────────────────┐
│ Similarity     │ (Top-K retrieval)
│ Search         │
└────────┬───────┘
         │ 5. Generate
         ▼
┌────────────────┐
│ Azure GPT-4    │ (Context + Question)
└────────┬───────┘
         │
         ▼
    📝 Answer
```

## 📋 Prerequisites

- Node.js 18+
- Azure OpenAI account with:
  - GPT-4 deployment
  - text-embedding-3-small deployment
- PDF files to chat with

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your Azure OpenAI credentials:

```bash
cp .env.example .env
```

Edit `.env`:

```env
AZURE_OPENAI_API_KEY=your-api-key-here
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_VERSION=2024-12-01-preview
AZURE_OPENAI_DEPLOYMENT=gpt-4
AZURE_OPENAI_EMBEDDING_DEPLOYMENT=text-embedding-3-small
```

### 3. Ingest PDF Documents

Ingest a single PDF:

```bash
npm run ingest ./my-document.pdf
```

Ingest all PDFs in a directory:

```bash
npm run ingest ./my-documents/
```

Clear and re-ingest:

```bash
npm run ingest ./my-documents/ --clear
```

### 4. Start Chatting

```bash
npm run chat
```

Example conversation:

```
You: What are the main topics covered in the document?

🔍 Searching documents...
💭 Thinking...

AI: Based on the documents, the main topics covered include:
1. Machine Learning fundamentals
2. Neural Network architectures
3. Training methodologies
...

📎 Sources:
   - machine-learning-guide.pdf
   - neural-networks-intro.pdf

You: Can you explain neural networks in simple terms?
...
```

## 🎯 How It Works

### Vector Storage (vectorstore.ts)

SochDB stores document chunks with their embeddings:

```typescript
// Each document stored as:
{
  "doc_timestamp_index": {
    content: "Document text chunk...",
    source: "filename.pdf",
    chunkIndex: 0,
    ...metadata
  },
  "doc_timestamp_index_vector": [0.123, 0.456, ...] // 1536-dim embedding
}
```

### Similarity Search

1. Query is converted to embedding
2. Compare query embedding with all document embeddings using cosine similarity
3. Return top-K most similar chunks (default: 5)
4. Filter by similarity threshold (default: 0.7)

### RAG Pipeline

1. **Retrieval**: Find relevant document chunks
2. **Context Building**: Format chunks with metadata
3. **Augmented Prompt**: Combine context + user question
4. **Generation**: LLM generates answer based on context
5. **Source Attribution**: Show which documents were used

## 🔧 Configuration

Edit `src/config.ts` to customize:

```typescript
export const config = {
  pdf: {
    chunkSize: 1000,      // Characters per chunk
    chunkOverlap: 200,    // Overlap between chunks
  },
  
  rag: {
    topK: 5,              // Number of chunks to retrieve
    similarityThreshold: 0.7,  // Minimum similarity (0-1)
  },
};
```

## 📊 Example Use Cases

### 1. Research Papers

```bash
npm run ingest ./research-papers/
npm run chat

You: What are the key findings about climate change?
AI: According to the research papers, the key findings include...
```

### 2. Technical Documentation

```bash
npm run ingest ./api-docs/
npm run chat

You: How do I authenticate with the API?
AI: Based on the API documentation, authentication requires...
```

### 3. Legal Documents

```bash
npm run ingest ./contracts/
npm run chat

You: What are the termination clauses?
AI: The documents contain the following termination clauses...
```

## 🧪 Testing

Test with sample PDF:

```bash
# Create a test PDF with sample text
echo "This is a test document about AI and machine learning." > test.txt
# Convert to PDF (requires pandoc or similar)
pandoc test.txt -o test.pdf

# Ingest and test
npm run ingest test.pdf
npm run chat
```

## 🔍 Troubleshooting

### "No documents found in vector store"

Run ingestion first:
```bash
npm run ingest ./your-pdfs/
```

### "Could not find SochDB native library"

Install the library system-wide:
```bash
cd ../../sochdb
./install_sochdb_lib.sh
```

### "No text content found in PDF"

Some PDFs are image-based. Use OCR tools like `tesseract` to extract text first.

### Poor answer quality

Try adjusting:
- `chunkSize`: Increase for more context per chunk
- `topK`: Retrieve more chunks
- `similarityThreshold`: Lower to get more results
- LLM temperature: Lower for more focused answers

## 📈 Performance

### Benchmarks (M1 Mac)

- **Ingestion**: ~100 pages/minute
- **Query**: ~2-3 seconds (including LLM generation)
- **Vector Search**: <50ms for 1000 documents

### Scaling

- **Documents**: Tested with 10,000+ chunks
- **Concurrent Users**: SochDB embedded mode (single process)
- **Production**: Use SochDB server mode for multi-user scenarios

## 🔐 Security

- Never commit `.env` file (included in `.gitignore`)
- Rotate API keys regularly
- Use Azure managed identities in production
- Implement rate limiting for public-facing deployments

## 🛠️ Development

### Project Structure

```
ai-pdf-chatbot-langchain/
├── src/
│   ├── index.ts         # Main entry point
│   ├── config.ts        # Configuration
│   ├── vectorstore.ts   # SochDB vector store
│   ├── ingest.ts        # PDF ingestion
│   └── chat.ts          # Interactive chat
├── data/                # SochDB database (auto-created)
├── .env                 # Environment variables (not in git)
├── .env.example         # Example environment variables
├── package.json         # Dependencies
└── README.md           # This file
```

### Adding Features

**Custom metadata extraction:**

Edit `ingest.ts` to add custom metadata:

```typescript
metadata: {
  source: fileName,
  author: extractAuthor(pdfData),
  date: extractDate(pdfData),
  ...
}
```

**Different embedding models:**

Modify `config.ts`:

```typescript
embeddingDeployment: 'text-embedding-ada-002', // Older model
```

**Streaming responses:**

Update `chat.ts` to stream LLM output for better UX.

## 📚 Learn More

- [SochDB Documentation](https://docs.sochdb.com)
- [LangChain Documentation](https://js.langchain.com)
- [Azure OpenAI](https://azure.microsoft.com/en-us/products/ai-services/openai-service)
- [RAG Guide](https://www.pinecone.io/learn/retrieval-augmented-generation/)

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Add tests if applicable
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Built with [SochDB](https://github.com/sochdb/sochdb)
- Powered by [LangChain](https://github.com/langchain-ai/langchainjs)
- Uses [Azure OpenAI](https://azure.microsoft.com/en-us/products/ai-services/openai-service)

---

**Made with ❤️ using SochDB + LangChain**
