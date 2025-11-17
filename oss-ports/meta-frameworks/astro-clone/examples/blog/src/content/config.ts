/**
 * Content collections configuration
 */

import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    excerpt: z.string(),
    date: z.date(),
    author: z.string(),
    tags: z.array(z.string()),
    image: z.string().optional(),
    draft: z.boolean().optional(),
  }),
});

const authors = defineCollection({
  type: 'data',
  schema: z.object({
    name: z.string(),
    bio: z.string(),
    avatar: z.string(),
    twitter: z.string().optional(),
    github: z.string().optional(),
  }),
});

export const collections = {
  blog,
  authors,
};
