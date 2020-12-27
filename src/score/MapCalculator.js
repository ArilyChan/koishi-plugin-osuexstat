/* eslint-disable class-methods-use-this */
/* eslint-disable new-cap */
// const ojsama = require("ojsama");
const fs = require("fs");

const { spawn, Thread, Worker } = require("threads");
// const utils = require("./utils");
class MapCalculator {
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
        // (options.mods) ? this.mods = options.mods : 0;
        this.mods = options.mods || 0;
        // if (options.combo) this.combo = options.combo;
        this.combo = options.combo;
        // (options.nmiss) ? this.nmiss = options.nmiss : 0;
        this.nmiss = options.nmiss || 0;
        // (options.acc) ? this.acc = options.acc : 100;
        this.acc = options.acc || 100;

    }
    getMap() {
        return new Promise((resolve) => {
            fs.readFile(this.beatmapFile, "utf-8", (err, data) => {
                if (err) throw err;
                resolve(data);
            });
        });
    }
    calculateStatWithMods(values, mods) {
        // return new ojsama.std_beatmap_stats(values).with_mods(mods);
        return this.worker.calculateStatWithMods({ values, mods });
    }
    async init() {
        this.worker = await spawn(new Worker("../workers/calculator-worker"));
        const rawBeatmap = await this.getMap();
        const result = await this.worker.init(this, { rawBeatmap });
        // return this;
        return Object.assign(this, result);
    }

    terminateWorker() {
        return Thread.terminate(this.worker);
    }
}
module.exports = MapCalculator;
