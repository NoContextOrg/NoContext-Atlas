#!/usr/bin/env node

/**
 * generate-index.js
 * 
 * Recursively scans the repository for .md files and generates a searchable index.
 * 
 * USAGE:
 *   node generate-index.js                    # Scans from current directory
 *   node generate-index.js /path/to/root      # Scans from specified directory
 * 
 * OUTPUT:
 *   index.json - JSON file with indexed content (in root directory)
 * 
 * REQUIREMENTS:
 *   - Node.js 12+
 *   - No external dependencies
 */

const fs = require('fs');
const path = require('path');

// Configuration
const ROOT_DIR = process.argv[2] || process.cwd();
const OUTPUT_DIR = ROOT_DIR;  // Output to root directory
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'index.json');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`📁 Created output directory: ${OUTPUT_DIR}`);
}

/**
 * Strips markdown formatting and returns plain text
 */
function stripMarkdown(content) {
  let text = content;
  
  // Remove YAML frontmatter
  text = text.replace(/^---[\s\S]*?---\n/m, '');
  
  // Remove headings (keep text)
  text = text.replace(/^#+\s+/gm, '');
  
  // Remove bold/italic formatting
  text = text.replace(/\*\*([^*]+)\*\*/g, '$1');
  text = text.replace(/\*([^*]+)\*/g, '$1');
  text = text.replace(/__([^_]+)__/g, '$1');
  text = text.replace(/_([^_]+)_/g, '$1');
  
  // Remove inline code
  text = text.replace(/`([^`]+)`/g, '$1');
  
  // Remove code blocks
  text = text.replace(/```[\s\S]*?```/g, '');
  
  // Remove HTML comments
  text = text.replace(/<!--[\s\S]*?-->/g, '');
  
  // Remove links but keep text
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  
  // Remove blockquotes
  text = text.replace(/^>\s+/gm, '');
  
  // Remove lists
  text = text.replace(/^[\s]*[-*+]\s+/gm, '');
  text = text.replace(/^\d+\.\s+/gm, '');
  
  // Remove extra whitespace
  text = text.replace(/\s+/g, ' ').trim();
  
  return text;
}

/**
 * Extracts keywords from text (important words)
 * Filters out common stop words
 */
function extractKeywords(text, limit = 50) {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
    'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that',
    'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what',
    'which', 'who', 'when', 'where', 'why', 'how', 'as', 'if', 'not'
  ]);
  
  const words = text.toLowerCase().match(/\b[a-z0-9]+\b/g) || [];
  const filtered = words.filter(w => !stopWords.has(w) && w.length > 2);
  const unique = [...new Set(filtered)];
  
  return unique.slice(0, limit);
}

/**
 * Recursively scans directory for .md files
 */
function scanDirectory(dir, baseDir = dir) {
  let files = [];
  
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      // Skip hidden files and common ignore patterns
      if (entry.name.startsWith('.') || entry.name === 'node_modules') {
        continue;
      }
      
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        files = files.concat(scanDirectory(fullPath, baseDir));
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  } catch (err) {
    console.error(`⚠️  Error reading directory ${dir}:`, err.message);
  }
  
  return files;
}

/**
 * Main indexing function
 */
function generateIndex() {
  console.log(`\n🔍 Scanning directory: ${ROOT_DIR}`);
  
  const mdFiles = scanDirectory(ROOT_DIR);
  console.log(`📄 Found ${mdFiles.length} markdown files`);
  
  if (mdFiles.length === 0) {
    console.warn('⚠️  No markdown files found. Index will be empty.');
  }
  
  const index = [];
  
  for (const filePath of mdFiles) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const plainText = stripMarkdown(content);
      const relativePath = path.relative(ROOT_DIR, filePath);
      const filename = path.basename(filePath, '.md');
      const keywords = extractKeywords(plainText);
      
      index.push({
        title: filename,
        content: plainText.substring(0, 300), // Store first 300 chars as preview
        url: relativePath.replace(/\\/g, '/'), // Normalize Windows paths
        keywords: keywords,
        fullContent: plainText // Full content for search
      });
      
      console.log(`✅ Indexed: ${filename}`);
    } catch (err) {
      console.error(`❌ Error processing ${filePath}:`, err.message);
    }
  }
  
  // Remove fullContent from final index (only for search, not stored)
  const finalIndex = index.map(({ fullContent, ...item }) => item);
  
  // Write index file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(finalIndex, null, 2));
  console.log(`\n✨ Index generated: ${OUTPUT_FILE}`);
  console.log(`📊 Total indexed articles: ${finalIndex.length}\n`);
}

// Run if executed directly
if (require.main === module) {
  generateIndex();
}

module.exports = { stripMarkdown, extractKeywords, scanDirectory };
