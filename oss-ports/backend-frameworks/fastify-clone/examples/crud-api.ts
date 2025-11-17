/**
 * CRUD API Example
 *
 * Complete RESTful API for managing blog posts
 */

import fastify from '../src/fastify.ts';

const app = fastify({ logger: true });

// ==================== DATA MODELS ====================

interface Post {
  id: number;
  title: string;
  content: string;
  author: string;
  tags: string[];
  published: boolean;
  createdAt: string;
  updatedAt: string;
  views: number;
}

interface Comment {
  id: number;
  postId: number;
  author: string;
  content: string;
  createdAt: string;
}

// ==================== IN-MEMORY DATABASE ====================

const posts: Post[] = [
  {
    id: 1,
    title: 'Getting Started with Elide',
    content: 'Elide is a fast and efficient runtime for JavaScript and TypeScript...',
    author: 'John Doe',
    tags: ['elide', 'tutorial', 'javascript'],
    published: true,
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString(),
    views: 150
  },
  {
    id: 2,
    title: 'Building Web APIs',
    content: 'Learn how to build production-ready web APIs...',
    author: 'Jane Smith',
    tags: ['api', 'rest', 'backend'],
    published: true,
    createdAt: new Date('2024-01-02').toISOString(),
    updatedAt: new Date('2024-01-02').toISOString(),
    views: 89
  },
  {
    id: 3,
    title: 'Draft Post',
    content: 'This is a draft post...',
    author: 'John Doe',
    tags: ['draft'],
    published: false,
    createdAt: new Date('2024-01-03').toISOString(),
    updatedAt: new Date('2024-01-03').toISOString(),
    views: 0
  }
];

const comments: Comment[] = [
  {
    id: 1,
    postId: 1,
    author: 'Reader1',
    content: 'Great article!',
    createdAt: new Date('2024-01-01').toISOString()
  },
  {
    id: 2,
    postId: 1,
    author: 'Reader2',
    content: 'Very helpful, thanks!',
    createdAt: new Date('2024-01-02').toISOString()
  }
];

let nextPostId = 4;
let nextCommentId = 3;

// ==================== SCHEMAS ====================

const postSchema = {
  type: 'object',
  properties: {
    id: { type: 'number' },
    title: { type: 'string' },
    content: { type: 'string' },
    author: { type: 'string' },
    tags: { type: 'array', items: { type: 'string' } },
    published: { type: 'boolean' },
    createdAt: { type: 'string' },
    updatedAt: { type: 'string' },
    views: { type: 'number' }
  }
};

const createPostSchema = {
  type: 'object',
  required: ['title', 'content', 'author'],
  properties: {
    title: { type: 'string', minLength: 1, maxLength: 200 },
    content: { type: 'string', minLength: 1 },
    author: { type: 'string', minLength: 1 },
    tags: { type: 'array', items: { type: 'string' } },
    published: { type: 'boolean' }
  }
};

const updatePostSchema = {
  type: 'object',
  properties: {
    title: { type: 'string', minLength: 1, maxLength: 200 },
    content: { type: 'string', minLength: 1 },
    tags: { type: 'array', items: { type: 'string' } },
    published: { type: 'boolean' }
  }
};

// ==================== POST ROUTES ====================

// List all posts with filtering and pagination
app.get('/posts', {
  schema: {
    querystring: {
      type: 'object',
      properties: {
        page: { type: 'number', minimum: 1, default: 1 },
        limit: { type: 'number', minimum: 1, maximum: 100, default: 10 },
        published: { type: 'boolean' },
        author: { type: 'string' },
        tag: { type: 'string' },
        sort: { type: 'string', enum: ['createdAt', 'updatedAt', 'views', 'title'] },
        order: { type: 'string', enum: ['asc', 'desc'] }
      }
    }
  }
}, async (request, reply) => {
  const {
    page = 1,
    limit = 10,
    published,
    author,
    tag,
    sort = 'createdAt',
    order = 'desc'
  } = request.query;

  // Filter posts
  let filtered = [...posts];

  if (published !== undefined) {
    filtered = filtered.filter(p => p.published === published);
  }

  if (author) {
    filtered = filtered.filter(p => p.author.toLowerCase().includes(author.toLowerCase()));
  }

  if (tag) {
    filtered = filtered.filter(p => p.tags.includes(tag));
  }

  // Sort posts
  filtered.sort((a, b) => {
    const aVal = a[sort];
    const bVal = b[sort];
    const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    return order === 'asc' ? comparison : -comparison;
  });

  // Paginate
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedPosts = filtered.slice(startIndex, endIndex);

  return {
    posts: paginatedPosts,
    pagination: {
      page,
      limit,
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / limit)
    }
  };
});

// Get single post by ID
app.get('/posts/:id', {
  schema: {
    params: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string', pattern: '^[0-9]+$' }
      }
    }
  }
}, async (request, reply) => {
  const { id } = request.params;
  const post = posts.find(p => p.id === parseInt(id));

  if (!post) {
    reply.code(404);
    return {
      error: 'Not Found',
      message: `Post with id ${id} not found`
    };
  }

  // Increment views
  post.views++;

  return { post };
});

// Create new post
app.post('/posts', {
  schema: {
    body: createPostSchema,
    response: {
      201: { post: postSchema }
    }
  }
}, async (request, reply) => {
  const { title, content, author, tags = [], published = false } = request.body;

  const newPost: Post = {
    id: nextPostId++,
    title,
    content,
    author,
    tags,
    published,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    views: 0
  };

  posts.push(newPost);

  reply.code(201);
  return { post: newPost };
});

// Update post
app.put('/posts/:id', {
  schema: {
    params: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string', pattern: '^[0-9]+$' }
      }
    },
    body: updatePostSchema
  }
}, async (request, reply) => {
  const { id } = request.params;
  const post = posts.find(p => p.id === parseInt(id));

  if (!post) {
    reply.code(404);
    return {
      error: 'Not Found',
      message: `Post with id ${id} not found`
    };
  }

  const { title, content, tags, published } = request.body;

  if (title !== undefined) post.title = title;
  if (content !== undefined) post.content = content;
  if (tags !== undefined) post.tags = tags;
  if (published !== undefined) post.published = published;

  post.updatedAt = new Date().toISOString();

  return { post };
});

// Partial update (PATCH)
app.patch('/posts/:id', {
  schema: {
    params: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string', pattern: '^[0-9]+$' }
      }
    },
    body: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        content: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
        published: { type: 'boolean' }
      }
    }
  }
}, async (request, reply) => {
  const { id } = request.params;
  const post = posts.find(p => p.id === parseInt(id));

  if (!post) {
    reply.code(404);
    return {
      error: 'Not Found',
      message: `Post with id ${id} not found`
    };
  }

  // Only update provided fields
  Object.assign(post, request.body, {
    updatedAt: new Date().toISOString()
  });

  return { post };
});

// Delete post
app.delete('/posts/:id', {
  schema: {
    params: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string', pattern: '^[0-9]+$' }
      }
    }
  }
}, async (request, reply) => {
  const { id } = request.params;
  const index = posts.findIndex(p => p.id === parseInt(id));

  if (index === -1) {
    reply.code(404);
    return {
      error: 'Not Found',
      message: `Post with id ${id} not found`
    };
  }

  const deletedPost = posts.splice(index, 1)[0];

  // Also delete associated comments
  const deletedComments = comments.filter(c => c.postId === deletedPost.id);
  comments.splice(0, comments.length, ...comments.filter(c => c.postId !== deletedPost.id));

  return {
    success: true,
    message: 'Post deleted',
    deletedPost: {
      id: deletedPost.id,
      title: deletedPost.title
    },
    deletedComments: deletedComments.length
  };
});

// ==================== COMMENT ROUTES ====================

// Get comments for a post
app.get('/posts/:id/comments', async (request, reply) => {
  const { id } = request.params;
  const postId = parseInt(id);

  const post = posts.find(p => p.id === postId);
  if (!post) {
    reply.code(404);
    return {
      error: 'Not Found',
      message: `Post with id ${id} not found`
    };
  }

  const postComments = comments.filter(c => c.postId === postId);

  return {
    postId,
    comments: postComments,
    total: postComments.length
  };
});

// Add comment to post
app.post('/posts/:id/comments', {
  schema: {
    body: {
      type: 'object',
      required: ['author', 'content'],
      properties: {
        author: { type: 'string', minLength: 1 },
        content: { type: 'string', minLength: 1 }
      }
    }
  }
}, async (request, reply) => {
  const { id } = request.params;
  const postId = parseInt(id);

  const post = posts.find(p => p.id === postId);
  if (!post) {
    reply.code(404);
    return {
      error: 'Not Found',
      message: `Post with id ${id} not found`
    };
  }

  const { author, content } = request.body;

  const newComment: Comment = {
    id: nextCommentId++,
    postId,
    author,
    content,
    createdAt: new Date().toISOString()
  };

  comments.push(newComment);

  reply.code(201);
  return { comment: newComment };
});

// Delete comment
app.delete('/comments/:id', async (request, reply) => {
  const { id } = request.params;
  const commentId = parseInt(id);

  const index = comments.findIndex(c => c.id === commentId);

  if (index === -1) {
    reply.code(404);
    return {
      error: 'Not Found',
      message: `Comment with id ${id} not found`
    };
  }

  const deletedComment = comments.splice(index, 1)[0];

  return {
    success: true,
    message: 'Comment deleted',
    deletedComment: {
      id: deletedComment.id,
      content: deletedComment.content.substring(0, 50)
    }
  };
});

// ==================== STATISTICS ====================

app.get('/stats', async (request, reply) => {
  const totalPosts = posts.length;
  const publishedPosts = posts.filter(p => p.published).length;
  const draftPosts = posts.filter(p => !p.published).length;
  const totalComments = comments.length;
  const totalViews = posts.reduce((sum, p) => sum + p.views, 0);

  const topPosts = [...posts]
    .sort((a, b) => b.views - a.views)
    .slice(0, 5)
    .map(p => ({ id: p.id, title: p.title, views: p.views }));

  const authorStats = posts.reduce((acc, post) => {
    acc[post.author] = (acc[post.author] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    posts: {
      total: totalPosts,
      published: publishedPosts,
      draft: draftPosts
    },
    comments: {
      total: totalComments,
      averagePerPost: (totalComments / totalPosts).toFixed(2)
    },
    views: {
      total: totalViews,
      averagePerPost: (totalViews / totalPosts).toFixed(2)
    },
    topPosts,
    authorStats
  };
});

// Start server
app.listen({ port: 3006 }, (err, address) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  console.log(`\n🚀 Server ready at ${address}`);
  console.log(`\nCRUD API endpoints:`);
  console.log(`  GET    ${address}/posts - List all posts (with filtering)`);
  console.log(`  GET    ${address}/posts/:id - Get single post`);
  console.log(`  POST   ${address}/posts - Create new post`);
  console.log(`  PUT    ${address}/posts/:id - Update post`);
  console.log(`  PATCH  ${address}/posts/:id - Partial update`);
  console.log(`  DELETE ${address}/posts/:id - Delete post`);
  console.log(`  GET    ${address}/posts/:id/comments - Get comments`);
  console.log(`  POST   ${address}/posts/:id/comments - Add comment`);
  console.log(`  DELETE ${address}/comments/:id - Delete comment`);
  console.log(`  GET    ${address}/stats - API statistics\n`);
  console.log(`Example queries:`);
  console.log(`  ${address}/posts?published=true&limit=5`);
  console.log(`  ${address}/posts?author=john&sort=views&order=desc\n`);
});
