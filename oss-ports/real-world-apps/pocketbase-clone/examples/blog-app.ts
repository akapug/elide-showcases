/**
 * Example: Blog Application
 * A complete blog with posts, comments, and user authentication
 */

import { createServer } from '../src/index.js';

async function setupBlogApp() {
  console.log('Setting up blog application...\n');

  // Create server
  const server = await createServer({
    port: 8090,
    dbPath: './examples/blog-data.db',
    storagePath: './examples/blog-storage',
  });

  const { collections, records, auth } = server;

  try {
    // Create users collection
    console.log('Creating users collection...');
    await collections.createCollection({
      name: 'users',
      type: 'auth',
      options: {
        allowEmailAuth: true,
        allowUsernameAuth: true,
        minPasswordLength: 8,
      },
      schema: [
        {
          id: 'name',
          name: 'name',
          type: 'text',
          required: true,
        },
        {
          id: 'bio',
          name: 'bio',
          type: 'text',
        },
        {
          id: 'avatar',
          name: 'avatar',
          type: 'file',
          options: {
            maxSize: 5242880, // 5MB
            mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
            thumbs: ['100x100', '200x200'],
          },
        },
      ],
      listRule: '',
      viewRule: '',
      createRule: null, // Only via registration
    });

    // Create posts collection
    console.log('Creating posts collection...');
    await collections.createCollection({
      name: 'posts',
      type: 'base',
      schema: [
        {
          id: 'title',
          name: 'title',
          type: 'text',
          required: true,
          options: { min: 3, max: 200 },
        },
        {
          id: 'slug',
          name: 'slug',
          type: 'text',
          required: true,
          unique: true,
        },
        {
          id: 'content',
          name: 'content',
          type: 'text',
          required: true,
        },
        {
          id: 'excerpt',
          name: 'excerpt',
          type: 'text',
        },
        {
          id: 'featuredImage',
          name: 'featuredImage',
          type: 'file',
          options: {
            maxSize: 10485760, // 10MB
            mimeTypes: ['image/*'],
            thumbs: ['400x300', '800x600'],
          },
        },
        {
          id: 'author',
          name: 'author',
          type: 'relation',
          required: true,
          options: {
            collectionId: 'users',
            maxSelect: 1,
          },
        },
        {
          id: 'tags',
          name: 'tags',
          type: 'select',
          options: {
            values: ['Technology', 'Programming', 'Design', 'Business', 'Lifestyle'],
            maxSelect: 5,
          },
        },
        {
          id: 'published',
          name: 'published',
          type: 'bool',
        },
        {
          id: 'publishedAt',
          name: 'publishedAt',
          type: 'date',
        },
        {
          id: 'views',
          name: 'views',
          type: 'number',
          options: { onlyInt: true, min: 0 },
        },
      ],
      indexes: ['author', 'published', 'publishedAt', 'slug'],
      listRule: 'published = true',
      viewRule: 'published = true || author = auth.id',
      createRule: 'auth.id != null',
      updateRule: 'author = auth.id',
      deleteRule: 'author = auth.id',
    });

    // Create comments collection
    console.log('Creating comments collection...');
    await collections.createCollection({
      name: 'comments',
      type: 'base',
      schema: [
        {
          id: 'post',
          name: 'post',
          type: 'relation',
          required: true,
          options: {
            collectionId: 'posts',
            maxSelect: 1,
            cascadeDelete: true,
          },
        },
        {
          id: 'author',
          name: 'author',
          type: 'relation',
          required: true,
          options: {
            collectionId: 'users',
            maxSelect: 1,
          },
        },
        {
          id: 'content',
          name: 'content',
          type: 'text',
          required: true,
          options: { min: 1, max: 500 },
        },
        {
          id: 'parentComment',
          name: 'parentComment',
          type: 'relation',
          options: {
            collectionId: 'comments',
            maxSelect: 1,
          },
        },
      ],
      indexes: ['post', 'author'],
      listRule: '',
      viewRule: '',
      createRule: 'auth.id != null',
      updateRule: 'author = auth.id',
      deleteRule: 'author = auth.id',
    });

    // Create likes collection
    console.log('Creating likes collection...');
    await collections.createCollection({
      name: 'likes',
      type: 'base',
      schema: [
        {
          id: 'post',
          name: 'post',
          type: 'relation',
          required: true,
          options: {
            collectionId: 'posts',
            maxSelect: 1,
            cascadeDelete: true,
          },
        },
        {
          id: 'user',
          name: 'user',
          type: 'relation',
          required: true,
          options: {
            collectionId: 'users',
            maxSelect: 1,
          },
        },
      ],
      indexes: ['post', 'user', 'post,user'],
      listRule: '',
      viewRule: '',
      createRule: 'auth.id != null && user = auth.id',
      deleteRule: 'user = auth.id',
    });

    console.log('\n✓ Blog application setup complete!');
    console.log('\nCollections created:');
    console.log('  - users (auth)');
    console.log('  - posts');
    console.log('  - comments');
    console.log('  - likes');

    console.log('\nExample API Usage:');
    console.log('\n1. Register a user:');
    console.log('   POST /api/collections/users/auth-with-password');
    console.log('   Body: { email, password, passwordConfirm, name }');

    console.log('\n2. Create a post:');
    console.log('   POST /api/records/posts');
    console.log('   Headers: Authorization: Bearer TOKEN');
    console.log('   Body: { title, slug, content, author, published }');

    console.log('\n3. List published posts:');
    console.log('   GET /api/records/posts?filter=published=true&sort=-publishedAt');

    console.log('\n4. Add a comment:');
    console.log('   POST /api/records/comments');
    console.log('   Headers: Authorization: Bearer TOKEN');
    console.log('   Body: { post, author, content }');

    console.log('\n5. Like a post:');
    console.log('   POST /api/records/likes');
    console.log('   Headers: Authorization: Bearer TOKEN');
    console.log('   Body: { post, user }');

    console.log('\nServer running at http://localhost:8090');
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      console.log('\n✓ Collections already exist, server ready!');
      console.log('Server running at http://localhost:8090');
    } else {
      throw error;
    }
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupBlogApp().catch(console.error);
}

export { setupBlogApp };
