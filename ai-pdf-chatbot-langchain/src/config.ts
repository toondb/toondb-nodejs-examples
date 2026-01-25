/**
 * Configuration for AI PDF Chatbot
 */

import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  // Azure OpenAI
  azureOpenAI: {
    apiKey: process.env.AZURE_OPENAI_API_KEY || '',
    endpoint: process.env.AZURE_OPENAI_ENDPOINT || '',
    apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-12-01-preview',
    deployment: process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4',
    embeddingDeployment: process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT || 'text-embedding-3-small',
  },

  // SochDB
  sochdb: {
    path: process.env.SOCHDB_PATH || './data/pdf_chatbot_db',
    namespace: 'pdf_documents',
  },

  // PDF Processing
  pdf: {
    chunkSize: 1000,
    chunkOverlap: 200,
  },

  // RAG
  rag: {
    topK: 5,
    similarityThreshold: 0.7,
  },
};

// Validate configuration
export function validateConfig() {
  const required = [
    'AZURE_OPENAI_API_KEY',
    'AZURE_OPENAI_ENDPOINT',
    'AZURE_OPENAI_DEPLOYMENT',
    'AZURE_OPENAI_EMBEDDING_DEPLOYMENT',
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please copy .env.example to .env and fill in your credentials.'
    );
  }
}
