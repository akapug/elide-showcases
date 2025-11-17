/**
 * Posts API endpoint
 */

export default defineEventHandler(async (event) => {
  // Simulate fetching posts
  const posts = [
    {
      slug: 'welcome-to-elide',
      title: 'Welcome to Elide Nuxt',
      excerpt: 'Experience unprecedented performance with Elide',
      date: '2024-01-15',
      author: 'Elide Team',
    },
    {
      slug: 'nuxt-on-steroids',
      title: 'Nuxt on Steroids',
      excerpt: 'How Elide makes Nuxt 10x faster',
      date: '2024-01-10',
      author: 'Elide Team',
    },
    {
      slug: 'polyglot-power',
      title: 'Polyglot Power',
      excerpt: 'Mix JavaScript, Python, and Ruby in one app',
      date: '2024-01-05',
      author: 'Elide Team',
    },
  ];

  return posts;
});
