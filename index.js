const BeatmapDownloader = require("./src/beatmapDownloader");
const Command = require("./src/Command");

class osuexstat {
    /**
     * @param {Object} params 
     * @param {String} params.apiKey osu apiKey，必要
     * @param {String} [params.host] osu网址，默认为"osu.ppy.sh"
     * @param {Array<String>} [params.prefixs] 指令前缀，必须为单个字符，默认为[!,！]
     * @param {String} [params.mapFolder] 谱面存放路径，默认为根目录下的beatmap文件夹
     */
    constructor(params) {
        this.apiKey = params.apiKey || "";
        this.host = params.host || "osu.ppy.sh";
        this.prefixs = params.prefixs || ["!", "！"];
        this.mapFolder = params.mapFolder || './beatmap/';
        this.bd = new BeatmapDownloader(this.mapFolder);
    }

    /**
     * 获得返回消息
     * @param {Number} qqId
     * @param {String} message 输入的消息
     */
    async apply(qqId, message) {
        try {
            if (!message.length || message.length < 2) return "";
            if (this.prefixs.indexOf(message.substring(0, 1)) < 0) return "";
            let commandObject = new Command(message.substring(1).trim());
            let reply = await commandObject.apply(this.host, this.apiKey, this.mapFolder,this.bd);
            return reply;
        } catch (ex) {
            console.log(ex);
            return "";
        }
    }
}

module.exports.osuexstat = osuexstat;
// koishi插件
module.exports.name = 'koishi-plugin-osuexstat';
module.exports.apply = (ctx, options) => {
    const exs = new osuexstat(options);
    ctx.middleware(async (meta, next) => {
        try {
            const message = meta.message;
            const userId = meta.userId;
            let reply = await exs.apply(userId, message);
            if (reply) {
                await meta.$send(`[CQ:at,qq=${userId}]` + '\n' + reply);
            } else return next();
        } catch (ex) {
            console.log(ex);
            return next();
        }
    })
}