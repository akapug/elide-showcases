/**
 * Kafka Admin API Example
 */

import { Kafka } from '../src';

async function main() {
  const kafka = new Kafka({
    clientId: 'admin-example',
    brokers: ['localhost:9092'],
  });

  const admin = kafka.admin();

  try {
    await admin.connect();
    console.log('Admin client connected');

    // Create topics
    console.log('Creating topics...');
    await admin.createTopics({
      topics: [
        {
          topic: 'user-events',
          numPartitions: 3,
          replicationFactor: 1,
          configEntries: [
            { name: 'retention.ms', value: '604800000' }, // 7 days
            { name: 'compression.type', value: 'snappy' },
          ],
        },
        {
          topic: 'order-events',
          numPartitions: 5,
          replicationFactor: 1,
        },
        {
          topic: 'analytics',
          numPartitions: 10,
          replicationFactor: 1,
        },
      ],
    });

    console.log('Topics created successfully');

    // List topics
    const topics = await admin.listTopics();
    console.log('Available topics:', topics);

    // Fetch topic metadata
    const metadata = await admin.fetchTopicMetadata({
      topics: ['user-events', 'order-events'],
    });

    console.log('Topic metadata:');
    for (const topic of metadata.topics) {
      console.log(`  ${topic.name}:`);
      console.log(`    Partitions: ${topic.partitions.length}`);
      topic.partitions.forEach(p => {
        console.log(`      Partition ${p.partitionId}: Leader ${p.leader}, Replicas: ${p.replicas.join(',')}`);
      });
    }

    // Describe cluster
    const cluster = await admin.describeCluster();
    console.log('\nCluster information:');
    console.log(`  Controller: ${cluster.controllerId}`);
    console.log('  Brokers:');
    cluster.brokers.forEach(broker => {
      console.log(`    ${broker.nodeId}: ${broker.host}:${broker.port}`);
    });

    // Fetch offsets for consumer group
    const offsets = await admin.fetchOffsets({
      groupId: 'my-consumer-group',
      topics: ['user-events'],
    });

    console.log('\nConsumer group offsets:');
    offsets.forEach(topicOffsets => {
      console.log(`  Topic: ${topicOffsets.topic}`);
      topicOffsets.partitions.forEach(p => {
        console.log(`    Partition ${p.partition}: Offset ${p.offset}`);
      });
    });

    // Describe configs
    const configs = await admin.describeConfigs({
      resources: [
        {
          type: 2, // TOPIC
          name: 'user-events',
        },
      ],
    });

    console.log('\nTopic configurations:');
    configs.resources.forEach(resource => {
      console.log(`  Resource: ${resource.resourceName}`);
      resource.configEntries.forEach(entry => {
        console.log(`    ${entry.configName}: ${entry.configValue} (default: ${entry.isDefault})`);
      });
    });

    // List consumer groups
    const groups = await admin.listGroups();
    console.log('\nConsumer groups:', groups);

    // Create partitions
    console.log('\nAdding partitions to topic...');
    await admin.createPartitions({
      topicPartitions: [
        {
          topic: 'user-events',
          count: 5,
        },
      ],
    });

    console.log('Partitions added successfully');

    // Clean up - delete topics
    console.log('\nDeleting topics...');
    await admin.deleteTopics({
      topics: ['analytics'],
    });

    console.log('Topic deleted successfully');
  } catch (error) {
    console.error('Admin error:', error);
  } finally {
    await admin.disconnect();
    console.log('Admin client disconnected');
  }
}

main().catch(console.error);
