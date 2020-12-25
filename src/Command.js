const getBestScoresData = require("./getBestScoresData");

class Command {
    constructor(message) {
        this.message = message;
        this.typeList = ["map", "per", "aim", "spd", "acc", "pp", "chart", "chartc", "date", "info"];
        this.argList = ["cs", "ar", "od", "hp", "stars", "length", "aim", "spd", "acc", "pp"];
        this.typeNeedArg = [0, 0, 0, 0, 0, 0, 1, 1, 0, 2];
        this.helper = "请输入exbp [玩家名] ,[关键词] , ...[其他参数]\n关键词有" + this.typeList.join("、");
        this.user = "";
        this.type = "";
        this.args = [];
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
        let arr = this.argString.split(/,|，|‚/);
        if (arr.length <= 1) throw "格式不正确\n" + this.helper;
        let args = [];
        arr.map((s) => {
            if (s) args.push(s.trim().toLocaleLowerCase());
        });
        this.user = args[0];
        this.type = args[1];
        this.args = args.slice(2); // 不足则为[]
    }

    async apply(stat, host, apiKey, saveDir, bd) {
        try {
            if (!this.cutCommand()) return "";
            if (this.commandString !== "exbp") return "";
            this.getArgObject();
            let typeIndex = this.typeList.indexOf(this.type);
            if (typeIndex < 0) throw "格式不正确\n" + this.helper;
            if (this.typeNeedArg[typeIndex] > this.args.length) {
                if (this.type === "chart") throw "格式不正确\n请输入exbp [玩家名] ,chart, [对应数据]\n数据有" + this.argList.join("、");
                else if (this.type === "chartc") throw "格式不正确\n请输入exbp [玩家名] ,chartc, [aim/spd/acc/pp]";
                else if (this.type === "date") throw "格式不正确\n请输入exbp [玩家名] ,date, [时区，默认为+8]";
                else if (this.type === "info") throw "格式不正确\n请输入exbp [玩家名] ,info, [对应数据], [序号，1-100]\n数据有" + this.argList.join("、");
                else throw "奇怪的错误，请联系Exsper";
            }
            if (stat.isbusy) return "请再等等QAQ";
            let bpData = new getBestScoresData(host, apiKey, this.user, saveDir);
            stat.isbusy = true;
            let output = await bpData.output(bd, this.type, this.args);
            stat.isbusy = false;
            return output;
        }
        catch (ex) {
            return ex;
        }
    }
}

module.exports = Command;