module.exports = {
    parse: async (event) => {
        const encodedData = CommonUtils.encodeBase64(event);
        const path = await CommonUtils.screenshot(
            "http://localhost:1337/push/templates/TsunamiObservation/index.html#" + encodedData,
            "tsunami-observation"
        );

        return [
            {
                text: `【海啸观测情报】`,
                pic: path,
            },
        ];
    },
};
