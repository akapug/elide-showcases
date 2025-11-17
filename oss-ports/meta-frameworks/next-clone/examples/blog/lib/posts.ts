/**
 * Blog post utilities
 */

import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import matter from 'gray-matter';

const postsDirectory = join(process.cwd(), 'content/posts');

export interface Post {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  formattedDate: string;
  author: string;
  coverImage?: string;
  tags: string[];
  readingTime: number;
}

export async function getPosts(): Promise<Post[]> {
  const fileNames = await readdir(postsDirectory);
  const posts = await Promise.all(
    fileNames
      .filter((name) => name.endsWith('.mdx'))
      .map((name) => getPost(name.replace(/\.mdx$/, '')))
  );

  return posts.sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
}

export async function getPost(slug: string): Promise<Post> {
  const filePath = join(postsDirectory, `${slug}.mdx`);
  const fileContents = await readFile(filePath, 'utf8');

  const { data, content } = matter(fileContents);

  const readingTime = Math.ceil(content.split(/\s+/).length / 200);

  return {
    slug,
    title: data.title,
    excerpt: data.excerpt || '',
    content,
    date: data.date,
    formattedDate: new Date(data.date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    author: data.author || 'Anonymous',
    coverImage: data.coverImage,
    tags: data.tags || [],
    readingTime,
  };
}

export async function getPostsByTag(tag: string): Promise<Post[]> {
  const posts = await getPosts();
  return posts.filter((post) => post.tags.includes(tag));
}
