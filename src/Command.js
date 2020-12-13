const getBestScoresData = require("./getBestScoresData");

class Command {
    constructor(message) {
        this.message = message;
        this.helper = "请输入exbp [玩家名] ,[关键词]\n关键词有：map、per、aim、spd、acc、pp";
        this.typeList = ["map", "per", "aim", "spd", "acc", "pp", "all", "chart-cs", "chart-ar", "chart-od", "chart-hp", "chart-stars", "chart-aim", "chart-speed", "chart-acc", "chart-total"];
        this.user = "";
        this.type = "";
    }

    /**
     * 拆出指令和参数
     * @param {RegExp} commandReg 
     * @returns {Boolean} 消息是否符合指令形式
     */
    cutCommand() {
        const mr = /^([a-zA-Z]+)/i.exec(this.message);
        if (mr === null) return false;
        else {
            this.commandString = mr[1].toLowerCase();
            this.argString = this.message.substring(this.commandString.length).trim();
            return true;
        }
    }

    /**
     * 分析argString
     */
    getArgObject() {
        let arr = this.argString.split(",");
        if (arr.length <= 1) {
            arr = this.argString.split("，");
            if (arr.length <= 1) throw "格式不正确\n" + this.helper;
        }
        this.user = arr[0].trim();
        this.type = arr[1].trim().toLocaleLowerCase();
    }

    async apply(stat, host, apiKey, saveDir, bd) {
        try {
            if (!this.cutCommand()) return "";
            if (this.commandString !== "exbp") return "";
            this.getArgObject();
            if (this.typeList.indexOf(this.type) < 0) throw "格式不正确\n" + this.helper;
            if (stat.isbusy) return "请再等等QAQ";
            let bpData = new getBestScoresData(host, apiKey, this.user, saveDir);
            stat.isbusy = true;
            let output = await bpData.output(bd, this.type);
            stat.isbusy = false;
            return output;
        }
        catch (ex) {
            return ex;
        }
    }
}

module.exports = Command;