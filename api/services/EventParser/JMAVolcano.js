const labels = {
    "11": "等级 1 · 留意活火山", "12": "等级 2 · 火口周边管制",
    "13": "等级 3 · 限制进山", "14": "等级 4 · 老年人等避难", "15": "等级 5 · 避难",
    "21": "留意活火山", "22": "火口周边危险", "23": "进山危险",
    "24": "山麓严格警戒", "25": "居住区严格警戒", "35": "留意海底活火山", "36": "周边海域警戒",
};
const forecastKinds = new Set(["11", "21", "35"]);
const specialKinds = new Set(["14", "15", "24", "25"]);
const infoTypes = { 発表: 0, 訂正: 1, 取消: 2 };

function timestamp(value) {
    if (typeof value !== "string" || !/(Z|[+-]\d{2}:\d{2})$/.test(value) || !Number.isFinite(Date.parse(value))) {
        throw new Error("火山电文时间无效或缺少时区");
    }
    return new Date(value).toISOString();
}

function comparePublications(left, right) {
    return timestamp(left.time).localeCompare(timestamp(right.time)) ||
        infoTypes[left.warning.infoType] - infoTypes[right.warning.infoType];
}

async function restoreCancellation(event, source) {
    const rows = await DataTimeSeries.find({ key: `jma_volcano_${source.code}` }).sort("id desc");
    const records = rows.map((row) => ({ id: row.id, data: JSON.parse(row.data) }));
    const current = records.find((record) => record.data.hash === event.hash);
    let previous = null;
    for (const record of records) {
        const candidate = record.data;
        if (candidate.hash === event.hash || candidate.code !== source.code ||
            candidate.warning.status !== source.warning.status || candidate.warning.infoType === "取消" ||
            !candidate.warning.volcano) continue;
        const order = comparePublications(candidate, source);
        if (order > 0 || (order === 0 && current && record.id >= current.id)) continue;
        if (!previous || comparePublications(candidate, previous) > 0) previous = candidate;
    }
    if (!previous) return null;
    const warning = JSON.parse(JSON.stringify(previous.warning));
    warning.status = source.warning.status;
    warning.infoType = "取消";
    const kind = warning.volcano.kind;
    const category = forecastKinds.has(kind) ? "喷火预报" : specialKinds.has(kind) ? "喷火特别警报" : "喷火警报";
    let title = (source.name || previous.name || "火山 " + source.code) + " " + category + "（电文取消）";
    if (warning.status !== "通常") title = { 訓練: "【训练】", 試験: "【试验】" }[warning.status] + title;
    const issued = new Date(Date.parse(timestamp(source.time)) + 9 * 60 * 60 * 1000)
        .toISOString().slice(0, 16).replace(/-/g, "/").replace("T", " ");
    const content = [title, "原电文状态：" + labels[kind], `气象厅 ${issued} 发布（日本时间）`,
        source.headline, source.prevention, source.text].filter(Boolean).join("\n");
    event.level = warning.status !== "通常" || forecastKinds.has(kind) ? 3 : 4;
    event.data = { ...event.data, title, content, warning };
    return warning;
}

module.exports = {
    parse: async (event) => {
        let warning = event.data.warning;
        const source = event.data.volcano_data;
        if (source) {
            warning = source.warning;
            if (!warning.volcano && warning.infoType === "取消") {
                warning = await restoreCancellation(event, source);
            }
        }
        if (!warning?.volcano) return [{ text: event.data.content }];
        const axios = require("axios");
        const response = await axios.post("http://localhost:3000/Map/volcano_warning", {
            warning: JSON.stringify(warning),
        }, { timeout: 30000 });
        if (typeof response.data.path !== "string" || !response.data.path) {
            throw new Error("火山地图未返回图片路径");
        }
        return [{ text: event.data.content, pic: response.data.path }];
    },
};
