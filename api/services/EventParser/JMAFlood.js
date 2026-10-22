const specialKinds = new Set(["51", "53"]);
const labels = {
    "10": "泛滥注意报解除", "20": "泛滥注意报", "21": "泛滥注意报", "22": "泛滥注意报",
    "30": "泛滥警报", "31": "泛滥警报", "40": "泛滥危险警报", "41": "泛滥危险警报",
    "51": "泛滥特别警报", "53": "泛滥特别警报（泛滥水预报）",
};
const statuses = new Set(["通常", "訓練", "試験"]);
const infoTypes = { 発表: 0, 訂正: 1, 取消: 2 };
const has = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

function timestamp(value) {
    if (typeof value !== "string" || !/(Z|[+-]\d{2}:\d{2})$/.test(value) || !Number.isFinite(Date.parse(value))) {
        throw new Error("洪水电文时间无效或缺少时区");
    }
    return new Date(value).toISOString();
}

function sourceData(data) {
    if (!data || typeof data.code !== "string" || !/^\d{12}$/.test(data.code) || typeof data.name !== "string" ||
        !statuses.has(data.warning?.status) || !has(infoTypes, data.warning?.infoType) ||
        !Array.isArray(data.warning.rivers) || data.warning.rivers.length > 1 ||
        (!data.warning.rivers.length && data.warning.infoType !== "取消")) {
        throw new Error("洪水电文缺少有效的河川预报区或状态");
    }
    for (const river of data.warning.rivers) {
        if (!river || river.code !== data.code || typeof river.kind !== "string" || !has(labels, river.kind)) {
            throw new Error("洪水电文河川或种类无效");
        }
    }
    if (!Array.isArray(data.details) || !data.details.every((item) => typeof item === "string") ||
        typeof data.headline !== "string" || typeof data.serial !== "string") {
        throw new Error("洪水电文正文或序号无效");
    }
    return { ...data, time: timestamp(data.time), reportTime: timestamp(data.reportTime) };
}

function comparePublications(left, right) {
    return left.time.localeCompare(right.time) ||
        infoTypes[left.warning.infoType] - infoTypes[right.warning.infoType];
}

function resolve(source, previous) {
    const warning = JSON.parse(JSON.stringify(source.warning));
    let name = source.name;
    if (!warning.rivers.length && previous) {
        warning.rivers = previous.warning.rivers;
        name = previous.name;
    }
    const kind = warning.rivers[0]?.kind;
    const previousSpecial = previous?.warning.infoType !== "取消" &&
        previous?.warning.rivers.some((river) => specialKinds.has(river.kind));
    const relatedRevision = previous?.specialRelated && ["訂正", "取消"].includes(warning.infoType);
    const specialRelated = !!kind && !!(specialKinds.has(kind) || previousSpecial || relatedRevision);
    return { source, name, warning, specialRelated };
}

module.exports = {
    parse: async (event) => {
        const code = event.data.flood_data?.code;
        if (!code) return [];
        const rows = await DataTimeSeries.find({ key: `jma_flood_${code}` }).sort("id desc");
        const records = rows.map((row) => ({ id: row.id, data: JSON.parse(row.data) }));
        const current = records.find((record) => record.data.hash === event.hash);
        if (!current) return [];
        const source = sourceData(current.data);
        const seen = new Set([event.hash]);
        const history = [];
        for (const record of records.reverse()) {
            if (seen.has(record.data.hash)) continue;
            seen.add(record.data.hash);
            const previous = sourceData(record.data);
            const order = comparePublications(previous, source);
            if (previous.warning.status === source.warning.status &&
                (order < 0 || (order === 0 && record.id < current.id))) {
                history.push(previous);
            }
        }
        // Rebuild the prior state from raw telegrams; no push decisions are stored in the history table.
        const previous = history.sort(comparePublications).reduce((state, item) => resolve(item, state), null);
        const resolved = resolve(source, previous);
        if (!resolved.specialRelated) return [];
        const { name, warning } = resolved;
        const kind = warning.rivers[0].kind;
        const currentSpecial = specialKinds.has(kind);
        let title = name + " " + (currentSpecial ? labels[kind] : kind === "10" ?
            "泛滥特别警报解除" : "泛滥特别警报降级 · " + labels[kind]);
        if (warning.infoType !== "発表") title += "（" + { 訂正: "订正", 取消: "电文取消" }[warning.infoType] + "）";
        if (warning.status !== "通常") title = { 訓練: "【训练】", 試験: "【试验】" }[warning.status] + title;
        const content = [...new Set([title, source.headline, ...source.details])].filter(Boolean).join("\n");
        event.level = currentSpecial && warning.status === "通常" ? 4 : 3;
        event.data = { ...event.data, title, content, warning };
        const axios = require("axios");
        const response = await axios.post("http://localhost:3000/Map/flood_warning", {
            warning: JSON.stringify(warning),
        }, { timeout: 30000 });
        if (typeof response.data.path !== "string" || !response.data.path) {
            throw new Error("洪水地图未返回图片路径");
        }
        return [{ text: content, pic: response.data.path }];
    },
};
