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

const JSDOMwindow = new JSDOM().window;
const DOMParserInst = new JSDOMwindow.DOMParser();
const XMLSerializerInst = new JSDOMwindow.XMLSerializer();

const crypto = new Crypto();
const parser = new Parser();
const dir = `${__dirname.replace(/\\/g, "/")}/decrypted/`;
const argv = require("minimist")(process.argv.slice(2))._;

if (argv.length == 0) {
    console.log("Decoder usage:");
    console.log("\tnode ./decoder.js [filepath/filename] [type] (replace_keys)");
    console.log("\t\t[filepath/filename]: either a custom path to a file, or CCGameManager/CCLocalLevels");
    console.log("\t\t[type]: xml (raw), pxml (pretty xml), json or rjson (raw json)");
    console.log(
        "\t\t(replace_keys): leave empty to not replace keys with a readable version of them,",
        "or true to do the opposite"
    );
    process.exit(0);
}

let file = argv[0] ?? "";
let type = argv[1] ?? "";
let replace_keys = (argv[2] ?? "false").toLowerCase();
let filename = "";
let gdSave = "";

// match a file path
if (file.match(/^(.+)(\/|\\)([^\/]+)$/gm)) {
    gdSave = file.replace(/\\/g, "/");

    if (file.match(/(.*)-\d{4}-\d{2}-\d{2} \d{2}-\d{2}-\d{2}/g))
        file = file.replace(/(.*)-\d{4}-\d{2}-\d{2} \d{2}-\d{2}-\d{2}/g, "$1");

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
    }
    else if (platform() == "darwin")
        gdSave = `~/Library/Application Support/GeometryDash/${file}.dat`;
    else
        gdSave = `${process.env.HOME || process.env.USERPROFILE}/AppData/Local/GeometryDash/${file}.dat`;

    filename = file;
}
else
    throw new Error("File argument is neither a GD save filename nor a path.");

if (!type.match(/xml|pxml|json|rjson/i))
    throw new Error("Type to output is not valid!");

if (!replace_keys.match(/true|false/i))
    throw new Error("replace_keys must be true or false!");

readFile(gdSave, "binary", async (err, saveData) => {
    if (err) throw new Error(`The file either doesn't exist or is being used by another process. (${err.code})`);
    console.log("Decoding...");
    let decoded = crypto.decrypt(saveData);
    if (!decoded) throw new Error("Could not decode file.");
    if (!existsSync(dir)) mkdirSync(dir);

    let xmlData = DOMParserInst.parseFromString(decoded.toString(), "text/xml");
    parser.validateXML(xmlData);

    if (replace_keys == "true")
        parser.replaceKeys(xmlData);

    switch (type) {
        case "xml":
            writeFileSync(dir + `${filename}-${getTimestamp()}.xml`, XMLSerializerInst.serializeToString(xmlData), "utf-8");
        break;

        case "pxml":
            writeFileSync(dir + `${filename}-${getTimestamp()}.xml`, formatXML(XMLSerializerInst.serializeToString(xmlData)), "utf-8");
        break;

        case "json":
        case "rjson":
            if (!filename.match(/(CCGameManager(2)?|CCLocalLevels(2)?)(\..*)?/g))
                console.log(
                    "Outputting to JSON a file other than a GD save file may have",
                    "unintended side-effects, such as weird keys/values..."
                );

            let JSONdata = parser.parseXML(xmlData, type == "rjson");

            writeFileSync(
                dir + `${filename}-${getTimestamp()}.json`,
                JSON.stringify(JSONdata, null, '\t'),
                "utf-8"
            );
        break;
    }

    console.log("Saved!");
});
