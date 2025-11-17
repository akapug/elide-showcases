/**
 * Blog Homepage - Elide Next Clone Example
 *
 * Demonstrates:
 * - Server Components
 * - Static Site Generation
 * - MDX integration
 * - Image optimization
 */

import { getPosts } from '../lib/posts';
import PostCard from '../components/PostCard';
import Hero from '../components/Hero';

export const metadata = {
  title: 'Elide Next Blog',
  description: 'A blazing fast blog built with Elide Next',
};

export default async function HomePage() {
  const posts = await getPosts();

  return (
    <main className="container">
      <Hero
        title="Welcome to Elide Next Blog"
        subtitle="Experience the fastest meta-framework on the planet"
        stats={{
          coldStart: '45ms',
          ssr: '4ms',
          buildTime: '8s',
        }}
      />

      <section className="posts-grid">
        <h2>Latest Posts</h2>
        <div className="grid">
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      </section>

      <style jsx>{`
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }

        .posts-grid {
          margin-top: 4rem;
        }

        .posts-grid h2 {
          font-size: 2.5rem;
          margin-bottom: 2rem;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 2rem;
        }
      `}</style>
    </main>
  );
}

// Static generation with revalidation
export const revalidate = 3600; // Revalidate every hour
