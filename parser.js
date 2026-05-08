const fs = require('fs');
const path = require('path');
const matter = require('gray-matter'); // For parsing YAML frontmatter

/**
 * Strips markdown formatting to get plain text.
 * This is a simplified version; a more robust library could be used.
 * @param {string} markdownContent - The raw markdown content.
 * @returns {string}
 */
function stripMarkdown(markdownContent) {
  return markdownContent
    .replace(/^#+\s+/gm, '') // Headings
    .replace(/(\*\*|__)(.*?)\1/g, '$2') // Bold
    .replace(/(\*|_)(.*?)\1/g, '$2') // Italic
    .replace(/`([^`]+)`/g, '$1') // Inline code
    .replace(/```[\s\S]*?```/g, '') // Code blocks
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
    .replace(/^>\s+/gm, '') // Blockquotes
    .replace(/^[\s]*[-*+]\s+/gm, '') // Lists
    .replace(/\s+/g, ' ') // Collapse whitespace
    .trim();
}

/**
 * Reads and parses a single markdown file.
 * @param {string} filePath - The full path to the file.
 * @param {string} rootDir - The root directory of the repository.
 * @returns {object}
 */
function parseFile(filePath, rootDir) {
  const rawContent = fs.readFileSync(filePath, 'utf-8');
  const { data: metadata, content: markdownContent } = matter(rawContent);
  const plainText = stripMarkdown(markdownContent);
  const relativePath = path.relative(rootDir, filePath).replace(/\\/g, '/');

  return {
    id: metadata.title || path.basename(filePath, '.md'),
    relativePath,
    metadata, // from YAML frontmatter
    plainText,
  };
}

module.exports = { parseFile };