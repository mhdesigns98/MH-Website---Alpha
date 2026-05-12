import { defineCollection, z } from 'astro:content';

const projects = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    tagline: z.string(),
    description: z.string(),
    category: z.enum(['Gaming Tool', 'Web Design', 'Podcast', 'Documentary', 'Dev Tool', 'Branding']),
    tags: z.array(z.string()),
    status: z.enum(['Live', 'In Progress', 'Concept']).default('In Progress'),
    url: z.string().url().optional(),
    featured: z.boolean().default(false),
    order: z.number().default(99),
    accent: z.string().default('#00d9ff'),
    protected: z.boolean().default(false),
    passwordHash: z.string().optional(),
  }),
});

export const collections = { projects };
