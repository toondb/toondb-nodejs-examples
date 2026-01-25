/**
 * Interactive Chat Interface
 * Chat with your PDF documents using RAG
 */

import readline from 'readline';
import chalk from 'chalk';
import { AzureChatOpenAI, AzureOpenAIEmbeddings } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { config, validateConfig } from './config.js';
import { SochDBVectorStore } from './vectorstore.js';

async function main() {
  try {
    validateConfig();
    await startChat();
  } catch (error) {
    console.error(chalk.red('Error:'), error);
    process.exit(1);
  }
}

async function startChat() {
  console.log(chalk.bold.blue('\n🤖 AI PDF Chatbot - Interactive Mode\n'));
  console.log(chalk.gray('Ask questions about your PDF documents'));
  console.log(chalk.gray('Type "exit" or "quit" to end the session\n'));

  // Initialize embeddings
  const embeddings = new AzureOpenAIEmbeddings({
    azureOpenAIApiKey: config.azureOpenAI.apiKey,
    azureOpenAIApiInstanceName: config.azureOpenAI.endpoint.split('//')[1].split('.')[0],
    azureOpenAIApiDeploymentName: config.azureOpenAI.embeddingDeployment,
    azureOpenAIApiVersion: config.azureOpenAI.apiVersion,
  });

  // Initialize LLM
  const llm = new AzureChatOpenAI({
    azureOpenAIApiKey: config.azureOpenAI.apiKey,
    azureOpenAIApiInstanceName: config.azureOpenAI.endpoint.split('//')[1].split('.')[0],
    azureOpenAIApiDeploymentName: config.azureOpenAI.deployment,
    azureOpenAIApiVersion: config.azureOpenAI.apiVersion,
    temperature: 0.7,
  });

  // Initialize vector store
  const vectorStore = new SochDBVectorStore({
    dbPath: config.sochdb.path,
    namespace: config.sochdb.namespace,
    embeddings,
  });

  // Check if documents exist
  const stats = await vectorStore.getStats();
  if (stats.documentCount === 0) {
    console.log(chalk.yellow('⚠️  No documents found in vector store'));
    console.log(chalk.gray('   Run: npm run ingest <pdf-path> to add documents\n'));
    vectorStore.close();
    return;
  }

  console.log(chalk.green(`📚 Loaded ${stats.documentCount} document chunks\n`));

  // Create RAG prompt
  const prompt = ChatPromptTemplate.fromTemplate(`
You are a helpful AI assistant that answers questions based on the provided context from PDF documents.

Context from documents:
{context}

User Question: {question}

Instructions:
- Answer the question based ONLY on the information provided in the context
- If the context doesn't contain enough information, say "I don't have enough information in the documents to answer that question"
- Be specific and cite which document the information comes from when possible
- Keep your answer concise and relevant

Answer:`);

  // Create chain
  const chain = prompt.pipe(llm).pipe(new StringOutputParser());

  // Start interactive loop
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const askQuestion = () => {
    rl.question(chalk.cyan('You: '), async (question) => {
      if (!question.trim()) {
        askQuestion();
        return;
      }

      if (question.toLowerCase() === 'exit' || question.toLowerCase() === 'quit') {
        console.log(chalk.yellow('\n👋 Goodbye!\n'));
        vectorStore.close();
        rl.close();
        return;
      }

      try {
        // Search for relevant documents
        console.log(chalk.gray('\n🔍 Searching documents...\n'));
        
        const relevantDocs = await vectorStore.similaritySearch(
          question,
          config.rag.topK,
          config.rag.similarityThreshold
        );

        if (relevantDocs.length === 0) {
          console.log(chalk.yellow('AI: I couldn\'t find any relevant information in the documents for that question.\n'));
          askQuestion();
          return;
        }

        // Format context
        const context = relevantDocs.map((doc, i) => {
          const source = doc.metadata.source || 'Unknown';
          return `[Document ${i + 1}: ${source}]\n${doc.pageContent}`;
        }).join('\n\n---\n\n');

        // Generate answer
        console.log(chalk.gray('💭 Thinking...\n'));
        
        const answer = await chain.invoke({
          context,
          question,
        });

        console.log(chalk.green('AI:'), answer);
        
        // Show sources
        console.log(chalk.gray('\n📎 Sources:'));
        const uniqueSources = [...new Set(relevantDocs.map(doc => doc.metadata.source))];
        uniqueSources.forEach(source => {
          console.log(chalk.gray(`   - ${source}`));
        });
        console.log();

      } catch (error) {
        console.error(chalk.red('Error:'), error);
      }

      askQuestion();
    });
  };

  askQuestion();
}

main();
