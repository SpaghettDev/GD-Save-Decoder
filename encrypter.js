const {
    readFile, writeFileSync,
    existsSync, mkdirSync
} = require("fs");
const path = require("path");
const Crypto = require("./src/crypto.js");
const { getTimestamp } = require("./src/misc.js");

const crypto = new Crypto();
const dir = `${__dirname.replace(/\\/g, "/")}/encrypted/`;
const argv = require("minimist")(process.argv.slice(2))._;

if (argv.length == 0) {
    console.log("Encoder usage:");
    console.log("\tnode ./encrypter.js [filepath] (encrypt_macos)");
    console.log("\t\t[filepath]: custom path to a file ending in .xml");
    console.log("\t\t(encrypt_macos): leave empty or false for normal, or true for MacOS encrypt");
    process.exit(0);
}

let pathToFile = argv[0].replace(/\\/g, "/");
let type = (argv[1] ?? "").toLowerCase();

let parsedPath = path.parse(pathToFile);
if (parsedPath.ext != ".xml")
    throw new Error("The file must be an XML file.");
if (parsedPath.name.match(/(.*)-\d{4}-\d{2}-\d{2} \d{2}-\d{2}-\d{2}/g))
    parsedPath.name = parsedPath.name.replace(/(.*)-\d{4}-\d{2}-\d{2} \d{2}-\d{2}-\d{2}/g, "$1");

if (!type.match(/true|false/g))
    throw new Error("Type must be true or false.");

readFile(pathToFile, "utf-8", (err, saveData) => {
    if (err) throw new Error(`The file either doesn't exist or is being used by another process. (${err.code})`);
    console.log("Encoding...");

    // maybe change in future?
    if (!saveData.includes("gv_0001"))
        throw new Error("Cannot encrypt a save file that has it's keys replaced!");

    if (saveData.startsWith("<!-- Prettified -->"))
        saveData = saveData.replace("<!-- Prettified -->\n", "").replace(/\t/g, "").replace(/\n/g, "");
    if (type == "true")
        saveData = saveData.replace(
            '<?xml version="1.0"?>',
            "<?xml version='1.0' encoding='UTF-8' standalone='yes'?>"
        );

    let encrypted = crypto.encrypt(saveData, type == "true");

    if (!existsSync(dir)) mkdirSync(dir);

    writeFileSync(dir + `${parsedPath.name}-${getTimestamp()}.dat`, encrypted, "binary");

    console.log("Saved!");
});
