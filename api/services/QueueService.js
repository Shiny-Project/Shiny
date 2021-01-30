const { SendMessageCommand, SQSClient } = require("@aws-sdk/client-sqs");
class QueueService {
    constructor() {
        this.client = new SQSClient({
            credentials: {
                accessKeyId: sails.config.common.AWS_ACCESS_KEY_ID,
                secretAccessKey: sails.config.common.AWS_SECRET_ACCESS_KEY,
            },
            region: sails.config.common.AWS_REGION,
            maxAttempts: 3,
        });
        this.queueUrl = sails.config.common.AWS_SQS_URL;
    }

    async sendMessage(payload) {
        await this.client.send(
            new SendMessageCommand({
                QueueUrl: this.queueUrl,
                MessageBody: JSON.stringify(payload),
            })
        );
    }
}

module.exports = new QueueService();
