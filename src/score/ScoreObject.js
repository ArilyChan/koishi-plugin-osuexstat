"use strict";

const MapCalculater = require("./MapCalculater");
const path = require("path");
const utils = require("./utils");

class ScoreObject {
    constructor(score, saveDir) {
        this.beatmap_id = score.beatmap_id;
        this.beatmapFile = path.join(saveDir, `./${this.beatmap_id}.osu`);
        // this.score_id = score.score_id;
        this.score = score.score;
        // this.user_id = score.user_id;
        // this.time = score.date; // 字符串格式，YYYY-MM-DDTHH:MM:SSZ
        this.combo = parseInt(score.maxcombo);
        this.count50 = parseInt(score.count50);
        this.count100 = parseInt(score.count100);
        this.count300 = parseInt(score.count300);
        this.countmiss = parseInt(score.countmiss);
        this.countkatu = parseInt(score.countkatu);
        this.countgeki = parseInt(score.countgeki);
        // this.perfect = parseInt(score.perfect); //0,1
        this.mods = parseInt(score.enabled_mods);
        this.rank = score.rank;
        // this.pp = parseFloat(score.pp) || 0; // recent没有提供pp
        // this.replay_available = score.replay_available;
        this.acc = this.calACC();
    }

    calACC() {
        const total = this.count50 + this.count100 + this.count300 + this.countmiss;
        return total === 0 ? 0 : ((this.count50 * 50 + this.count100 * 100 + this.count300 * 300) / (total * 300) * 100);
    }

    async extendScore() {
        // 获取谱面信息
        let mapCalculater = await new MapCalculater(this.beatmapFile, { mods: this.mods, combo: this.maxcombo, nmiss: this.countmiss, acc: this.acc }).init();
        const map = mapCalculater.map;
        if (map.artist_unicode == "") map.artist_unicode = map.artist;
        if (map.title_unicode == "") map.title_unicode = map.title;
        this.beatmapTitle = this.beatmap_id + " " + map.artist_unicode + " - " + map.title_unicode + " (" + map.creator + ") [" + map.version + "]";
        const ar = map.ar;
        const od = map.od;
        const hp = map.hp;
        const cs = map.cs;
        const resultStat = mapCalculater.calculateStatWithMods({ ar, od, hp, cs }, this.mods);
        this.fullCombo = mapCalculater.maxcombo;
        this.cs = resultStat.cs;
        this.ar = resultStat.ar;
        this.od = resultStat.od;
        this.hp = resultStat.hp;
        this.stars = mapCalculater.stars.total;
        let pp = {};
        pp.total = mapCalculater.pp.total;
        pp.aim = mapCalculater.pp.aim;
        pp.acc = mapCalculater.pp.acc;
        pp.speed = mapCalculater.pp.speed;
        this.pp = pp;
        let fcpp = {};
        fcpp.total = mapCalculater.fcpp.total;
        fcpp.aim = mapCalculater.fcpp.aim;
        fcpp.acc = mapCalculater.fcpp.acc;
        fcpp.speed = mapCalculater.fcpp.speed;
        this.fcpp = fcpp;
        let sspp = {};
        sspp.total = mapCalculater.sspp.total;
        sspp.aim = mapCalculater.sspp.aim;
        sspp.acc = mapCalculater.sspp.acc;
        sspp.speed = mapCalculater.sspp.speed;
        this.sspp = sspp;
        return this;
    }

    toString() {
        const beatmapParams = "CS" + this.cs.toFixed(1) + "  AR" + this.ar.toFixed(1) + "  OD" + this.od.toFixed(1) + "  HP" + this.hp.toFixed(1);
        const beatmapString = this.beatmapTitle + "\n" + beatmapParams + "  ★" + this.stars.toFixed(2) + "\n";
        const accString = "ACC：" + this.acc.toFixed(2) + "%\n";
        const comboString = "combo: " + this.combo + " / " + this.fullCombo + "\n";
        const modsString = "mod：" + utils.getScoreModsString(this.mods) + "\n";
        const rankString = "rank：" + this.rank + "\n";
        const scoreString = "score：" + utils.format_number(this.score) + "\n";
        const ppString = "pp: " + this.pp.total.toFixed(2) + "pp (aim: " + this.pp.aim.toFixed(0) + "  spd: " + this.pp.speed.toFixed(0) + "  acc: " + this.pp.acc.toFixed(0) + ")";
        const fcppString = "If FC: " + this.fcpp.total.toFixed(2) + "pp (aim: " + this.fcpp.aim.toFixed(0) + "  spd: " + this.fcpp.speed.toFixed(0) + "  acc: " + this.fcpp.acc.toFixed(0) + ")";
        const ssppString = "If SS: " + this.sspp.total.toFixed(2) + "pp (aim: " + this.sspp.aim.toFixed(0) + "  spd: " + this.sspp.speed.toFixed(0) + "  acc: " + this.sspp.acc.toFixed(0) + ")";
        const ppAll = ppString + "\n" + fcppString + "\n" + ssppString + "\n";

        return beatmapString + accString + comboString + modsString + rankString + scoreString + ppAll;
    }
}

module.exports = ScoreObject;