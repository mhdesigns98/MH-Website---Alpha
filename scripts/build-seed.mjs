// Builds seed/seed.json from the markdown files in seed/projects/.
// EmDash applies the seed on the first request to an empty database, so this
// is how the original markdown projects get into the CMS. After that, edit
// projects in the admin (/_emdash/admin), not here.
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parse } from 'yaml';
import { markdownToPortableText } from 'emdash/client';

const CATEGORIES = ['Gaming Tool', 'Web Design', 'Podcast', 'Documentary', 'Dev Tool', 'Branding'];
const STATUSES = ['Live', 'In Progress', 'Concept'];

const projectsDir = new URL('../seed/projects/', import.meta.url);
const files = (await readdir(projectsDir)).filter((f) => f.endsWith('.md')).sort();

const projects = [];
for (const file of files) {
  const raw = await readFile(new URL(file, projectsDir), 'utf8');
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) throw new Error(`${file}: missing frontmatter`);
  const fm = parse(match[1]);
  const slug = file.replace(/\.md$/, '');

  if (!CATEGORIES.includes(fm.category)) throw new Error(`${file}: unknown category "${fm.category}"`);
  if (fm.status && !STATUSES.includes(fm.status)) throw new Error(`${file}: unknown status "${fm.status}"`);

  projects.push({
    id: slug,
    slug,
    status: 'published',
    data: {
      title: fm.title,
      tagline: fm.tagline,
      description: fm.description,
      category: fm.category,
      tags: (fm.tags ?? []).join(', '),
      project_status: fm.status ?? 'In Progress',
      ...(fm.url ? { url: fm.url } : {}),
      featured: fm.featured ?? false,
      order: fm.order ?? 99,
      accent: fm.accent ?? '#00d9ff',
      protected: fm.protected ?? false,
      content: markdownToPortableText(match[2].trim()),
    },
  });
}

const seed = {
  $schema: 'https://emdashcms.com/seed.schema.json',
  version: '1',
  meta: {
    name: 'MH Designs',
    description: 'Portfolio of Mike Hayes, Web Designer and Developer.',
    author: 'Mike Hayes',
  },
  settings: {
    title: 'MH Designs',
    tagline: 'Web Designer & Developer, building systems, tools, and digital experiences.',
  },
  collections: [
    {
      slug: 'projects',
      label: 'Projects',
      labelSingular: 'Project',
      supports: ['drafts', 'revisions', 'search', 'seo'],
      fields: [
        { slug: 'title', label: 'Title', type: 'string', required: true, searchable: true },
        { slug: 'tagline', label: 'Tagline (shows on cards)', type: 'text', required: true, searchable: true },
        { slug: 'description', label: 'Description (SEO)', type: 'text', searchable: true },
        { slug: 'category', label: 'Category', type: 'select', required: true, validation: { options: CATEGORIES } },
        { slug: 'tags', label: 'Tags (comma-separated)', type: 'string' },
        {
          slug: 'project_status',
          label: 'Status',
          type: 'select',
          required: true,
          defaultValue: 'In Progress',
          validation: { options: STATUSES },
        },
        { slug: 'url', label: 'Live URL', type: 'url' },
        { slug: 'featured', label: 'Featured', type: 'boolean', defaultValue: false },
        { slug: 'order', label: 'Sort order (1 = first)', type: 'integer', defaultValue: 99 },
        { slug: 'accent', label: 'Accent color (hex)', type: 'string', defaultValue: '#00d9ff' },
        { slug: 'protected', label: 'Password protected', type: 'boolean', defaultValue: false },
        { slug: 'access_password', label: 'Password (when protected)', type: 'string' },
        { slug: 'content', label: 'Content', type: 'portableText', searchable: true },
      ],
    },
  ],
  content: { projects },
};

const out = join(new URL('../seed/', import.meta.url).pathname, 'seed.json');
await writeFile(out, JSON.stringify(seed, null, 2) + '\n');
console.log(`Wrote ${projects.length} projects to seed/seed.json`);
