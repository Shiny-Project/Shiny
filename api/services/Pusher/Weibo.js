module.exports = {
  /**
   * 发送微博
   * @param text
   * @param id
   * @param pic
   * @param deleteImage
   */
  sendWeibo: async function (text, id = 0, pic = undefined, deleteImage = true) {
    // 微博字数
    const getLength = (str) => {
      const unicodeCharacters = str.match(/[^\x00-\x80]/g) || [];
      const otherCharacters = str.replace(/[^\x00-\x80]/g, "");
      return unicodeCharacters.length + Math.floor(otherCharacters.length / 2);
    };

    // 分隔超长微博
    const splitByLength = (str, length = 110) => {
      const result = [];
      let counter = 0;
      let tempStr = "";
      for (const i of str) {
        counter += getLength(i);
        tempStr += i;
        if (counter >= length) {
          result.push(`${tempStr} https://minyami.net/${id2ShortUrl(id)}`);
          tempStr = "";
          counter = 0;
        }
      }
      if (tempStr.length > 0) {
        result.push(`${tempStr} https://minyami.net/${id2ShortUrl(id)}`);
      }
      if (result.length > 1) {
        // 多条时显示发送序号
        return result.map((v, i) => `(${i + 1}/${result.length}) ${v}`);
      } else {
        return result;
      }
    };

    const id2ShortUrl = (id) => {
      const baseCh = "rstWXYabcdefgzZABCDEFhijklmnopqG012STUV3456789HIJKLMNOPQRuvwxy";
      const base = 62;
      let res = "";
      if(id === 0) return 'r';
      let c = id;
      while(c > 0){
        res = baseCh[c % base] + res;
        c = Math.floor(c / base);
      }
      return res;
    };

    const accessKey = sails.config.common.weibo_access_key;
    const request = require('request-promise');
    const fs = require('fs');

    let retries = 3;
    let errorFlag, errorText, response;

    if (!pic) {
      // 不带图
      // 分隔超长微博
      for (const i of splitByLength(text)) {
        retries = 3;
        // 记录任务
        const job = await Job.create({
          type: 'push',
          info: JSON.stringify({
            channel: 'weibo',
            text: i
          }),
          status: 'processing'
        });
        while (retries > 0) {
          try {
            const result = await request.post({
              url: 'https://api.weibo.com/2/statuses/share.json',
              form: {
                access_token: accessKey,
                status: i
              }
            });
            retries = 0;
            errorFlag = false;
            response = result;
          }
          catch (e) {
            errorFlag = true;
            errorText = e;
            retries--;
            await CommonUtils.sleep(3000); // 冷却三秒
          }
        }
        if (errorFlag) {
          // 记录错误
          await Job.update({
            id: job.id
          }).set({
            status: 'failed',
            info: JSON.stringify({
              ...JSON.parse(job.info),
              error: JSON.stringify(errorText)
            })
          });
        } else {
          // 记录返回结果
          await Job.update({
            id: job.id
          }).set({
            status: 'success',
            info: JSON.stringify({
              ...JSON.parse(job.info),
              response
            })
          });
        }
      }


    } else {
      // 带图
      // 记录任务
      text += ` https://minyami.net/${id2ShortUrl(id)}`;

      const job = await Job.create({
        type: 'push',
        info: JSON.stringify({
          channel: 'weibo',
          text: text
        }),
        status: 'processing'
      });

      retries = 3;
      while (retries > 0) {
        try {
          const result = await request.post({
            url: 'https://api.weibo.com/2/statuses/share.json', formData: {
              access_token: accessKey,
              status: text,
              pic: fs.createReadStream(pic)
            }
          });
          retries = 0;
          errorFlag = false;
          response = result;
        }
        catch (e) {
          errorFlag = true;
          errorText = e;
          retries--;
          await CommonUtils.sleep(3000);
        }
      }

      if (errorFlag) {
        await Job.update({
          id: job.id
        }).set({
          status: 'failed',
          info: JSON.stringify({
            ...JSON.parse(job.info),
            error: JSON.stringify(errorText)
          })
        });
      } else {
        await Job.update({
          id: job.id
        }).set({
          status: 'success',
          info: JSON.stringify({
            ...JSON.parse(job.info),
            response: response
          })
        });
      }
      // 删除图片
      if (deleteImage) {
        fs.unlinkSync(pic);
      }
    }
  },
};
