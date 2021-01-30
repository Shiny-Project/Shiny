module.exports = {
    checkGitHubWebhookSign: (requestBody, secret, sign) => {
        return !(!requestBody || !secret || !sign);
    },
};
