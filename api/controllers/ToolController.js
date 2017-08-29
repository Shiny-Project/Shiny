const { exec } = require('child_process');
const fs = require('fs');
module.exports = {
    parseYouTube: function(request, response){
        let videoId = request.param("videoId");
        if (!videoId){
            return response.error(400, "missing_parameter", "缺少参数");
        }
        if ((videoId.match(/[0-9A-Za-z\-_]+/ig)[0] !== videoId) || videoId.length >= 13){
            // prevent code execution
            return response.error(400, 'invalid_parameter', '参数非法');
        }
        exec(`youtube-dl https://www.youtube.com/watch?v=${videoId} -f best --get-url --get-title --cookies /root/ytbtemp.txt`, (err, stdout, stderr) => {
            let url, title;
            let parsedCookies = [];
            if (stdout.split("\n").length === 3){
                title = stdout.split("\n")[0];
                url = stdout.split("\n")[1];
            }
            try{
                let cookies = fs.readFileSync("/var/www/Shiny/ytbtemp.txt", "utf-8").split("\n").slice(4, 6);
                for (let c of cookies){
                    let t = c.split("\t");
                    parsedCookies.push(`${t[5]}=${t[6]}`);
                }
                return response.success({
                    "title": title,
                    "url": url,
                    "cookies": parsedCookies.join("; ")
                })
            }
            catch(e){
                console.log(e);
                return response.error(500, "unknown_error", "未知错误");
            }
        })
    }
}
