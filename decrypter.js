const { readFile, writeFileSync, existsSync, mkdirSync } = require('fs');
const { parse: parsePath } = require('path');
const { JSDOM } = require('jsdom');
const Crypto = require('./src/crypto.js');
const Parser = require('./src/parser.js');
const { getTimestamp, formatXML } = require ('./src/misc.js')

DOMParser = new JSDOM().window.DOMParser;
const crypto = new Crypto();
const parser = new Parser();
const dir = `${__dirname.replace(/\\/g, "/")}/decoded/`;
const argv = require("minimist")(process.argv.slice(2))._;

if (argv.length == 0) {
    console.log("Decoder usage:");
    console.log("\tnode ./decoder.js [filepath/filename] [type]");
    console.log("\t\t[filepath/filename]: either a custom path to a file, or CCGameManager/CCLocalLevels");
    console.log("\t\t[type]: xml (raw), pxml (pretty xml), or json");
    process.exit(0);
}

let file = argv[0] ?? "";
let filename = "";
let gdSave = "";

// match a file path
if (file.match(/^(.+)(\/|\\)([^\/]+)$/mg))
{
    gdSave = file.replace(/\\/g, "/");
    filename = parsePath(gdSave).name;
}
else if (file.match(/CCGameManager|CCLocalLevels/g))
{
    gdSave = `${process.env.HOME || process.env.USERPROFILE}/AppData/Local/GeometryDash/${file}.dat`;
    filename = file;
}
else throw new Error("File argument is neither a GD save filename nor a path.");

let type = argv[1] ?? "";
if (!type.match(/xml|pxml|json/i)) {
    throw new Error("Type to output is not valid!");
}

readFile(gdSave, 'utf8', (err, saveData) => {
    if (err) throw new Error("GD Save File could not be found/read.");
    console.log("Decoding...");
    let decoded = crypto.decrypt(saveData);
    if (!decoded) throw new Error("Could not decode file.");

    if (!existsSync(dir)) mkdirSync(dir);

    let xmlData = new DOMParser().parseFromString(decoded.toString(), 'text/xml');

    parser.validateXML(xmlData);

    switch (type) {
        case "xml":
            writeFileSync(dir + `${filename}-${getTimestamp()}.xml`, decoded.toString(), 'utf8');
            break;

        case "pxml":
            writeFileSync(dir + `${filename}-${getTimestamp()}.xml`, formatXML(decoded.toString()), 'utf8');
            break;

        case "json":
            if (!filename.match(/(CCGameManager|CCLocalLevels)(\..*)?/g)) {
                console.log("Outputting to JSON a file other than a GD save file may have unintended side-effects, such as weird values...");
            }
            let JSONdata = parser.parseXML(xmlData.children[0].children[0]);

            writeFileSync(
                dir + `${filename}-${getTimestamp()}.json`,
                JSON.stringify(JSONdata, null, 2),
                'utf8'
            );
            break;
    }

    console.log("Saved!");
});
