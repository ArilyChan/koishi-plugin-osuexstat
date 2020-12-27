"use strict";

var glob = require('glob'),
    path = require('path');

class CommandsInfo {
    constructor() {
        this.commands = this.loadModules();
    }

    // 加载modules内的enabled指令
    loadModules() {
        let commands = [];
        let allcommand = [];
        glob.sync(path.join(__dirname, '../modules/*.js')).map((file) => {
            try {
                let module = require(path.resolve(file));
                if (module !== undefined && module.enabled) {
                    commands.push(module);
                    allcommand.push(...module.command);
                    console.log("[osuexstat]加载指令：" + module.type);
                }
                if (new Set(allcommand).size !== allcommand.length) {
                    console.log("[osuexstat]警告：检测到重复指令，位于" + module.type);
                }
            } catch (e) {
                console.log('[osuexstat]unable to load module due to require error', path.resolve(file));
            }
        });
        return commands;
    }

    getHelp() {
        let output = "";

        // 输出全部指令
        output = output + "exbp指令查询\n";
        for (let com of this.commands) {
            output = output + com.info + "  exbp " + com.command[0] + ", " + com.argsInfo + "\n";
        }
        // output = output + "基本指令有：" + commands.reduce((acc, cur) => { return acc + cur.command[0] + "/" }, "");
        return output;

    }

}


module.exports = CommandsInfo;