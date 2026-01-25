/**
 * AI PDF Chatbot - Main Entry Point
 * 
 * Usage:
 *   npm run ingest <pdf-path>     - Ingest PDF documents
 *   npm run chat                  - Start interactive chat
 *   npm start                     - Show help
 */

import chalk from 'chalk';

console.log(chalk.bold.blue('\n🤖 AI PDF Chatbot with SochDB + LangChain\n'));
console.log(chalk.gray('A Retrieval-Augmented Generation (RAG) chatbot for PDF documents\n'));

console.log(chalk.bold('Available Commands:\n'));
console.log(chalk.cyan('  npm run ingest <pdf-path>') + chalk.gray('  - Ingest PDF documents into vector store'));
console.log(chalk.cyan('  npm run chat') + chalk.gray('              - Start interactive chat session'));
console.log();

console.log(chalk.bold('Example Workflow:\n'));
console.log(chalk.gray('  1. Add your PDFs:'));
console.log(chalk.yellow('     npm run ingest ./my-documents/'));
console.log();
console.log(chalk.gray('  2. Start chatting:'));
console.log(chalk.yellow('     npm run chat'));
console.log();

console.log(chalk.bold('Configuration:\n'));
console.log(chalk.gray(`  Database: ${process.env.SOCHDB_PATH || './data/pdf_chatbot_db'}`));
console.log(chalk.gray(`  Model: ${process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4'}`));
console.log(chalk.gray(`  Embeddings: ${process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT || 'text-embedding-3-small'}`));
console.log();

console.log(chalk.dim('For more information, see README.md\n'));
