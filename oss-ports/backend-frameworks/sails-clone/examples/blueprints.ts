/**
 * Blueprints Example for Sails Clone
 */

import sails from '../src/sails.ts';

const app = sails();

// Enable blueprints for auto-generated REST routes
app.config.set('blueprints.rest', true);
app.config.set('blueprints.shortcuts', true);

// Define a model
const UserModel = {
  attributes: {
    username: { type: 'string', required: true },
    email: { type: 'string', required: true },
    age: { type: 'number' }
  }
};

app.models.set('user', UserModel);

// Blueprints automatically generate:
// GET    /user - Find all
// GET    /user/:id - Find one
// POST   /user - Create
// PUT    /user/:id - Update
// DELETE /user/:id - Delete

app.lift({ port: 3200 });
console.log('Sails Blueprints on :3200');
console.log('Auto-generated routes: GET/POST /user, GET/PUT/DELETE /user/:id');
