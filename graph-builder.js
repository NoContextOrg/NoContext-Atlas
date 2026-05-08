/**
 * Builds the knowledge graph from a collection of analyzed documents.
 * @param {object[]} documents - Array of analyzed document objects.
 * @returns {object} The final knowledge graph.
 */
function buildGraph(documents) {
  const nodes = [];
  const edges = [];
  const systemNodes = new Map();

  for (const doc of documents) {
    // 1. Create a node for the document itself
    nodes.push({
      id: doc.id,
      type: doc.docType,
      label: doc.metadata.title || doc.id,
      path: doc.relativePath,
      project: doc.metadata.project,
      contentPreview: doc.plainText.substring(0, 250),
      keywords: doc.keywords,
      metadata: doc.metadata,
    });

    // 2. Create or find a node for the system/project
    const project = doc.metadata.project;
    if (project) {
      const systemId = `system:${project.toLowerCase()}`;
      if (!systemNodes.has(systemId)) {
        nodes.push({
          id: systemId,
          type: 'system',
          label: project,
        });
        systemNodes.set(systemId, true);
      }

      // 3. Create an edge linking the document to its system
      edges.push({
        source: doc.id,
        target: systemId,
        type: 'belongs_to',
        label: `belongs to ${project}`,
      });
    }

    // 4. TODO: Detect and create 'references' edges
    // (e.g., by finding [[KB...]] links in doc.rawContent)
  }

  return {
    version: '1.0.0',
    nodes,
    edges,
  };
}

module.exports = { buildGraph };