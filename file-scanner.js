const fs = require('fs');
const path = require('path');

/**
 * Recursively scans a directory for markdown (.md) files.
 * @param {string} dir - The directory to start scanning from.
 * @returns {string[]} An array of full file paths.
 */
function scanFiles(dir) {
  let files = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      // Ignore hidden files, node_modules, and the output directory itself
      if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === '_site') {
        continue;
      }

      if (entry.isDirectory()) {
        files = files.concat(scanFiles(fullPath));
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  } catch (err) {
    console.error(`⚠️ Error reading directory ${dir}:`, err.message);
  }
  return files;
}

module.exports = { scanFiles };