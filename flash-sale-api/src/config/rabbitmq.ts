import * as amqp from 'amqplib';
import { appConfig } from './app';

let channel: amqp.Channel;
const EXCHANGE_NAME = 'flash_sale_exchange';

async function connectRabbitMQ() {
    try {
        const connection = await amqp.connect(appConfig.rabbitmqUrl);
        channel = await connection.createChannel();
        try {
            // Try to delete the existing exchange first
            await channel.deleteExchange(EXCHANGE_NAME);
            console.log('Deleted existing exchange');
        } catch (deleteError) {
            // Exchange might not exist, which is fine
            console.log('Exchange does not exist or already deleted');
        }
        // Assert the topic exchange (durable for persistence)
        await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });
        console.log('Connected to RabbitMQ and asserted the durable topic exchange.');
    } catch (error) {
        console.error('Failed to connect to RabbitMQ:', error);
        process.exit(1);
    }
}
async function publishMessage(topic: string, message: string) {
    if (!channel) {
        console.error('Channel is not initialized. Cannot publish.');
        return;
    }
    // Publish with persistent messages
    channel.publish(EXCHANGE_NAME, topic, Buffer.from(message), { persistent: true });
    console.log(`Published persistent message with topic "${topic}": "${message}"`);
}

async function consumeMessages(topic: string, processMessage: (message: any) => Promise<void>) {
    if (!channel) {
        console.error('Channel is not initialized. Cannot consume.');
        return;
    }

    // Create a durable queue for message persistence
    const queueName = `${topic.replace(/\./g, '_')}_queue`;
    const { queue } = await channel.assertQueue(queueName, { 
        durable: true,
        exclusive: false 
    });
    console.log(`Waiting for messages in queue "${queue}" with topic "${topic}"`);

    await channel.bindQueue(queue, EXCHANGE_NAME, topic);

    channel.consume(queue, async (msg) => {
        if (msg) {
            console.log(`Received message with topic "${msg.fields.routingKey}": "${msg.content.toString()}"`);
            try {
                // Parse the message
                const messageData = JSON.parse(msg.content.toString());
                
                // Call the provided process function
                await processMessage(messageData);
                
                // Acknowledge the message only after successful processing
                channel.ack(msg);
                console.log(`Message processed and acknowledged successfully for topic: ${topic}`);
            } catch (error) {
                console.error(`Error processing message for topic ${topic}:`, error);
                // Reject and requeue the message for retry
                channel.nack(msg, false, true);
            }
        }
    }, {
        noAck: false
    });
}
export { connectRabbitMQ, publishMessage, consumeMessages };
