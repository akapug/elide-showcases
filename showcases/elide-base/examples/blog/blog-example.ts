/**
 * ElideBase - Blog Example
 *
 * A complete blog application built with ElideBase showing:
 * - Posts, comments, categories
 * - User authentication
 * - File uploads for images
 * - Real-time comments
 * - ML-powered content categorization (Python hook)
 * - Email notifications (Ruby hook)
 */

import { SQLiteDatabase } from '../../database/sqlite';
import { SchemaManager, CollectionSchema } from '../../database/schema';
import { RestAPI } from '../../api/rest-api';
import { RealtimeServer } from '../../api/realtime';
import { FileStorage } from '../../api/files';
import { UserManager } from '../../auth/users';
import { TokenManager } from '../../auth/tokens';

// Initialize database
const db = new SQLiteDatabase({ filename: './examples/blog/blog.db' });
const schema = new SchemaManager(db);

// Define blog schema
const postsSchema: CollectionSchema = {
  name: 'posts',
  fields: [
    { name: 'title', type: 'text', options: { required: true, min: 5 } },
    { name: 'slug', type: 'text', options: { required: true, unique: true } },
    { name: 'content', type: 'text', options: { required: true } },
    { name: 'excerpt', type: 'text' },
    { name: 'featured_image', type: 'file' },
    { name: 'author_id', type: 'relation', relation: { collection: 'users' } },
    { name: 'category_id', type: 'relation', relation: { collection: 'categories' } },
    { name: 'status', type: 'text', options: { default: 'draft' } },
    { name: 'published_at', type: 'date' },
    { name: 'view_count', type: 'number', options: { default: 0 } }
  ],
  indexes: [['author_id'], ['category_id'], ['status'], ['published_at']],
  hooks: {
    afterCreate: 'python:ml_prediction', // Categorize content with ML
    afterUpdate: 'ruby:notify_subscribers' // Send email to subscribers
  }
};

const categoriesSchema: CollectionSchema = {
  name: 'categories',
  fields: [
    { name: 'name', type: 'text', options: { required: true, unique: true } },
    { name: 'slug', type: 'text', options: { required: true, unique: true } },
    { name: 'description', type: 'text' },
    { name: 'color', type: 'text', options: { default: '#3498db' } }
  ]
};

const commentsSchema: CollectionSchema = {
  name: 'comments',
  fields: [
    { name: 'post_id', type: 'relation', relation: { collection: 'posts' }, options: { required: true } },
    { name: 'author_id', type: 'relation', relation: { collection: 'users' } },
    { name: 'content', type: 'text', options: { required: true } },
    { name: 'parent_id', type: 'relation', relation: { collection: 'comments' } },
    { name: 'status', type: 'text', options: { default: 'approved' } }
  ],
  indexes: [['post_id'], ['author_id']],
  hooks: {
    afterCreate: 'ruby:notify_post_author' // Notify post author of new comment
  }
};

// Register collections
schema.registerCollection(postsSchema);
schema.registerCollection(categoriesSchema);
schema.registerCollection(commentsSchema);

// Initialize services
const userManager = new UserManager(db);
const tokenManager = new TokenManager(db);
const restAPI = new RestAPI(db, schema);
const realtime = new RealtimeServer(db, schema);
const fileStorage = new FileStorage(db, {
  baseDir: './examples/blog/storage',
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif']
});

/**
 * Example: Create a blog post
 */
async function createBlogPost() {
  console.log('\n--- Creating Blog Post ---');

  // Register user
  const user = await userManager.register({
    email: 'author@blog.com',
    password: 'password123',
    username: 'johndoe'
  });

  // Create category
  const categoryRequest = {
    method: 'POST',
    path: '/api/collections/categories',
    query: {},
    body: {
      name: 'Technology',
      slug: 'technology',
      description: 'Posts about technology and programming'
    },
    headers: {}
  };

  const categoryResponse = await restAPI.handle(categoryRequest);
  const category = categoryResponse.body;

  console.log('Created category:', category.name);

  // Upload featured image
  const imageBuffer = Buffer.from('fake-image-data');
  const image = await fileStorage.upload(imageBuffer, 'featured.jpg', 'image/jpeg', {
    userId: user.id
  });

  console.log('Uploaded image:', image.filename);

  // Create blog post
  const postRequest = {
    method: 'POST',
    path: '/api/collections/posts',
    query: {},
    body: {
      title: 'Getting Started with ElideBase',
      slug: 'getting-started-with-elidebase',
      content: `ElideBase is a powerful backend-in-a-file solution that combines
        the simplicity of PocketBase with polyglot hooks. You can write your
        backend logic in Python for ML, Ruby for background jobs, or Java for
        enterprise integrations - all in a single binary!`,
      excerpt: 'Learn how to build apps with ElideBase',
      featured_image: image.id,
      author_id: user.id,
      category_id: category.id,
      status: 'published',
      published_at: new Date().toISOString()
    },
    headers: {},
    user
  };

  const postResponse = await restAPI.handle(postRequest);
  const post = postResponse.body;

  console.log('Created post:', post.title);
  console.log('ML Hook will categorize content automatically');

  return { user, category, post };
}

/**
 * Example: Add comments with real-time updates
 */
async function addCommentWithRealtime(postId: string, userId: string) {
  console.log('\n--- Adding Comment with Real-time ---');

  // Simulate WebSocket client
  const client = {
    id: 'client-1',
    userId,
    send: (data: any) => {
      console.log('Real-time update:', JSON.stringify(data, null, 2));
    },
    close: () => {}
  };

  // Register client for real-time updates
  realtime.registerClient(client);

  // Subscribe to comments for this post
  realtime.handleMessage(client.id, {
    type: 'subscribe',
    collection: 'comments',
    filter: `post_id=${postId}`
  });

  // Create comment
  const commentRequest = {
    method: 'POST',
    path: '/api/collections/comments',
    query: {},
    body: {
      post_id: postId,
      author_id: userId,
      content: 'Great article! ElideBase looks amazing.',
      status: 'approved'
    },
    headers: {}
  };

  const commentResponse = await restAPI.handle(commentRequest);
  const comment = commentResponse.body;

  // Broadcast to real-time subscribers
  realtime.broadcast({
    type: 'create',
    collection: 'comments',
    record: comment,
    timestamp: Date.now()
  });

  console.log('Comment created and broadcasted to subscribers');
  console.log('Ruby Hook will notify post author via email');

  return comment;
}

/**
 * Example: List posts with pagination and filtering
 */
async function listPosts() {
  console.log('\n--- Listing Posts ---');

  const request = {
    method: 'GET',
    path: '/api/collections/posts',
    query: {
      page: 1,
      perPage: 10,
      sort: '-published_at',
      filter: 'status=published',
      expand: 'author_id,category_id'
    },
    headers: {}
  };

  const response = await restAPI.handle(request);

  console.log('Found posts:', response.body.totalItems);
  console.log('Posts:', JSON.stringify(response.body.items, null, 2));

  return response.body;
}

/**
 * Example: Search posts
 */
async function searchPosts(query: string) {
  console.log('\n--- Searching Posts ---');

  const request = {
    method: 'GET',
    path: '/api/collections/posts',
    query: {
      filter: `title~${query}`,
      sort: '-view_count'
    },
    headers: {}
  };

  const response = await restAPI.handle(request);

  console.log('Search results:', response.body.totalItems);
  return response.body;
}

/**
 * Run the blog example
 */
async function main() {
  console.log('=== ElideBase Blog Example ===');

  // Create blog post with ML categorization
  const { user, post } = await createBlogPost();

  // Add comment with real-time updates
  await addCommentWithRealtime(post.id, user.id);

  // List posts
  await listPosts();

  // Search posts
  await searchPosts('elidebase');

  console.log('\n=== Blog Example Complete ===');
  console.log('\nFeatures demonstrated:');
  console.log('- Auto-generated REST API');
  console.log('- Real-time subscriptions');
  console.log('- File uploads');
  console.log('- Python ML hooks for categorization');
  console.log('- Ruby email hooks for notifications');
  console.log('- Filtering and pagination');
  console.log('- Relations and expand');
}

// Run example
main().catch(console.error);
