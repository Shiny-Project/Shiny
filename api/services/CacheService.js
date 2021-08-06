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
}

module.exports = new CacheService();
