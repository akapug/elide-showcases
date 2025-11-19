import polka from '../src/polka.ts';

const app = polka();

// Middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next && next();
});

// Routes
app.get('/', (req, res) => {
  res.send('Hello from Polka Clone!');
});

app.get('/users/:id', (req, res) => {
  res.json({ userId: req.params.id, name: `User ${req.params.id}` });
});

app.post('/data', (req, res) => {
  res.json({ received: req.body });
});

app.listen(3000);
