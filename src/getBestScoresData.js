"use strict";

const ScoreObject = require("./score/ScoreObject");
const OsuApi = require("./ApiRequest");
const fs = require('fs');
const Chart = require('lchart');

class getBestScoresData {
    constructor(host, apiKey, user, saveDir) {
        this.host = host;
        this.apiKey = apiKey;
        this.user = user;
        this.saveDir = saveDir;
    }

    async getBestScoresObject() {
        const result = await OsuApi.getUserStdBp(this.user, this.host, this.apiKey);
        if (result.code === 404) throw "查不到" + this.user + "的成绩";
        if (result.code === "error") throw "获取" + this.user + "的成绩出错";
        if ((!Array.isArray(result)) || (result.length <= 0)) throw "查不到" + this.user + "的成绩";
        let scoreObjects = result.map(item => { return new ScoreObject(item, this.saveDir); });
        return scoreObjects;
    }

    // 四维擅长
    async statSummery(exScoreObjects) {
        // 分别统计四维和谱面难度，计算各自平均数
        const length = exScoreObjects.length;
        let maxCS = -Infinity;
        let minCS = Infinity;
        let totalCS = 0;
        let maxAR = -Infinity;
        let minAR = Infinity;
        let totalAR = 0;
        let maxOD = -Infinity;
        let minOD = Infinity;
        let totalOD = 0;
        let maxHP = -Infinity;
        let minHP = Infinity;
        let totalHP = 0;
        let maxStars = 0;
        let minStars = Infinity;
        let totalStars = 0;
        let maxLength = 0;
        let minLength = Infinity;
        let totalLength = 0;
        for (let i = 0; i < length; i++) {
            let cs = exScoreObjects[i].cs;
            let ar = exScoreObjects[i].ar;
            let od = exScoreObjects[i].od;
            let hp = exScoreObjects[i].hp;
            let stars = exScoreObjects[i].stars;
            let applength = exScoreObjects[i].applength;
            if (cs > maxCS) maxCS = cs;
            if (cs < minCS) minCS = cs;
            totalCS += cs;
            if (ar > maxAR) maxAR = ar;
            if (ar < minAR) minAR = ar;
            totalAR += ar;
            if (od > maxOD) maxOD = od;
            if (od < minOD) minOD = od;
            totalOD += od;
            if (hp > maxHP) maxHP = hp;
            if (hp < minHP) minHP = hp;
            totalHP += hp;
            if (stars > maxStars) maxStars = stars;
            if (stars < minStars) minStars = stars;
            totalStars += stars;
            if (applength > maxLength) maxLength = applength;
            if (applength < minLength) minLength = applength;
            totalLength += applength;
        }
        let output = "\nCS区间：" + minCS.toFixed(1) + "~" + maxCS.toFixed(1) + "，平均值：" + (totalCS / length).toFixed(1);
        output += "\nAR区间：" + minAR.toFixed(1) + "~" + maxAR.toFixed(1) + "，平均值：" + (totalAR / length).toFixed(1);
        output += "\nOD区间：" + minOD.toFixed(1) + "~" + maxOD.toFixed(1) + "，平均值：" + (totalOD / length).toFixed(1);
        output += "\nHP区间：" + minHP.toFixed(1) + "~" + maxHP.toFixed(1) + "，平均值：" + (totalHP / length).toFixed(1);
        output += "\n难度区间：" + minStars.toFixed(2) + "★~" + maxStars.toFixed(2) + "★，平均值：" + (totalStars / length).toFixed(2) + "★";
        output += "\n长度（非精确）区间：" + minLength + "秒~" + maxLength + "秒，平均值：" + (totalLength / length).toFixed(1) + "秒";
        return output;
    }

    // pp分配
    async ppAllocation(exScoreObjects) {
        // 计算每张图pp分配，找出3维各自最大比重的那张图
        // 计算总3维和总pp，统计3维总共占百分比
        const length = exScoreObjects.length;
        let maxAimPer = 0;
        let maxAimBeatmapTitle = "";
        let maxSpdPer = 0;
        let maxSpdBeatmapTitle = "";
        let maxAccPer = 0;
        let maxAccBeatmapTitle = "";
        let totalAim = 0;
        let totalSpd = 0;
        let totalAcc = 0;
        let totalPP = 0;
        for (let i = 0; i < length; i++) {
            let aimPer = exScoreObjects[i].pp.aim / exScoreObjects[i].pp.total;
            totalAim += exScoreObjects[i].pp.aim;
            if (aimPer > maxAimPer) {
                maxAimPer = aimPer;
                maxAimBeatmapTitle = exScoreObjects[i].beatmapTitle;
            }
            let spdPer = exScoreObjects[i].pp.speed / exScoreObjects[i].pp.total;
            totalSpd += exScoreObjects[i].pp.speed;
            if (spdPer > maxSpdPer) {
                maxSpdPer = spdPer;
                maxSpdBeatmapTitle = exScoreObjects[i].beatmapTitle;
            }
            let accPer = exScoreObjects[i].pp.acc / exScoreObjects[i].pp.total;
            totalAcc += exScoreObjects[i].pp.acc;
            if (accPer > maxAccPer) {
                maxAccPer = accPer;
                maxAccBeatmapTitle = exScoreObjects[i].beatmapTitle;
            }
            totalPP += exScoreObjects[i].pp.total;
        }
        let output = "\n最高Aim比例：" + (maxAimPer * 100).toFixed(1) + "%，谱面：" + maxAimBeatmapTitle;
        output += "\n最高Speed比例：" + (maxSpdPer * 100).toFixed(1) + "%，谱面：" + maxSpdBeatmapTitle;
        output += "\n最高Acc比例：" + (maxAccPer * 100).toFixed(1) + "%，谱面：" + maxAccBeatmapTitle;
        output += "\n所有bp Aim所占比：" + (totalAim * 100 / totalPP).toFixed(1) + "%";
        output += "\n所有bp Speed所占比：" + (totalSpd * 100 / totalPP).toFixed(1) + "%";
        output += "\n所有bp Acc所占比：" + (totalAcc * 100 / totalPP).toFixed(1) + "%";
        return output;
    }

    // aim
    async aimPP(exScoreObjects) {
        // 统计出aim区间，最大最小值并绘图
        // 计算每张图aim-fc aim、aim-ss aim，列出提升空间最大的图
        const length = exScoreObjects.length;
        let maxAim = 0;
        let minAim = Infinity;
        let maxAimBeatmapTitle = "";
        let totalAim = 0;
        let maxAimVSFC = 0;
        let maxAimVSSS = 0;
        let maxFCImpAimBeatmapTitle = "";
        let maxSSImpAimBeatmapTitle = "";
        for (let i = 0; i < length; i++) {
            let aim = exScoreObjects[i].pp.aim;
            let aimFC = exScoreObjects[i].fcpp.aim;
            let aimSS = exScoreObjects[i].sspp.aim;
            let aimVSFC = aimFC - aim;
            let aimVSSS = aimSS - aim;
            if (aim > maxAim) {
                maxAim = aim;
                maxAimBeatmapTitle = exScoreObjects[i].beatmapTitle;
            }
            if (aim < minAim) minAim = aim;
            totalAim += aim;
            if (aimVSFC > maxAimVSFC) {
                maxAimVSFC = aimVSFC;
                maxFCImpAimBeatmapTitle = exScoreObjects[i].beatmapTitle;
            }
            if (aimVSSS > maxAimVSSS) {
                maxAimVSSS = aimVSSS;
                maxSSImpAimBeatmapTitle = exScoreObjects[i].beatmapTitle;
            }
        }
        let output = "\nAim区间：" + minAim.toFixed(0) + "~" + maxAim.toFixed(0) + "，平均值：" + (totalAim / length).toFixed(0);
        output += "\nAim最高谱面：" + maxAimBeatmapTitle;
        output += "\n如果FC，Aim可以提升最大：" + maxAimVSFC.toFixed(0) + "，谱面：" + maxFCImpAimBeatmapTitle;
        output += "\n如果SS，Aim可以提升最大：" + maxAimVSSS.toFixed(0) + "，谱面：" + maxSSImpAimBeatmapTitle;
        return output;
    }

    // spd
    async spdPP(exScoreObjects) {
        // 统计出spd区间，最大最小值并绘图
        // 计算每张图spd-fc spd、spd-ss spd，列出提升空间最大的图
        const length = exScoreObjects.length;
        let maxSpd = 0;
        let minSpd = Infinity;
        let maxSpdBeatmapTitle = "";
        let totalSpd = 0;
        let maxSpdVSFC = 0;
        let maxSpdVSSS = 0;
        let maxFCImpSpdBeatmapTitle = "";
        let maxSSImpSpdBeatmapTitle = "";
        for (let i = 0; i < length; i++) {
            let speed = exScoreObjects[i].pp.speed;
            let speedFC = exScoreObjects[i].fcpp.speed;
            let speedSS = exScoreObjects[i].sspp.speed;
            let speedVSFC = speedFC - speed;
            let speedVSSS = speedSS - speed;
            if (speed > maxSpd) {
                maxSpd = speed;
                maxSpdBeatmapTitle = exScoreObjects[i].beatmapTitle;
            }
            if (speed < minSpd) minSpd = speed;
            totalSpd += speed;
            if (speedVSFC > maxSpdVSFC) {
                maxSpdVSFC = speedVSFC;
                maxFCImpSpdBeatmapTitle = exScoreObjects[i].beatmapTitle;
            }
            if (speedVSSS > maxSpdVSSS) {
                maxSpdVSSS = speedVSSS;
                maxSSImpSpdBeatmapTitle = exScoreObjects[i].beatmapTitle;
            }
        }
        let output = "\nSpeed区间：" + minSpd.toFixed(0) + "~" + maxSpd.toFixed(0) + "，平均值：" + (totalSpd / length).toFixed(0);
        output += "\nSpeed最高谱面：" + maxSpdBeatmapTitle;
        output += "\n如果FC，Speed可以提升最大：" + maxSpdVSFC.toFixed(0) + "，谱面：" + maxFCImpSpdBeatmapTitle;
        output += "\n如果SS，Speed可以提升最大：" + maxSpdVSSS.toFixed(0) + "，谱面：" + maxSSImpSpdBeatmapTitle;
        return output;
    }

    // acc
    async accPP(exScoreObjects) {
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

    // totalpp
    async totalPP(exScoreObjects) {
        // 统计出pp区间，最大最小值并绘图
        // 计算每张图pp-fc pp、pp-ss pp，列出提升空间最大的图
        const length = exScoreObjects.length;
        let maxPP = 0;
        let minPP = Infinity;
        let totalPP = 0;
        let maxPPVSFC = 0;
        let maxPPVSSS = 0;
        let maxFCImpPPBeatmapTitle = "";
        let maxSSImpPPBeatmapTitle = "";
        for (let i = 0; i < length; i++) {
            let pp = exScoreObjects[i].pp.total;
            let ppFC = exScoreObjects[i].fcpp.total;
            let ppSS = exScoreObjects[i].sspp.total;
            let ppVSFC = ppFC - pp;
            let ppVSSS = ppSS - pp;
            if (pp > maxPP) maxPP = pp;
            if (pp < minPP) minPP = pp;
            totalPP += pp;
            if (ppVSFC > maxPPVSFC) {
                maxPPVSFC = ppVSFC;
                maxFCImpPPBeatmapTitle = exScoreObjects[i].beatmapTitle;
            }
            if (ppVSSS > maxPPVSSS) {
                maxPPVSSS = ppVSSS;
                maxSSImpPPBeatmapTitle = exScoreObjects[i].beatmapTitle;
            }
        }
        let output = "\nPP区间：" + minPP.toFixed(0) + "~" + maxPP.toFixed(0) + "，平均值：" + (totalPP / length).toFixed(0);
        output += "\n如果FC，PP可以提升最大：" + maxPPVSFC.toFixed(0) + "，谱面：" + maxFCImpPPBeatmapTitle;
        output += "\n如果SS，PP可以提升最大：" + maxPPVSSS.toFixed(0) + "，谱面：" + maxSSImpPPBeatmapTitle;
        return output;
    }

    async drawChart(exScoreObjects, type) {
        const statTypes = ["cs", "ar", "od", "hp", "stars", "applength"]; // 对象属性
        const statKeywords = ["cs", "ar", "od", "hp", "stars", "length"]; // 输入的字符
        const ppTypes = ["aim", "speed", "acc", "total"]; // 对象属性
        const ppKeywords = ["aim", "spd", "acc", "pp"];  // 输入的字符
        const length = exScoreObjects.length;
        let data = [];
        let keywordIndex = statKeywords.indexOf(type);
        if (keywordIndex >= 0) {
            for (let i = 0; i < length; i++) {
                data.push(exScoreObjects[i][statTypes[keywordIndex]]);
            }
        }
        else {
            keywordIndex = ppKeywords.indexOf(type);
            if (keywordIndex >= 0) {
                for (let i = 0; i < length; i++) {
                    data.push(exScoreObjects[i].pp[ppTypes[keywordIndex]]);
                }
            }
            else return "限定数据：" + statKeywords.join("、") + "；" + ppKeywords.join("、");
        }
        // stars保留2位
        // data = data.map((num) => Math.round(num * 100) / 100);
        // 排序
        data = data.sort((a, b) => b - a);
        let points = data.map((d, index) => {
            return { x: index + 1, y: d };
        });
        let xLabel = new Array(length);
        for (let i = 0; i < length; ++i) {
            xLabel[i] = i + 1;
        }
        const chart = new Chart([{
            points, configs: {
                lineColor: "#ff9898",
                pointFillColor: "#ff5757"
            }
        }], {
            color: {
                background: "white",
                title: "#000000",
                titleX: "#005cc5",
                titleY: "#7d04c8",
                coordinate: "#000000",
                grid: "#999999"
            },
            size: {
                width: 1024,
                height: 768
            },
            label: {
                title: this.user,
                titleY: type,
                divideX: 10,
                divideY: 20
            },
            // font: "15px 宋体",
            // xDateMode: true,
            // xDateLabel: xLabel,
        });
        const picUrl = chart.draw();
        const base64 = picUrl.substring(picUrl.indexOf(",") + 1);
        return `[CQ:image,file=base64://${base64}]`;
    }

    async drawChartDate(exScoreObjects, timezoneOffsetHours = 8) {
        timezoneOffsetHours = parseInt(timezoneOffsetHours);
        if (!timezoneOffsetHours) return "请输入正确的时区，默认为+8"
        const length = exScoreObjects.length;
        let data = [];
        for (let i = 0; i < length; i++) {
            let time = exScoreObjects[i].time;
            let localHours = (time.getUTCHours() + timezoneOffsetHours) % 24;
            if (localHours < 0) localHours += 24;
            let SecondsInDay = localHours * 3600 + time.getUTCMinutes() * 60 + time.getUTCSeconds();
            data.push({ pp: exScoreObjects[i].pp.total, time: SecondsInDay });
        }
        data = data.sort((a, b) => a.time - b.time);
        let points = data.map((d) => {
            return { x: d.time/3600, y: d.pp };
        });
        const chart = new Chart([{
            points, configs: {
                lineColor: "#ff9898",
                pointFillColor: "#ff5757"
            }
        }], {
            padding: {
                up: 100,
                down: 80,
                left: 100,
                right: 100
            },
            color: {
                background: "white",
                title: "#000000",
                titleX: "#005cc5",
                titleY: "#7d04c8",
                coordinate: "#000000",
                grid: "#999999"
            },
            size: {
                width: 1024,
                height: 768
            },
            label: {
                title: this.user,
                titleX: "time",
                titleY: "pp",
                divideX: 50,
                divideY: 20
            }
        });
        const picUrl = chart.draw();
        const base64 = picUrl.substring(picUrl.indexOf(",") + 1);
        return `[CQ:image,file=base64://${base64}]`;
    }

    async drawChartCompare(exScoreObjects, type) {
        const ppTypes = ["aim", "speed", "acc", "total"]; // 对象属性
        const ppKeywords = ["aim", "spd", "acc", "pp"];  // 输入的字符
        const length = exScoreObjects.length;
        let ppkeywordIndex = ppKeywords.indexOf(type);
        if (ppkeywordIndex < 0) return "限定数据：" + ppKeywords.join("、");
        let pp = [];
        let fcpp = [];
        let sspp = [];
        for (let i = 0; i < length; i++) {
            pp.push(exScoreObjects[i].pp[ppTypes[ppkeywordIndex]]);
            fcpp.push(exScoreObjects[i].fcpp[ppTypes[ppkeywordIndex]]);
            sspp.push(exScoreObjects[i].sspp[ppTypes[ppkeywordIndex]]);
        }
        pp = pp.sort((a, b) => b - a);
        fcpp = fcpp.sort((a, b) => b - a);
        sspp = sspp.sort((a, b) => b - a);
        let xLabel = new Array(length);
        for (let i = 0; i < length; ++i) {
            xLabel[i] = i + 1;
        }
        let points_pp = pp.map((d, index) => {
            return { x: index + 1, y: d };
        });
        let points_fcpp = fcpp.map((d, index) => {
            return { x: index + 1, y: d };
        });
        let points_sspp = sspp.map((d, index) => {
            return { x: index + 1, y: d };
        });
        const chart = new Chart([{ name: "If SS " + ppTypes[ppkeywordIndex], points: points_sspp }, { name: "If FC " + ppTypes[ppkeywordIndex], points: points_fcpp }, { name: ppTypes[ppkeywordIndex], points: points_pp }], {
            padding: {
                up: 100,
                down: 80,
                left: 100,
                right: 100
            },
            color: {
                background: "white",
                title: "#000000",
                titleX: "#005cc5",
                titleY: "#7d04c8",
                coordinate: "#000000",
                grid: "#999999"
            },
            size: {
                width: 1024,
                height: 768
            },
            label: {
                title: this.user,
                titleY: type,
                divideX: 10,
                divideY: 20
            },
            // font: "15px 宋体",
            // xDateMode: true,
            // xDateLabel: xLabel,
        });
        const picUrl = chart.draw();
        const base64 = picUrl.substring(picUrl.indexOf(",") + 1);
        return `[CQ:image,file=base64://${base64}]`;
    }

    async showInfo(exScoreObjects, type, number) {
        const statTypes = ["cs", "ar", "od", "hp", "stars", "applength"]; // 对象属性
        const statKeywords = ["cs", "ar", "od", "hp", "stars", "length"]; // 输入的字符
        const ppTypes = ["aim", "speed", "acc", "total"]; // 对象属性
        const ppKeywords = ["aim", "spd", "acc", "pp"];  // 输入的字符
        const length = exScoreObjects.length;
        let data = [];
        let keywordIndex = statKeywords.indexOf(type);
        if (keywordIndex >= 0) {
            for (let i = 0; i < length; i++) {
                data.push({ val: exScoreObjects[i][statTypes[keywordIndex]], score: exScoreObjects[i] });
            }
        }
        else {
            keywordIndex = ppKeywords.indexOf(type);
            if (keywordIndex >= 0) {
                for (let i = 0; i < length; i++) {
                    data.push({ val: exScoreObjects[i].pp[ppTypes[keywordIndex]], score: exScoreObjects[i] });
                }
            }
            else return "限定数据：" + statKeywords.join("、") + "；" + ppKeywords.join("、");
        }
        // 排序
        data = data.sort((a, b) => b.val - a.val);
        if (number < 1 || number > length) return "请输入序号：1" + "~" + length;
        return type + "#" + number + ":\n" + data[number - 1].score.toString();
    }

    async output(bd, type, args) {
        try {
            let scoreObjects = await this.getBestScoresObject();
            // 下载所有缺失谱面
            console.log("下载所有缺失谱面");
            let beatmapIds = [];
            scoreObjects.map((so) => {
                if (!fs.existsSync(so.beatmapFile)) beatmapIds.push(so.beatmap_id);
            });
            const downloadResult = await bd.downloadQueue(beatmapIds);
            if (!downloadResult) {
                throw "下载缺失谱面时出现问题";
            }
            console.log("每张谱面数据处理");
            const exScoreObjects = await Promise.all(scoreObjects.map(async (item) => {
                return await item.extendScore();
            }));
            console.log("数据汇总处理");
            let output = this.user + "的\n";
            switch (type) {
                case "map": {
                    output += await this.statSummery(exScoreObjects);
                    break;
                }
                case "per": {
                    output += await this.ppAllocation(exScoreObjects);
                    break;
                }
                case "aim": {
                    output += await this.aimPP(exScoreObjects);
                    break;
                }
                case "spd": {
                    output += await this.spdPP(exScoreObjects);
                    break;
                }
                case "acc": {
                    output += await this.accPP(exScoreObjects);
                    break;
                }
                case "pp": {
                    output += await this.totalPP(exScoreObjects);
                    break;
                }
                case "all": {
                    output += await this.statSummery(exScoreObjects);
                    output += await this.ppAllocation(exScoreObjects);
                    output += await this.aimPP(exScoreObjects);
                    output += await this.spdPP(exScoreObjects);
                    output += await this.accPP(exScoreObjects);
                    output += await this.totalPP(exScoreObjects);
                    break;
                }
                case "chart": {
                    output += await this.drawChart(exScoreObjects, args[0]);
                    break;
                }
                case "chartc": {
                    output += await this.drawChartCompare(exScoreObjects, args[0]);
                    break;
                }
                case "date": {
                    output += await this.drawChartDate(exScoreObjects, args[0]);
                    break;
                }
                case "info": {
                    output += await this.showInfo(exScoreObjects, args[0], parseInt(args[1]));
                    break;
                }
                default: {
                    return "???";
                }
            }
            return output;
        }
        catch (ex) {
            return ex;
        }
    }
}


module.exports = getBestScoresData;