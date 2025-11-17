import sails from '../src/sails.ts';

const app = sails({
  port: 1337,
  blueprints: { rest: true, shortcuts: true }
});

// Define User model
app.models.set('User', {
  attributes: {
    name: { type: 'string', required: true },
    email: { type: 'string', unique: true },
    age: { type: 'number' }
  }
});

// Auto-generated routes from Blueprints:
// GET /user - find all users
// GET /user/:id - find one user
// POST /user - create user
// PATCH /user/:id - update user
// DELETE /user/:id - delete user

await app.lift();
