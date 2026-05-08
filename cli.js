#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { scanFiles } = require('./indexer/file-scanner');
const { parseFile } = require('./indexer/parser');
const { analyzeDocument } = require('./indexer/analyzer');
const { buildGraph } = require('./indexer/graph-builder');

const ROOT_DIR = process.cwd();
const KB_DIR = path.join(ROOT_DIR, 'kb');
const OUTPUT_FILE = path.join(ROOT_DIR, 'knowledge_graph.json');

/**
 * Main indexing pipeline
 */
async function main() {
  console.log(`\n🔍 Starting Atlas knowledge graph generation...`);
  console.log(`   Scanning in: ${KB_DIR}`);

  // 1. Find all markdown files
  const files = scanFiles(KB_DIR);
  console.log(`📄 Found ${files.length} markdown files.`);
  if (files.length === 0) {
    console.warn('⚠️ No markdown files found. Output will be empty.');
  }

  // 2. Parse and analyze each file
  const documents = files.map(filePath => {
    const parsed = parseFile(filePath, ROOT_DIR);
    const analyzed = analyzeDocument(parsed);
    console.log(`  -> Analyzed: ${analyzed.id}`);
    return analyzed;
  });

  // 3. Build the final graph
  const knowledgeGraph = buildGraph(documents);
  knowledgeGraph.generatedAt = new Date().toISOString();

  // 4. Write to disk
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(knowledgeGraph, null, 2));
  console.log(`\n✨ Knowledge graph generated: ${OUTPUT_FILE}`);
  console.log(`📊 Graph contains ${knowledgeGraph.nodes.length} nodes and ${knowledgeGraph.edges.length} edges.\n`);
}

main().catch(err => console.error('❌ Pipeline failed:', err));