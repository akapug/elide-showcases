/**
 * Policies Example for Sails Clone
 */

import sails from '../src/sails.ts';

const app = sails();

// Define policies
const isAuthenticated = (req: any, res: any, next: any) => {
  const token = req.headers['authorization'];
  
  if (token === 'Bearer valid-token') {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

const isAdmin = (req: any, res: any, next: any) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Forbidden' });
  }
};

// Apply policies to routes
app.policies.set('UserController', {
  find: ['isAuthenticated'],
  create: ['isAuthenticated', 'isAdmin'],
  update: ['isAuthenticated', 'isAdmin'],
  destroy: ['isAuthenticated', 'isAdmin']
});

app.lift({ port: 3200 });
console.log('Sails Policies on :3200');
