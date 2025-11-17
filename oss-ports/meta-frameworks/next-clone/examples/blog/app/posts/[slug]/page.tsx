/**
 * Blog Post Page - Dynamic Route with SSG
 */

import { getPost, getPosts } from '../../../lib/posts';
import { MDXRemote } from 'next-mdx-remote/rsc';
import Image from 'elide-next/image';
import Comments from '../../../components/Comments';
import ShareButtons from '../../../components/ShareButtons';

interface PageProps {
  params: {
    slug: string;
  };
}

export async function generateStaticParams() {
  const posts = await getPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: PageProps) {
  const post = await getPost(params.slug);

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [post.coverImage],
    },
  };
}

export default async function PostPage({ params }: PageProps) {
  const post = await getPost(params.slug);

  return (
    <article className="post">
      <header className="post-header">
        <h1>{post.title}</h1>
        <div className="meta">
          <time dateTime={post.date}>{post.formattedDate}</time>
          <span className="author">By {post.author}</span>
          <span className="reading-time">{post.readingTime} min read</span>
        </div>
      </header>

      {post.coverImage && (
        <div className="cover-image">
          <Image
            src={post.coverImage}
            alt={post.title}
            width={1200}
            height={630}
            priority
            quality={90}
          />
        </div>
      )}

      <div className="content">
        <MDXRemote source={post.content} />
      </div>

      <ShareButtons
        url={`https://example.com/posts/${params.slug}`}
        title={post.title}
      />

      <Comments postId={params.slug} />

      <style jsx>{`
        .post {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
        }

        .post-header {
          margin-bottom: 2rem;
        }

        .post-header h1 {
          font-size: 3rem;
          margin-bottom: 1rem;
          line-height: 1.2;
        }

        .meta {
          display: flex;
          gap: 1rem;
          color: #666;
          font-size: 0.9rem;
        }

        .cover-image {
          margin: 2rem 0;
          border-radius: 8px;
          overflow: hidden;
        }

        .content {
          line-height: 1.8;
          font-size: 1.1rem;
        }

        .content :global(h2) {
          margin-top: 2rem;
          font-size: 2rem;
        }

        .content :global(code) {
          background: #f5f5f5;
          padding: 0.2rem 0.4rem;
          border-radius: 3px;
          font-family: 'Courier New', monospace;
        }

        .content :global(pre) {
          background: #1a1a1a;
          color: #fff;
          padding: 1rem;
          border-radius: 5px;
          overflow-x: auto;
        }
      `}</style>
    </article>
  );
}

export const revalidate = 3600;
