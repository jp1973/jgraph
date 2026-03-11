'use strict';

const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'graph.json');

// Load and cache graph data at startup
let graphData;
try {
  graphData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
} catch (err) {
  console.error('Failed to load graph data:', err);
  process.exit(1);
}

app.use(express.static(path.join(__dirname, 'public')));

// GET /api/graph - return all nodes and edges
app.get('/api/graph', (req, res) => {
  res.json(graphData);
});

// GET /api/nodes - return only nodes
app.get('/api/nodes', (req, res) => {
  res.json({ nodes: graphData.nodes });
});

// GET /api/edges - return only edges
app.get('/api/edges', (req, res) => {
  res.json({ edges: graphData.edges });
});

const server = app.listen(PORT, () => {
  console.log(`jgraph server running at http://localhost:${PORT}`);
});

module.exports = { app, server };
