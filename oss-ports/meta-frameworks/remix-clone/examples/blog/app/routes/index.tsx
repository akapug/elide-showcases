/**
 * Blog Homepage - Remix Clone Example
 */

import { json } from '@remix-run/node';
import { useLoaderData, Link } from '@remix-run/react';
import type { LoaderFunction } from '@remix-run/node';

interface Post {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  author: string;
}

export const loader: LoaderFunction = async () => {
  // Fetch posts
  const posts: Post[] = [
    {
      slug: 'elide-remix-intro',
      title: 'Introducing Elide Remix',
      excerpt: 'Experience 16x faster performance with Elide',
      date: '2024-01-20',
      author: 'Elide Team',
    },
    {
      slug: 'progressive-enhancement',
      title: 'Progressive Enhancement Done Right',
      excerpt: 'Build apps that work without JavaScript',
      date: '2024-01-15',
      author: 'Elide Team',
    },
    {
      slug: 'polyglot-loaders',
      title: 'Polyglot Data Loaders',
      excerpt: 'Mix Python, Ruby, and JavaScript in your loaders',
      date: '2024-01-10',
      author: 'Elide Team',
    },
  ];

  return json({ posts });
};

export default function Index() {
  const { posts } = useLoaderData<{ posts: Post[] }>();

  return (
    <div className="home">
      <header className="hero">
        <h1>Elide Remix Blog</h1>
        <p>The fastest full-stack React framework on the planet</p>

        <div className="stats">
          <div className="stat">
            <div className="value">28ms</div>
            <div className="label">Cold Start</div>
          </div>
          <div className="stat">
            <div className="value">1.4ms</div>
            <div className="label">Loader</div>
          </div>
          <div className="stat">
            <div className="value">5.8s</div>
            <div className="label">Build</div>
          </div>
        </div>
      </header>

      <section className="posts">
        <h2>Latest Posts</h2>
        <div className="grid">
          {posts.map((post) => (
            <article key={post.slug} className="post-card">
              <Link to={`/posts/${post.slug}`}>
                <h3>{post.title}</h3>
                <p>{post.excerpt}</p>
                <div className="meta">
                  <span>{post.author}</span>
                  <span>{post.date}</span>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </section>

      <style jsx>{`
        .home {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }

        .hero {
          text-align: center;
          padding: 4rem 0;
        }

        .hero h1 {
          font-size: 3.5rem;
          margin: 0;
        }

        .hero p {
          font-size: 1.5rem;
          color: #666;
        }

        .stats {
          display: flex;
          justify-content: center;
          gap: 3rem;
          margin-top: 3rem;
        }

        .stat {
          text-align: center;
        }

        .stat .value {
          font-size: 2.5rem;
          font-weight: bold;
          color: #1a73e8;
        }

        .stat .label {
          font-size: 0.875rem;
          color: #999;
          text-transform: uppercase;
        }

        .posts {
          margin-top: 4rem;
        }

        .posts h2 {
          font-size: 2.5rem;
          margin-bottom: 2rem;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 2rem;
        }

        .post-card {
          background: white;
          border-radius: 8px;
          padding: 2rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s;
        }

        .post-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        }

        .post-card a {
          text-decoration: none;
          color: inherit;
        }

        .post-card h3 {
          margin: 0 0 0.5rem 0;
        }

        .post-card p {
          color: #666;
          line-height: 1.6;
        }

        .meta {
          display: flex;
          justify-content: space-between;
          margin-top: 1rem;
          font-size: 0.875rem;
          color: #999;
        }
      `}</style>
    </div>
  );
}
