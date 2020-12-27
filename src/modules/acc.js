"use strict";

const getBestScoresData = require("../getBestScoresData");

module.exports = {
    enabled: true,
    adminCommand: false,
    type: 'acc',
    info: 'acc查询',
    command: ['acc'],
    argsInfo: '[玩家名]',

    call: async (host, apiKey, saveDir, downloader, args) => {
        try {
            const user = args[0];
            if (!user) throw "格式不正确\n请输入exbp " + module.exports.command[0] + ", " + module.exports.argsInfo;
            let exScoreObjects = await new getBestScoresData(host, apiKey, user, saveDir).getBestScoresObject(downloader);
            // 统计出acc区间，最大最小值并绘图
            // 计算每张图acc-fc acc、acc-ss acc，列出提升空间最大的图
            const length = exScoreObjects.length;
            let maxAcc = 0;
            let minAcc = Infinity;
            let maxAccBeatmapTitle = "";
            let totalAcc = 0;
            let maxAccVSFC = 0;
            let maxAccVSSS = 0;
            let maxFCImpAccBeatmapTitle = "";
            let maxSSImpAccBeatmapTitle = "";
            for (let i = 0; i < length; i++) {
                let acc = exScoreObjects[i].pp.acc;
                let accFC = exScoreObjects[i].fcpp.acc;
                let accSS = exScoreObjects[i].sspp.acc;
                let accVSFC = accFC - acc;
                let accVSSS = accSS - acc;
                if (acc > maxAcc) {
                    maxAcc = acc;
                    maxAccBeatmapTitle = exScoreObjects[i].beatmapTitle;
                }
                if (acc < minAcc) minAcc = acc;
                totalAcc += acc;
                if (accVSFC > maxAccVSFC) {
                    maxAccVSFC = accVSFC;
                    maxFCImpAccBeatmapTitle = exScoreObjects[i].beatmapTitle;
                }
                if (accVSSS > maxAccVSSS) {
                    maxAccVSSS = accVSSS;
                    maxSSImpAccBeatmapTitle = exScoreObjects[i].beatmapTitle;
                }
            }
            let output = "\nAcc区间：" + minAcc.toFixed(0) + "~" + maxAcc.toFixed(0) + "，平均值：" + (totalAcc / length).toFixed(0);
            output += "\nAcc最高谱面：" + maxAccBeatmapTitle;
            output += "\n如果FC，Acc可以提升最大：" + maxAccVSFC.toFixed(0) + "，谱面：" + maxFCImpAccBeatmapTitle;
            output += "\n如果SS，Acc可以提升最大：" + maxAccVSSS.toFixed(0) + "，谱面：" + maxSSImpAccBeatmapTitle;
            return output;
        }
        catch (ex) {
            return ex;
        }
    }
};
