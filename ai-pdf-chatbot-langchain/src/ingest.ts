/**
 * PDF Ingestion Script
 * Processes PDF files and stores them in SochDB vector store
 */

import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { Document } from '@langchain/core/documents';
import { AzureOpenAIEmbeddings } from '@langchain/openai';
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { config, validateConfig } from './config.js';
import { SochDBVectorStore } from './vectorstore.js';

const program = new Command();

program
  .name('pdf-ingest')
  .description('Ingest PDF files into SochDB vector store')
  .argument('<pdf-path>', 'Path to PDF file or directory')
  .option('-c, --clear', 'Clear existing documents before ingesting')
  .action(async (pdfPath: string, options: { clear?: boolean }) => {
    try {
      validateConfig();
      await ingestPDFs(pdfPath, options.clear || false);
    } catch (error) {
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });

async function ingestPDFs(pdfPath: string, clearExisting: boolean) {
  console.log(chalk.bold.blue('\n🤖 AI PDF Chatbot - Document Ingestion\n'));

  // Initialize embeddings
  const embeddings = new AzureOpenAIEmbeddings({
    azureOpenAIApiKey: config.azureOpenAI.apiKey,
    azureOpenAIApiInstanceName: config.azureOpenAI.endpoint.split('//')[1].split('.')[0],
    azureOpenAIApiDeploymentName: config.azureOpenAI.embeddingDeployment,
    azureOpenAIApiVersion: config.azureOpenAI.apiVersion,
  });

  // Initialize vector store
  const vectorStore = new SochDBVectorStore({
    dbPath: config.sochdb.path,
    namespace: config.sochdb.namespace,
    embeddings,
  });

  try {
    // Clear existing documents if requested
    if (clearExisting) {
      const spinner = ora('Clearing existing documents...').start();
      await vectorStore.clear();
      spinner.succeed('Existing documents cleared');
    }

    // Get PDF files
    const pdfFiles = getPDFFiles(pdfPath);
    console.log(chalk.green(`\n📄 Found ${pdfFiles.length} PDF file(s)\n`));

    // Process each PDF
    for (const filePath of pdfFiles) {
      await processPDF(filePath, vectorStore);
    }

    // Show statistics
    const stats = await vectorStore.getStats();
    console.log(chalk.bold.green(`\n✅ Ingestion Complete!`));
    console.log(chalk.gray(`   Total documents in store: ${stats.documentCount}`));
    console.log(chalk.gray(`   Vector store: ${config.sochdb.path}`));
    
  } finally {
    vectorStore.close();
  }
}

function getPDFFiles(pdfPath: string): string[] {
  const stat = fs.statSync(pdfPath);
  
  if (stat.isFile()) {
    if (path.extname(pdfPath).toLowerCase() === '.pdf') {
      return [pdfPath];
    } else {
      throw new Error('File must be a PDF');
    }
  } else if (stat.isDirectory()) {
    return fs.readdirSync(pdfPath)
      .filter(file => path.extname(file).toLowerCase() === '.pdf')
      .map(file => path.join(pdfPath, file));
  } else {
    throw new Error('Invalid path');
  }
}

async function processPDF(filePath: string, vectorStore: SochDBVectorStore) {
  const fileName = path.basename(filePath);
  const spinner = ora(`Processing ${fileName}...`).start();

  try {
    // Read PDF
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdf(dataBuffer);
    
    spinner.text = `Extracting text from ${fileName}...`;
    const text = pdfData.text;
    
    if (!text || text.trim().length === 0) {
      spinner.warn(`${fileName} - No text content found`);
      return;
    }

    // Split text into chunks
    spinner.text = `Chunking ${fileName}...`;
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: config.pdf.chunkSize,
      chunkOverlap: config.pdf.chunkOverlap,
    });

    const chunks = await textSplitter.createDocuments([text]);
    
    // Add metadata
    const documents = chunks.map((chunk, i) => new Document({
      pageContent: chunk.pageContent,
      metadata: {
        source: fileName,
        filePath: filePath,
        chunkIndex: i,
        totalChunks: chunks.length,
        pages: pdfData.numpages,
      },
    }));

    // Store in vector store
    spinner.text = `Storing ${documents.length} chunks from ${fileName}...`;
    await vectorStore.addDocuments(documents);
    
    spinner.succeed(
      `${fileName} - ${documents.length} chunks (${pdfData.numpages} pages)`
    );
  } catch (error) {
    spinner.fail(`${fileName} - Error: ${error}`);
    throw error;
  }
}

program.parse();
