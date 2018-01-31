/**
 * JobController
 *
 * @description :: Server-side logic for managing Jobs
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
	query: async (request, response) => {
        let result = await Spider.find();
        let needFresh = [];
        let jobs = [];
        for (let spider of result){
          let spiderInfo = JSON.parse(spider.info);
          if ((new Date() - new Date(spider.trigger_time))/1000 > spiderInfo.expires){
            needFresh.push(spider);
          }
        }
        for (let spider of needFresh) {
            // 查询是否已经有任务
            let createdJobs = await Job.find({
                where: {
                    spider: spider.name,
                    status: 'processing'
                }
            });
            let hasJobProcessingFlag = false;
            for (let createdJob of createdJobs) {
                if ((new Date() - new Date(createdJob.createdAt)) / 1000 > 300) {
                    // 有已经处理了五分钟的任务 认定为超时
                    await Job.update({
                        id: createdJob.id
                    }, {
                        status: 'timeout'
                    });
                    // 五分钟之内下发过该任务 认定为仍在处理中
                    hasJobProcessingFlag = true;
                }
            }
            if (hasJobProcessingFlag) {
                // 有仍在处理中的任务，不再下发
                continue;
            }
            // 建立新的任务
            let newJob = {};
            newJob.type = "data_refresh";
            newJob.spider = spider.name;
            newJob.path = spider.path;
            try {
                // 把新的任务记录到数据库
                let result = await Job.create(newJob);
                newJob.id = result.id;
                jobs.push(newJob);
            }
            catch(e) {
                return response.error(500, "database_error", "数据库读写错误");
            }
        }
        return response.success(jobs);
    }
};

