import { application } from '../src/adonis.ts';

const app = application();

app.config.set('app.port', 3333);
app.config.set('app.host', '0.0.0.0');

// Example MVC structure with Lucid ORM
// Define models, controllers, and routes

await app.start();
