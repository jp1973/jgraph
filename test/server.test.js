'use strict';

/**
 * Basic integration tests for the jgraph server API.
 * Uses only Node.js built-ins (no external test framework required).
 */

const http = require('http');
const assert = require('assert');

// Start the server on a random port for tests
process.env.PORT = '0';
const { server } = require('../server');

function request(path) {
  return new Promise((resolve, reject) => {
    const addr = server.address();
    const options = { hostname: '127.0.0.1', port: addr.port, path, method: 'GET' };
    const req = http.request(options, res => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, body, headers: res.headers }));
    });
    req.on('error', reject);
    req.end();
  });
}

async function runTests() {
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log('  \u2713 ' + name);
      passed++;
    } catch (err) {
      console.error('  \u2717 ' + name);
      console.error('    ' + err.message);
      failed++;
    }
  }

  // Wait for server to be listening
  await new Promise(resolve => {
    if (server.listening) return resolve();
    server.once('listening', resolve);
  });

  console.log('\nRunning jgraph API tests...\n');

  await test('GET /api/graph returns 200', async () => {
    const res = await request('/api/graph');
    assert.strictEqual(res.status, 200);
  });

  await test('GET /api/graph returns JSON content-type', async () => {
    const res = await request('/api/graph');
    assert.ok(res.headers['content-type'].includes('application/json'));
  });

  await test('GET /api/graph returns nodes array', async () => {
    const res = await request('/api/graph');
    const data = JSON.parse(res.body);
    assert.ok(Array.isArray(data.nodes), 'nodes should be an array');
    assert.ok(data.nodes.length > 0, 'nodes should not be empty');
  });

  await test('GET /api/graph returns edges array', async () => {
    const res = await request('/api/graph');
    const data = JSON.parse(res.body);
    assert.ok(Array.isArray(data.edges), 'edges should be an array');
    assert.ok(data.edges.length > 0, 'edges should not be empty');
  });

  await test('GET /api/nodes returns only nodes', async () => {
    const res = await request('/api/nodes');
    assert.strictEqual(res.status, 200);
    const data = JSON.parse(res.body);
    assert.ok(Array.isArray(data.nodes), 'nodes should be an array');
    assert.strictEqual(data.edges, undefined, 'edges should not be present');
  });

  await test('GET /api/edges returns only edges', async () => {
    const res = await request('/api/edges');
    assert.strictEqual(res.status, 200);
    const data = JSON.parse(res.body);
    assert.ok(Array.isArray(data.edges), 'edges should be an array');
    assert.strictEqual(data.nodes, undefined, 'nodes should not be present');
  });

  await test('Each node has id, label, and group', async () => {
    const res = await request('/api/graph');
    const { nodes } = JSON.parse(res.body);
    nodes.forEach(n => {
      assert.ok(n.id !== undefined, 'node missing id');
      assert.ok(typeof n.label === 'string', 'node missing label');
      assert.ok(typeof n.group === 'string', 'node missing group');
    });
  });

  await test('Each edge has id, from, to, and label', async () => {
    const res = await request('/api/graph');
    const { edges } = JSON.parse(res.body);
    edges.forEach(e => {
      assert.ok(e.id !== undefined, 'edge missing id');
      assert.ok(e.from !== undefined, 'edge missing from');
      assert.ok(e.to !== undefined, 'edge missing to');
      assert.ok(typeof e.label === 'string', 'edge missing label');
    });
  });

  await test('GET / serves the HTML page', async () => {
    const res = await request('/');
    assert.strictEqual(res.status, 200);
    assert.ok(res.headers['content-type'].includes('text/html'));
  });

  server.close();

  console.log('\n' + passed + ' passed, ' + failed + ' failed\n');
  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
