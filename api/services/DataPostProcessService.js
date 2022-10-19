class DataPostProcessService {
    async doPostProcess(event) {
        const { publisher, data } = event;
        const parsedData = JSON.parse(data);
        if (publisher === "JMATyphoon") {
            const { typhoon_data } = parsedData || {};
            const { current } = typhoon_data || {};
            const { number } = current || {};
            try {
                await DataTimeSeries.create({
                    key: `jma_typhoon_${number}`,
                    data: JSON.stringify(typhoon_data),
                });
            } catch (e) {
                Sentry.captureException(e);
            }
        }
    }
}

module.exports = new DataPostProcessService();
