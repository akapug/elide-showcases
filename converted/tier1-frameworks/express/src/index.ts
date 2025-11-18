/**
 * Express on Elide
 *
 * Main entry point for Express framework with Elide polyglot capabilities.
 * Provides a factory function that creates Express applications.
 *
 * Usage:
 *   import express from '@elide/express';
 *   const app = express();
 */

import { Application } from './application';
import { Router } from './router';
import { Request } from './request';
import { Response } from './response';

/**
 * Create an Express application
 */
export function express(): Application {
  return new Application();
}

/**
 * Create a new router
 */
express.Router = function(options?: any): Router {
  return new Router(options);
};

/**
 * Expose constructors
 */
express.application = Application.prototype;
express.request = Request.prototype;
express.response = Response.prototype;

/**
 * Expose static middleware
 */
express.static = function(root: string, options?: any) {
  const staticMiddleware = require('./middleware/static').default;
  return staticMiddleware(root, options);
};

/**
 * Expose json middleware
 */
express.json = function(options?: any) {
  const jsonMiddleware = require('./middleware/json').default;
  return jsonMiddleware(options);
};

/**
 * Expose urlencoded middleware
 */
express.urlencoded = function(options?: any) {
  const urlencodedMiddleware = require('./middleware/urlencoded').default;
  return urlencodedMiddleware(options);
};

/**
 * Export types
 */
export { Application, Router, Request, Response };

/**
 * Export as default
 */
export default express;
