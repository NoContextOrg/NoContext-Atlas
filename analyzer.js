const path = require('path');
const { STOP_WORDS } = require('../common/stopwords');

/**
 * Extracts meaningful keywords from plain text.
 * @param {string} text - The text to analyze.
 * @param {number} limit - Max number of keywords to return.
 * @returns {string[]}
 */
function extractKeywords(text, limit = 50) {
  const words = text.toLowerCase().match(/\b[a-z0-9-]+\b/g) || [];
  const filtered = words.filter(w => !STOP_WORDS.has(w) && w.length > 2);
  const unique = [...new Set(filtered)];
  return unique.slice(0, limit);
}

/**
 * Infers the document type from its file path.
 * @param {string} relativePath - The path relative to the KB root.
 * @returns {string}
 */
function classifyDocumentType(relativePath) {
  const pathParts = relativePath.split(path.sep);
  // Example: kb/Anino/how-to/file.md -> 'how-to'
  if (pathParts.length > 2) {
    return pathParts[1].toLowerCase();
  }
  return 'documentation'; // Default
}

/**
 * Analyzes a parsed document to add semantic meaning.
 * @param {object} parsedDocument - The output from the parser.
 * @returns {object}
 */
function analyzeDocument(parsedDocument) {
  const { id, metadata, plainText, relativePath } = parsedDocument;

  const docType = metadata.category || classifyDocumentType(relativePath);
  const keywords = extractKeywords(`${metadata.title || ''} ${metadata.tags?.join(' ') || ''} ${plainText}`);

  return {
    ...parsedDocument,
    docType,
    keywords,
  };
}

module.exports = {
  analyzeDocument,
};