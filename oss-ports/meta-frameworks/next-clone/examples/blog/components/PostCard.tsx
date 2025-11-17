/**
 * Post Card Component - Client Component
 */

'use client';

import Link from 'elide-next/link';
import Image from 'elide-next/image';
import { useState } from 'react';

interface PostCardProps {
  post: {
    slug: string;
    title: string;
    excerpt: string;
    coverImage?: string;
    date: string;
    author: string;
    readingTime: number;
  };
}

export default function PostCard({ post }: PostCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link href={`/posts/${post.slug}`} className="card-link">
      <article
        className={`post-card ${isHovered ? 'hovered' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {post.coverImage && (
          <div className="image">
            <Image
              src={post.coverImage}
              alt={post.title}
              width={400}
              height={250}
              quality={80}
            />
          </div>
        )}

        <div className="content">
          <h3>{post.title}</h3>
          <p className="excerpt">{post.excerpt}</p>

          <div className="meta">
            <span className="author">{post.author}</span>
            <span className="reading-time">{post.readingTime} min</span>
          </div>
        </div>

        <style jsx>{`
          .post-card {
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            transition: transform 0.2s, box-shadow 0.2s;
          }

          .post-card.hovered {
            transform: translateY(-4px);
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
          }

          .image {
            width: 100%;
            height: 250px;
            overflow: hidden;
          }

          .content {
            padding: 1.5rem;
          }

          .content h3 {
            font-size: 1.5rem;
            margin: 0 0 0.5rem 0;
            color: #333;
          }

          .excerpt {
            color: #666;
            line-height: 1.6;
            margin: 0 0 1rem 0;
          }

          .meta {
            display: flex;
            justify-content: space-between;
            font-size: 0.875rem;
            color: #999;
          }

          .card-link {
            text-decoration: none;
            color: inherit;
          }
        `}</style>
      </article>
    </Link>
  );
}
