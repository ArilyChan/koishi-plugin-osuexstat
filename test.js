const blocked = require("blocked-at");
blocked((time, stack, { type, resource }) => {
    console.log(`Blocked for ${time}ms, operation started here:`, stack);
    if (type === "HTTPPARSER" && resource) {
        // resource structure in this example assumes Node 10.x
        console.log(`URL related to blocking operation: ${resource.resource.incoming.url}`);
    }
}, { resourcesCap: 100 });

const osuexstat = require("./index").osuexstat;
// eslint-disable-next-line new-cap
const exs = new osuexstat({
    apiKey: require("./apiToken.json").apiToken,
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
