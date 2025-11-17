/**
 * Throttling/Rate Limiting Example for Restify Clone
 */

import restify from '../src/restify.ts';

const server = restify.createServer({ name: 'throttle-api' });

const requests = new Map<string, number[]>();

function rateLimit(max: number, windowMs: number) {
  return (req: any, res: any, next: any) => {
    const ip = req.headers['x-forwarded-for'] || 'unknown';
    const now = Date.now();
    const userRequests = requests.get(ip) || [];
    
    const recentRequests = userRequests.filter(time => now - time < windowMs);
    
    if (recentRequests.length >= max) {
      res.send(429, { error: 'Too many requests' });
      return;
    }
    
    recentRequests.push(now);
    requests.set(ip, recentRequests);
    
    next();
  };
}

server.use(rateLimit(10, 60000));

server.get('/limited', (req, res, next) => {
  res.send({ message: 'Rate limited endpoint' });
});

server.listen(3600, () => {
  console.log('Restify Throttling on :3600');
});
