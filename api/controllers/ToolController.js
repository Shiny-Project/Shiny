const { exec } = require('child_process');
const fs = require('fs');
module.exports = {
    parseYouTube: function(request, response){
        let videoId = request.param("videoId");
        if (!/([0-9A-Za-z\-_]+)/.test(videoId)){
            // prevent code execution 
            return response.error(400, 'invalid_parameter', '参数非法');
        }
        exec(`youtube-dl https://www.youtube.com/watch?v=${videoId} --get-url --cookies /root/ytbtemp.txt`, (err, stdout, stderr) => {
            let url;
            let parsedCookies = [];
            if (stdout.split("\n").length === 3){
                url = stdout.split("\n")[1];
            }
            try{
                let cookies = fs.readFileSync("/root/ytbtemp.txt", "utf-8").split("\n").slice(4, 6);
                for (let c of cookies){
                    let t = c.split("\t");
                    parsedCookies.push(`${t[5]}=${t[6]}`);
                }
                return response.success({
                    "url": url,
                    "cookies": parsedCookies.join("; ")
                })
            }
            catch(e){
                return response.error(500, "unknown_error", "未知错误");
            }
        })
    }
}