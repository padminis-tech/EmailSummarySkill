import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import express from 'express';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;

function loadSkill() {
  try {
    const skillPath = join(__dirname, '../SKILL.md');
    const content = readFileSync(skillPath, 'utf-8');
    const frontmatter = content.match(/^---\n([\s\S]*?)\n---/);
    let version = '1.0.0';
    let name = 'email-summary';
    if (frontmatter) {
      const versionMatch = frontmatter[1].match(/version:\s*(.+)/);
      const nameMatch = frontmatter[1].match(/name:\s*(.+)/);
      if (versionMatch) version = versionMatch[1].trim();
      if (nameMatch) name = nameMatch[1].trim();
    }
    return { name, version, content };
  } catch (e) {
    return { error: 'Skill not found', message: e.message };
  }
}

// Load once at startup — serve from memory
const SKILL = loadSkill();

const server = new McpServer({ name: 'email-summary-mcp-server', version: '1.0.0' });

server.tool(
  'get_email_summary_skill',           // ← fixed: all underscores
  'Returns the email summary skill instructions for generating a structured inbox digest',
  {},
  async () => {
    if (SKILL.error) throw new Error(`Skill unavailable: ${SKILL.message}`);
    return { content: [{ type: 'text', text: SKILL.content }] };
  }
);

app.post('/mcp', async (req, res) => {
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  res.on('close', () => transport.close());
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

app.get('/mcp', (req, res) => {
  res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', skill: SKILL.name, version: SKILL.version });
});

app.listen(PORT, () => {
  console.log(`MCP Server running on port ${PORT} | Skill: ${SKILL.name} v${SKILL.version}`);
});
