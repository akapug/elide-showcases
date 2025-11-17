import { RedisCluster } from '../src';

async function main() {
  console.log('=== Redis Cluster Example ===\n');

  const cluster = new RedisCluster({
    nodes: [
      { host: 'node1.redis.local', port: 6379 },
      { host: 'node2.redis.local', port: 6379 },
      { host: 'node3.redis.local', port: 6379 },
      { host: 'node4.redis.local', port: 6379 },
      { host: 'node5.redis.local', port: 6379 },
      { host: 'node6.redis.local', port: 6379 }
    ],
    scaleReads: 'all',
    maxRedirections: 16,
    redisOptions: {
      password: 'cluster-password',
      connectTimeout: 10000
    }
  });

  console.log('Cluster info:', cluster.info);

  console.log('\n--- Basic Operations ---');
  await cluster.set('user:1000', JSON.stringify({
    id: 1000,
    name: 'Alice',
    email: 'alice@example.com'
  }));

  const user = await cluster.get('user:1000');
  console.log('Retrieved user:', JSON.parse(user));

  console.log('\n--- Hash Tags for Multi-Key Operations ---');
  await cluster.set('{user:1000}:profile', 'Profile data');
  await cluster.set('{user:1000}:settings', 'Settings data');
  await cluster.set('{user:1000}:preferences', 'Preferences data');
  
  console.log('All keys with same hash tag stored on same node');

  console.log('\n--- Distributed Counter ---');
  const counters = [];
  for (let i = 0; i < 10; i++) {
    await cluster.set(`counter:${i}`, '0');
    counters.push(`counter:${i}`);
  }

  for (let i = 0; i < 100; i++) {
    const counter = counters[i % counters.length];
    await cluster.sendCommand(['INCR', counter]);
  }

  console.log('Incremented 10 counters 100 times total');

  console.log('\n--- Distributed Sessions ---');
  const sessions = [];
  for (let i = 0; i < 50; i++) {
    const sessionId = `session:${Date.now()}-${i}`;
    await cluster.set(sessionId, JSON.stringify({
      userId: i % 10,
      loginTime: new Date(),
      ip: `192.168.1.${i}`
    }), { EX: 3600 } as any);
    sessions.push(sessionId);
  }

  console.log(`Created ${sessions.length} distributed sessions`);

  console.log('\n--- Cleanup ---');
  for (const session of sessions) {
    await cluster.del(session);
  }

  await cluster.disconnect();
  console.log('\nCluster example complete!');
}

main().catch(console.error);
