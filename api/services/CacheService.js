/**
 * In-memory cache to speedup configuration reading
 */

class InvalidCacheItemError extends Error {}

class CacheService {
    cacheData = {};

    set(key, value, ttl = 1800000) {
        if (!key || value === undefined) {
            throw new InvalidCacheItemError("写入缓存失败：未指定Key或内容无效");
        }
        this.cacheData[key] = {
            value,
            ttl,
            time: Date.now(),
        };
    }

    get(key) {
        if (!key || !this.cacheData[key]) {
            return;
        }
        const item = this.cacheData[key];
        const currentTime = Date.now();
        if (currentTime - item.time >= item.ttl) {
            // 缓存过期
            delete this.cacheData[key];
            return;
        }
        this.cleanup();
        return item.value;
    }

    /**
     * 使特定 key 数据失效
     * @param {string} key
     * @returns
     */
    expire(key) {
        if (this.cacheData[key]) {
            const expiredData = this.cacheData[key];
            delete this.cacheData[key];
            return expiredData;
        }
    }

    /**
     * 定时清理过期数据
     */
    async cleanup() {
        const now = Date.now();
        for (const key of Object.keys(this.cacheData)) {
            if (now - this.cacheData[key].time >= this.cacheData[key].ttl) {
                delete this.cacheData[key];
            }
        }
    }
}

module.exports = new CacheService();
