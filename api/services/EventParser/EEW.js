module.exports = {
    parse: async (event) => {
        const parseResult = [];
        if (event.data.content.match(/强烈摇晃的地区:\n(.+)\n/) === null) {
            return [
                {
                    text: event.data.content,
                },
            ];
        }
        parseResult.push({
            text:
                "紧急地震速报（气象厅）\n" +
                event.data.content.match(/强烈摇晃的地区:\n(.+)\n/)[1].trim() +
                "\n" +
                "请注意强烈摇晃" +
                "\n" +
                `${
                    event.data.forecast?.epicenter
                        ? "震中：" + event.data.forecast.epicenter
                        : ""
                }` +
                `${
                    !!event.data.forecast && !event.data.forecast.plum ? " 预估震级：M" + event.data.forecast.magnitude : ""
                }` +
                `${
                    event.data.forecast?.max_seismic_intensity
                        ? " 预估最大震度：" + event.data.forecast.max_seismic_intensity
                        : ""
                }`,
        });
        parseResult.push({
            special: "eew_notice",
        });
        return parseResult;
    },
};
