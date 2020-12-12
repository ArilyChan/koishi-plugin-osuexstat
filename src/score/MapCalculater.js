"use strict";

const ojsama = require("ojsama");
const fs = require('fs');

class MapCalculater {
    /**
     * @param {String} beatmapFile 
     * @param {Object} options 
     * @param {Number} [options.mods=0]
     * @param {Number} [options.combo]
     * @param {Number} [options.nmiss=0]
     * @param {Number} [options.acc=100]
     */
    constructor(beatmapFile, options) {
        this.beatmapFile = beatmapFile;
        (options.mods) ? this.mods = options.mods : 0;
        if (options.combo) this.combo = options.combo;
        (options.nmiss) ? this.nmiss = options.nmiss : 0;
        (options.acc) ? this.acc = options.acc : 100;
    }

    getMap() {
        return new Promise((resolve) => {
            fs.readFile(this.beatmapFile, 'utf-8', (err, data) => {
                if (err) throw err;
                else {
                    resolve(data);
                }
            });
        });
    }

    calculateStatWithMods(values, mods) {
        return new ojsama.std_beatmap_stats(values).with_mods(mods);
    }

    async init() {
        const rawBeatmap = await this.getMap();
        const { map } = new ojsama.parser().feed(rawBeatmap);
        this.map = map;

        this.maxcombo = this.map.max_combo();
        if (!this.combo) this.combo = this.maxcombo;
        this.stars = new ojsama.diff().calc({ map: this.map, mods: this.mods });
        this.pp = ojsama.ppv2({
            stars: this.stars,
            combo: this.combo,
            nmiss: this.nmiss,
            acc_percent: this.acc,
        });
        this.fcpp = ojsama.ppv2({
            stars: this.stars,
            combo: this.maxcombo,
            nmiss: 0,
            acc_percent: this.acc,
        });
        this.sspp = ojsama.ppv2({
            stars: this.stars,
            combo: this.maxcombo,
            nmiss: 0,
            acc_percent: 100,
        });
        return this;
    }
}

module.exports = MapCalculater;