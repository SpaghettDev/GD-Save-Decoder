const { readFile, writeFileSync, existsSync, mkdirSync } = require("fs");
const path = require("path");
const Crypto = require("./src/crypto.js");
const { getTimestamp } = require("./src/misc.js");

const crypto = new Crypto();
const dir = `${__dirname.replace(/\\/g, "/")}/encrypted/`;
const argv = require("minimist")(process.argv.slice(2))._;

if (argv.length == 0) {
    console.log("Encoder usage:");
    console.log("\tnode ./encoder.js [filepath] (type)");
    console.log("\t\t[filepath]: custom path to a file ending in .xml");
    console.log("\t\t(type): leave empty for normal, or macos to encode to a MacOS data file");
    process.exit(0);
}

let pathToFile = argv[0].replace(/\\/g, "/");
let parsedPath = path.parse(pathToFile);
if (parsedPath.ext != ".xml")
    throw new Error("The file must be an XML file.");
if (parsedPath.name.match(/(.*)-\d{4}-\d{2}-\d{2} \d{2}-\d{2}-\d{2}/g))
    parsedPath.name = parsedPath.name.replace(/(.*)-\d{4}-\d{2}-\d{2} \d{2}-\d{2}-\d{2}/g, "$1");

let type = (argv[1] ?? "normal").toLowerCase();
if (!type.match(/normal|macos/gi))
    throw new Error("Type must be MacOS or normal.");

readFile(pathToFile, "utf-8", (err, saveData) => {
    if (err) return console.log(`The file either doesn't exist or is being used by another process. (${err.code})`);
    console.log("Encoding...");

    if (saveData.startsWith("<!-- Prettified -->"))
        saveData = saveData.replace("<!-- Prettified -->\n", "").replace(/\t/g, "").replace(/\n/g, "");
    if (type == "macos")
        saveData = saveData.replace('<?xml version="1.0"?>', "<?xml version='1.0' encoding='UTF-8' standalone='yes'?>");

    let encoded = crypto.encrypt(saveData, type == "macos");

    if (!existsSync(dir)) mkdirSync(dir);

    writeFileSync(dir + `${parsedPath.name}-${getTimestamp()}.dat`, encoded, "binary");

    console.log("Saved!");
});
