/**
 * Example: API Client Library
 * Demonstrates how to interact with the CMS API
 */

export class CMSClient {
  constructor(baseURL, options = {}) {
    this.baseURL = baseURL || 'http://localhost:1337';
    this.apiToken = options.apiToken;
    this.jwt = options.jwt;
    this.headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.apiToken) {
      this.headers['Authorization'] = `Token ${this.apiToken}`;
    } else if (this.jwt) {
      this.headers['Authorization'] = `Bearer ${this.jwt}`;
    }
  }

  /**
   * Make HTTP request
   */
  async request(method, path, data = null) {
    const url = `${this.baseURL}${path}`;
    const options = {
      method,
      headers: this.headers,
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error?.message || 'Request failed');
    }

    return result;
  }

  /**
   * Authentication
   */
  async login(identifier, password) {
    const result = await this.request('POST', '/admin/login', {
      identifier,
      password,
    });

    this.jwt = result.jwt;
    this.headers['Authorization'] = `Bearer ${this.jwt}`;

    return result;
  }

  async register(data) {
    const result = await this.request('POST', '/admin/register', data);

    this.jwt = result.jwt;
    this.headers['Authorization'] = `Bearer ${this.jwt}`;

    return result;
  }

  /**
   * Content Type Operations
   */
  async getContentTypes() {
    return await this.request('GET', '/admin/content-types');
  }

  async getContentType(uid) {
    return await this.request('GET', `/admin/content-types/${uid}`);
  }

  async createContentType(data) {
    return await this.request('POST', '/admin/content-types', data);
  }

  async updateContentType(uid, data) {
    return await this.request('PUT', `/admin/content-types/${uid}`, data);
  }

  async deleteContentType(uid) {
    return await this.request('DELETE', `/admin/content-types/${uid}`);
  }

  /**
   * Content Operations
   */
  content(contentType) {
    return {
      find: async (query = {}) => {
        const params = new URLSearchParams(this.buildQuery(query)).toString();
        return await this.request('GET', `/api/${contentType}?${params}`);
      },

      findOne: async (id) => {
        return await this.request('GET', `/api/${contentType}/${id}`);
      },

      count: async (query = {}) => {
        const params = new URLSearchParams(this.buildQuery(query)).toString();
        return await this.request('GET', `/api/${contentType}/count?${params}`);
      },

      create: async (data) => {
        return await this.request('POST', `/api/${contentType}`, data);
      },

      update: async (id, data) => {
        return await this.request('PUT', `/api/${contentType}/${id}`, data);
      },

      delete: async (id) => {
        return await this.request('DELETE', `/api/${contentType}/${id}`);
      },

      publish: async (id) => {
        return await this.request('POST', `/api/${contentType}/${id}/publish`);
      },

      unpublish: async (id) => {
        return await this.request('POST', `/api/${contentType}/${id}/unpublish`);
      },
    };
  }

  /**
   * GraphQL Operations
   */
  async graphql(query, variables = {}) {
    return await this.request('POST', '/graphql', {
      query,
      variables,
    });
  }

  /**
   * Media Operations
   */
  async uploadMedia(file) {
    const formData = new FormData();
    formData.append('files', file);

    const response = await fetch(`${this.baseURL}/api/upload`, {
      method: 'POST',
      headers: {
        'Authorization': this.headers['Authorization'],
      },
      body: formData,
    });

    return await response.json();
  }

  async getMedia(id) {
    return await this.request('GET', `/api/media/${id}`);
  }

  async deleteMedia(id) {
    return await this.request('DELETE', `/api/media/${id}`);
  }

  /**
   * Query Builder Helpers
   */
  buildQuery(query) {
    const params = {};

    // Filters
    if (query.filters) {
      for (const [key, value] of Object.entries(query.filters)) {
        if (typeof value === 'object') {
          for (const [op, val] of Object.entries(value)) {
            params[`filters[${key}][${op}]`] = val;
          }
        } else {
          params[`filters[${key}]`] = value;
        }
      }
    }

    // Sort
    if (query.sort) {
      params['sort'] = Array.isArray(query.sort) ? query.sort.join(',') : query.sort;
    }

    // Pagination
    if (query.pagination) {
      for (const [key, value] of Object.entries(query.pagination)) {
        params[`pagination[${key}]`] = value;
      }
    }

    // Populate
    if (query.populate) {
      if (Array.isArray(query.populate)) {
        query.populate.forEach((field, index) => {
          params[`populate[${index}]`] = field;
        });
      } else {
        params['populate'] = query.populate;
      }
    }

    // Fields
    if (query.fields) {
      params['fields'] = Array.isArray(query.fields) ? query.fields.join(',') : query.fields;
    }

    return params;
  }
}

/**
 * Usage Examples
 */

// Example 1: Basic Authentication and Content CRUD
async function example1() {
  const client = new CMSClient('http://localhost:1337');

  // Login
  await client.login('admin@example.com', 'password');

  // Create article
  const article = await client.content('articles').create({
    title: 'My First Article',
    content: 'This is the content of my article.',
    published: true,
  });

  console.log('Created article:', article);

  // Get all articles
  const articles = await client.content('articles').find();
  console.log('All articles:', articles);

  // Update article
  const updated = await client.content('articles').update(article.data.id, {
    title: 'Updated Title',
  });

  console.log('Updated article:', updated);

  // Delete article
  await client.content('articles').delete(article.data.id);
}

// Example 2: Advanced Querying
async function example2() {
  const client = new CMSClient('http://localhost:1337', {
    apiToken: 'your-api-token',
  });

  // Complex query
  const articles = await client.content('articles').find({
    filters: {
      title: { $contains: 'JavaScript' },
      published: true,
      views: { $gte: 100 },
    },
    sort: ['-createdAt', 'title'],
    pagination: {
      page: 1,
      pageSize: 10,
    },
    populate: ['author', 'categories'],
    fields: ['title', 'excerpt', 'createdAt'],
  });

  console.log('Filtered articles:', articles);
}

// Example 3: GraphQL Queries
async function example3() {
  const client = new CMSClient('http://localhost:1337', {
    jwt: 'your-jwt-token',
  });

  // GraphQL query
  const result = await client.graphql(`
    query {
      articles(
        filters: { published: { eq: true } }
        sort: "-createdAt"
        pagination: { limit: 5 }
      ) {
        data {
          id
          attributes {
            title
            excerpt
            author {
              data {
                attributes {
                  name
                }
              }
            }
          }
        }
      }
    }
  `);

  console.log('GraphQL result:', result);

  // GraphQL mutation
  const createResult = await client.graphql(`
    mutation CreateArticle($data: ArticleInput!) {
      createArticle(data: $data) {
        data {
          id
          attributes {
            title
          }
        }
      }
    }
  `, {
    data: {
      title: 'New Article',
      content: 'Article content',
    },
  });

  console.log('Created via GraphQL:', createResult);
}

// Example 4: Media Upload
async function example4() {
  const client = new CMSClient('http://localhost:1337', {
    jwt: 'your-jwt-token',
  });

  // Upload file
  const fileInput = document.querySelector('input[type="file"]');
  const file = fileInput.files[0];

  const uploadResult = await client.uploadMedia(file);
  console.log('Uploaded file:', uploadResult);

  // Create article with uploaded image
  const article = await client.content('articles').create({
    title: 'Article with Image',
    content: 'Content here',
    coverImage: uploadResult[0].id,
  });

  console.log('Article with image:', article);
}

// Example 5: Batch Operations
async function example5() {
  const client = new CMSClient('http://localhost:1337', {
    apiToken: 'your-api-token',
  });

  // Create multiple articles
  const articles = await Promise.all([
    client.content('articles').create({ title: 'Article 1', content: 'Content 1' }),
    client.content('articles').create({ title: 'Article 2', content: 'Content 2' }),
    client.content('articles').create({ title: 'Article 3', content: 'Content 3' }),
  ]);

  console.log('Created articles:', articles);

  // Publish all
  await Promise.all(
    articles.map(a => client.content('articles').publish(a.data.id))
  );

  console.log('All articles published');
}

// Example 6: Content Type Management
async function example6() {
  const client = new CMSClient('http://localhost:1337', {
    jwt: 'admin-jwt-token',
  });

  // Create new content type
  const contentType = await client.createContentType({
    singularName: 'product',
    pluralName: 'products',
    displayName: 'Product',
    attributes: {
      name: {
        type: 'string',
        required: true,
      },
      price: {
        type: 'decimal',
        required: true,
      },
      description: {
        type: 'text',
      },
    },
  });

  console.log('Created content type:', contentType);

  // List all content types
  const contentTypes = await client.getContentTypes();
  console.log('All content types:', contentTypes);
}

// Example 7: Error Handling
async function example7() {
  const client = new CMSClient('http://localhost:1337');

  try {
    await client.content('articles').create({
      // Missing required fields
      content: 'Some content',
    });
  } catch (error) {
    console.error('Validation error:', error.message);
  }

  try {
    await client.content('articles').findOne(99999);
  } catch (error) {
    console.error('Not found error:', error.message);
  }
}

// Example 8: Real-time Updates (Polling)
async function example8() {
  const client = new CMSClient('http://localhost:1337');

  let lastUpdate = new Date();

  setInterval(async () => {
    const updates = await client.content('articles').find({
      filters: {
        updatedAt: { $gte: lastUpdate.toISOString() },
      },
    });

    if (updates.data.length > 0) {
      console.log('New updates:', updates.data);
      lastUpdate = new Date();
    }
  }, 5000); // Poll every 5 seconds
}

export {
  example1,
  example2,
  example3,
  example4,
  example5,
  example6,
  example7,
  example8,
};
