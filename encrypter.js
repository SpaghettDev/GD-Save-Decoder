const { readFile, writeFileSync, existsSync, mkdirSync } = require("fs");
const path = require("path");
const Crypto = require("./src/crypto.js");

const crypto = new Crypto();
const dir = `${__dirname.replace(/\\/g, "/")}/encrypted/`;
const argv = require("minimist")(process.argv.slice(2))._;

let pathToFile = argv[0].replace(/\\/g, "/");
let parsePath = path.parse(pathToFile);
if (parsePath.ext != ".xml") throw new Error("The file must be an XML file.");

readFile(pathToFile, "utf-8", (err, saveData) => {
    if (err) return console.log(`The file either doesn't exist or is being used by another process. (${err.code})`);
    console.log("Encoding...");

    if (saveData.startsWith("<!-- Prettified -->"))
        saveData = saveData.replace("<!-- Prettified -->\n", "").replace(/\t/g, "").replace(/\n/g, "");

    let encoded = crypto.encrypt(saveData);

    if (!existsSync(dir)) mkdirSync(dir);

    writeFileSync(dir + `${parsePath.name}.dat`, encoded);

    console.log("Saved!");
});
