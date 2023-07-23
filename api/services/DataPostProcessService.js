class DataPostProcessService {
    async doPostProcess(event) {
        const { publisher, data } = event;
        const parsedData = JSON.parse(data);
        if (publisher === "JMATyphoon") {
            await this.recordJMATyphoon(parsedData);
        }
    }
    async recordJMATyphoon(parsedData) {
        const { typhoon_data } = parsedData || {};
        const { current } = typhoon_data || {};
        const { number } = current || {};
        if (number) {
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
    async recordAlert(parsedData) {
        
    }
}

module.exports = new DataPostProcessService();
