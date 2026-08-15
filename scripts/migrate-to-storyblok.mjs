// One-time migration: src/content/projects/*.md -> Storyblok "project" stories.
// Requires STORYBLOK_MANAGEMENT_TOKEN and STORYBLOK_SPACE_ID in the environment.
// Run with: npm run migrate:storyblok

import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const SPACE_ID = process.env.STORYBLOK_SPACE_ID;
const MANAGEMENT_TOKEN = process.env.STORYBLOK_MANAGEMENT_TOKEN;

if (!SPACE_ID || !MANAGEMENT_TOKEN) {
  console.error('Missing STORYBLOK_SPACE_ID or STORYBLOK_MANAGEMENT_TOKEN in environment.');
  process.exit(1);
}

const PROJECTS_DIR = new URL('../src/content/projects/', import.meta.url);

// --- minimal frontmatter parser (handles the exact shape used in these files) ---
function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error('No frontmatter found');
  const [, fm, body] = match;
  const data = {};
  // Match top-level key: value lines, tolerating quoted strings, arrays, and bare booleans/numbers.
  const lines = fm.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (!kv) continue;
    const [, key, rawValue] = kv;
    data[key] = parseYamlScalar(rawValue);
  }
  return { data, body: body.trim() };
}

function parseYamlScalar(value) {
  const trimmed = value.trim();
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    return trimmed
      .slice(1, -1)
      .split(',')
      .map((s) => s.trim().replace(/^"(.*)"$/, '$1'))
      .filter(Boolean);
  }
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
  return trimmed.replace(/^"(.*)"$/, '$1');
}

// --- minimal markdown -> Storyblok richtext converter ---
// Covers only what's present in these 5 files: ##/### headings, paragraphs,
// unordered lists (-), bold (**text**), and inline links ([text](url)).
function markdownToRichtext(markdown) {
  const blocks = markdown.split(/\n\n+/).map((b) => b.trim()).filter(Boolean);
  const content = [];
  let currentList = null;

  for (const block of blocks) {
    const headingMatch = block.match(/^(#{2,3})\s+(.*)$/);
    if (headingMatch) {
      flushList();
      const level = headingMatch[1].length; // 2 or 3
      content.push({
        type: 'heading',
        attrs: { level },
        content: parseInline(headingMatch[2]),
      });
      continue;
    }

    const listLines = block.split('\n').filter((l) => l.trim().length);
    if (listLines.every((l) => /^-\s+/.test(l.trim()))) {
      flushList();
      content.push({
        type: 'bullet_list',
        content: listLines.map((l) => ({
          type: 'list_item',
          content: [{ type: 'paragraph', content: parseInline(l.trim().replace(/^-\s+/, '')) }],
        })),
      });
      continue;
    }

    flushList();
    content.push({ type: 'paragraph', content: parseInline(block) });
  }

  function flushList() {
    currentList = null;
  }

  return { type: 'doc', content };
}

function parseInline(text) {
  const nodes = [];
  // Split on bold (**...**) and links ([text](url)), keeping the rest as plain text.
  const pattern = /(\*\*[^*]+\*\*)|(\[[^\]]+\]\([^)]+\))/g;
  let lastIndex = 0;
  let match;
  while ((match = pattern.exec(text))) {
    if (match.index > lastIndex) {
      nodes.push({ type: 'text', text: text.slice(lastIndex, match.index) });
    }
    if (match[1]) {
      nodes.push({
        type: 'text',
        text: match[1].slice(2, -2),
        marks: [{ type: 'bold' }],
      });
    } else if (match[2]) {
      const linkMatch = match[2].match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      nodes.push({
        type: 'text',
        text: linkMatch[1],
        marks: [{ type: 'link', attrs: { href: linkMatch[2], target: '_blank' } }],
      });
    }
    lastIndex = pattern.lastIndex;
  }
  if (lastIndex < text.length) {
    nodes.push({ type: 'text', text: text.slice(lastIndex) });
  }
  return nodes.length ? nodes : [{ type: 'text', text }];
}

async function main() {
  const files = (await readdir(PROJECTS_DIR)).filter((f) => f.endsWith('.md'));

  for (const file of files) {
    const slug = path.basename(file, '.md');
    const raw = await readFile(new URL(file, PROJECTS_DIR), 'utf-8');
    const { data, body } = parseFrontmatter(raw);

    const storyPayload = {
      story: {
        name: data.title,
        slug,
        content: {
          component: 'project',
          title: data.title,
          tagline: data.tagline,
          description: data.description ?? '',
          body: markdownToRichtext(body),
          category: data.category,
          tags: Array.isArray(data.tags) ? data.tags.join(', ') : (data.tags ?? ''),
          status: data.status ?? 'In Progress',
          url: data.url ?? '',
          featured: Boolean(data.featured),
          order: Number(data.order ?? 99),
          accent: data.accent ?? '#00d9ff',
          protected: Boolean(data.protected),
          password_hash: data.passwordHash ?? '',
        },
      },
      publish: 1,
    };

    const res = await fetch(`https://mapi.storyblok.com/v1/spaces/${SPACE_ID}/stories`, {
      method: 'POST',
      headers: {
        Authorization: MANAGEMENT_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(storyPayload),
    });

    const json = await res.json();
    if (!res.ok) {
      console.error(`✗ ${slug}: ${res.status}`, json);
      continue;
    }
    console.log(`✓ ${slug} -> story id ${json.story.id}`);
  }
}

main();
