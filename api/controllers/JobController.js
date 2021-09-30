/**
 * JobController
 *
 * @description :: Server-side logic for managing Jobs
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
const Sentry = require("@sentry/node");
module.exports = {
    /**
     * 请求当前任务列表
     */
    query: async (request, response) => {
        const spiderList = await Spider.find({
            path: {
                "!=": null,
            },
        });
        const server = request.session.application.tag[0];
        const serverGroup = (server.group && JSON.parse(server.group)) || ["default"];
        const needFresh = [];
        const jobs = [];
        for (let spider of spiderList) {
            // 跳过组标记不同的爬虫
            const spiderGroup = spider.group || "default";
            if (!serverGroup.includes(spiderGroup)) {
                continue;
            }
            let spiderInfo = JSON.parse(spider.info);
            if ((new Date() - new Date(spider.trigger_time)) / 1000 > spiderInfo.expires) {
                // 爬虫超过刷新间隔
                // 检查冷却
                const cooldown = spiderInfo.cooldown || 0; // 默认无冷却
                if (!((new Date() - new Date(spider.last_try)) / 1000 > cooldown)) {
                    // 未冷却完毕
                    continue;
                }
                // 检测是否需要下发凭证
                if (spiderInfo.identity) {
                    const identities = await SpiderIdentity.find({
                        name: spiderInfo.identity,
                    });
                    if (identities.length === 0) {
                        return response.error(500, "missing_spider_identity", "缺少爬虫凭据定义");
                    }
                    // 随机从可用凭据里取一个
                    spider.identity = JSON.parse(identities[Math.floor(Math.random() * identities.length)].identity);
                }
                const spiderEffect = await EffectService.get(`spider_${spider.name}`);
                if (spiderEffect) {
                    spider.effect = spiderEffect;
                }
                needFresh.push(spider);
            }
        }
        for (let spider of needFresh) {
            // 查询是否已经有任务
            const createdJobs = await Job.find({
                where: {
                    spider: spider.name,
                    status: "processing",
                },
            });
            let hasJobProcessingFlag = false;
            for (const createdJob of createdJobs) {
                if ((new Date() - new Date(createdJob.createdAt)) / 1000 > 300) {
                    // 有已经处理了五分钟的任务 认定为超时
                    let result = await Job.update(
                        {
                            id: createdJob.id,
                        },
                        {
                            status: "timeout",
                        }
                    );
                    sails.io.sockets.emit("job", {
                        type: "update",
                        job: result[0],
                    });
                } else {
                    // 五分钟之内下发过该任务 认定为仍在处理中
                    hasJobProcessingFlag = true;
                }
            }
            if (hasJobProcessingFlag) {
                // 有仍在处理中的任务，不再下发
                continue;
            }
            // 建立新的任务
            const newJob = {};
            newJob.type = "data_refresh";
            newJob.spider = spider.name;
            newJob.path = spider.path;
            newJob.status = "processing";
            if (spider.identity) {
                newJob.info = JSON.stringify({
                    identity: spider.identity,
                });
            } else {
                newJob.info = "{}";
            }
            try {
                // 把新的任务记录到数据库
                const result = await Job.create(newJob).fetch();
                newJob.id = result.id;
                jobs.push(newJob);
                // 推送新任务通知
                sails.io.sockets.emit("job", {
                    type: "create",
                    job: result,
                });
                // 记录最后尝试时间
                await Spider.update({
                    id: spider.id,
                })
                    .set({
                        last_try: CommonUtils.generateDateTimeByOffset(0),
                    })
                    .fetch();
            } catch (e) {
                Sentry.captureException(e);
                return response.error(500, "database_error", "数据库读写错误");
            }
        }
        for (const job of jobs) {
            job.info = JSON.parse(job.info);
        }
        return response.success(jobs);
    },
    /**
     * 回报任务处理状态
     */
    report: async (request, response) => {
        let jobId = request.param("jobId");
        let status = request.param("status");
        if (!jobId || !status) {
            return response.error(400, "missing_parameters", "事件缺少必要参数");
        }
        try {
            let result;

            if (status === "success") {
                // 任务完成
                let doneBy;
                if (request.session.application.tag.length > 0) {
                    doneBy = request.session.application.tag[0].name;
                } else {
                    doneBy = "Unknown";
                }
                result = await Job.update({
                    id: jobId,
                })
                    .set({
                        status: status,
                        done_by: doneBy,
                    })
                    .fetch();
                // 更新调用时间
                const job = await Job.findOne({
                    id: jobId,
                });
                const spider = await Spider.findOne({
                    name: job.spider,
                });
                await Spider.update({
                    name: job.spider,
                })
                    .set({
                        trigger_time: CommonUtils.generateDateTimeByOffset(0),
                        trigger_count: parseInt(spider.trigger_count) + 1,
                    })
                    .fetch();
            } else {
                result = await Job.update({
                    id: jobId,
                })
                    .set({
                        status: status,
                    })
                    .fetch();
            }

            sails.io.sockets.emit("job", {
                type: "update",
                job: result[0],
            });
            return response.success(result);
        } catch (e) {
            Sentry.captureException(e);
            return response.error(500, "database_error", "数据库读写错误");
        }
    },
    /**
     * 最近任务
     * @param request
     * @param response
     * @returns {Promise<*>}
     */
    recent: async (request, response) => {
        let page = request.param("page") || 1;
        let types = request.param("types");
        let condition = {};

        if (types) {
            condition["type"] = types.split(",");
        }

        try {
            const total = await Job.count(condition);
            const jobs = await Job.find(condition)
                .sort("id desc")
                .paginate(page - 1, 20);
            jobs.forEach((job) => {
                job.info = JSON.parse(job.info || "{}");
            });

            return response.success({
                total,
                jobs,
            });
        } catch (e) {
            Sentry.captureException(e);
            return response.error(500, "database_error", "数据库读写错误");
        }
    },
};
