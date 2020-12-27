const osuexstat = require("./index").osuexstat;
const exs = new osuexstat({
    apiKey: '27caa4993a4430b2e63762bdd5e6b9643ddf7679',
});

const myQQ = 1;
const stat = { isbusy: false };
const readline = require("readline");
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
rl.on("line", async (line) => {
    console.log(await exs.apply(myQQ, line, stat));
});
