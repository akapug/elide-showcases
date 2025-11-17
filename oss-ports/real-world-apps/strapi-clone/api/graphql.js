/**
 * GraphQL API Setup
 * Auto-generated GraphQL API from content types
 */

import { GraphQL, Router } from '@elide/http';
import { GraphQLSchema } from './graphql-schema.js';
import { contentTypeBuilder } from '../content-types/builder.js';
import { logger } from '../core/logger.js';

export function setupGraphQLAPI(config) {
  const router = new Router();
  const graphqlLogger = logger.child('GraphQL');

  if (!config.graphql?.enabled) {
    graphqlLogger.info('GraphQL API disabled');
    return router;
  }

  // Setup GraphQL endpoint
  (async () => {
    try {
      const contentTypes = await contentTypeBuilder.findAll();
      const schema = new GraphQLSchema(contentTypes);
      const executableSchema = schema.build();

      // GraphQL endpoint
      router.post(config.graphql.endpoint || '/graphql', async (req, res) => {
        try {
          const { query, variables, operationName } = req.body;

          const result = await GraphQL.execute({
            schema: executableSchema,
            query,
            variables,
            operationName,
            contextValue: {
              user: req.user,
              request: req,
            },
          });

          res.json(result);
        } catch (error) {
          graphqlLogger.error('GraphQL execution error:', error);
          res.status(500).json({
            errors: [{ message: 'Internal server error' }],
          });
        }
      });

      // GraphQL playground (development only)
      if (config.graphql.playgroundEnabled && config.environment === 'development') {
        router.get(config.graphql.endpoint || '/graphql', (req, res) => {
          res.send(getPlaygroundHTML(config.graphql.endpoint));
        });
      }

      graphqlLogger.info('GraphQL API configured successfully');
    } catch (error) {
      graphqlLogger.error('Failed to setup GraphQL API:', error);
    }
  })();

  return router;
}

function getPlaygroundHTML(endpoint) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>GraphQL Playground</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Open Sans', sans-serif;
    }
    #playground {
      height: 100vh;
    }
  </style>
</head>
<body>
  <div id="playground">Loading...</div>
  <script>
    // Simple GraphQL Playground
    const editorDiv = document.getElementById('playground');
    editorDiv.innerHTML = \`
      <div style="padding: 20px;">
        <h1>GraphQL Playground</h1>
        <p>Send POST requests to ${endpoint} with GraphQL queries.</p>
        <h2>Example Query:</h2>
        <pre style="background: #f5f5f5; padding: 15px; border-radius: 4px;">
query {
  articles {
    id
    title
    content
    author {
      name
    }
  }
}
        </pre>
        <h2>Example Mutation:</h2>
        <pre style="background: #f5f5f5; padding: 15px; border-radius: 4px;">
mutation {
  createArticle(data: {
    title: "My Article"
    content: "Article content"
  }) {
    id
    title
  }
}
        </pre>
      </div>
    \`;
  </script>
</body>
</html>
  `;
}
