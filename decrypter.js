const {
    readFile, writeFileSync,
    existsSync, mkdirSync
} = require("fs");
const { parse: parsePath } = require("path");
const { JSDOM } = require("jsdom");
const { platform } = require("os");
const Crypto = require("./src/crypto.js");
const Parser = require("./src/parser.js");
const {
    getTimestamp, formatXML,
    checkAndroidRoot
} = require("./src/misc.js");

DOMParser = new JSDOM().window.DOMParser;
const crypto = new Crypto();
const parser = new Parser();
const dir = `${__dirname.replace(/\\/g, "/")}/decrypted/`;
const argv = require("minimist")(process.argv.slice(2))._;

if (argv.length == 0) {
    console.log("Decoder usage:");
    console.log("\tnode ./decoder.js [filepath/filename] [type]");
    console.log("\t\t[filepath/filename]: either a custom path to a file, or CCGameManager/CCLocalLevels");
    console.log("\t\t[type]: xml (raw), pxml (pretty xml), json or rjson (raw json)");
    process.exit(0);
}

let file = argv[0] ?? "";
let filename = "";
let gdSave = "";

// match a file path
if (file.match(/^(.+)(\/|\\)([^\/]+)$/gm)) {
    gdSave = file.replace(/\\/g, "/");
    filename = parsePath(gdSave).name;
}
else if (file.match(/CCGameManager(2)?|CCLocalLevels(2)?/g)) {
    if (platform() == "android") {
        console.log(
            "It appears that you are running android, so to be able to read the GD data file,",
            "your phone must be rooted.\n",
            "Checking for root permissions..."
        );
        checkAndroidRoot();
        console.log("Device is rooted! Getting Geometry Dash save file.");

        gdSave = `/data/data/com.robtopx.geometryjump/${file}.dat`;
        filename = file;
    }
    else {
        gdSave = `${process.env.HOME || process.env.USERPROFILE}/AppData/Local/GeometryDash/${file}.dat`;
        filename = file;
    }
}
else throw new Error("File argument is neither a GD save filename nor a path.");

let type = argv[1] ?? "";
if (!type.match(/xml|pxml|json|rjson/i)) {
    throw new Error("Type to output is not valid!");
}

readFile(gdSave, "utf-8", (err, saveData) => {
    if (err) throw new Error(`The file either doesn't exist or is being used by another process. (${err.code})`);
    console.log("Decoding...");
    let decoded = crypto.decrypt(saveData);
    if (!decoded) throw new Error("Could not decode file.");
    if (!existsSync(dir)) mkdirSync(dir);

    let xmlData = new DOMParser().parseFromString(decoded.toString(), "text/xml");

    parser.validateXML(xmlData);

    switch (type) {
        case "xml":
            writeFileSync(dir + `${filename}-${getTimestamp()}.xml`, decoded.toString(), "utf-8");
            break;

        case "pxml":
            writeFileSync(dir + `${filename}-${getTimestamp()}.xml`, formatXML(decoded.toString()), "utf-8");
            break;

        case "json":
        case "rjson":
            if (!filename.match(/(CCGameManager(2)?|CCLocalLevels(2)?)(\..*)?/g)) {
                console.log(
                    "Outputting to JSON a file other than a GD save file may have",
                    "unintended side-effects, such as weird keys/values..."
                );
            }
            let JSONdata = parser.parseXML(xmlData.children[0].children[0], type == "rjson");

            writeFileSync(
                dir + `${filename}-${getTimestamp()}.json`,
                JSON.stringify(JSONdata, null, '\t'),
                "utf-8"
            );
            break;
    }

    console.log("Saved!");
});
