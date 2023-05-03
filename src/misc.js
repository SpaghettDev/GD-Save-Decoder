const { deflateSync } = require("zlib");
const { access, constants } = require("fs");


/**
 * Gets the current time, formatted in a neat string
 * 
 * @returns {String} formatted time
 * */
const getTimestamp = () => {
    const pad = (n, s = 2) => `${new Array(s).fill(0)}${n}`.slice(-s);
    const d = new Date();

    return `${pad(d.getFullYear(), 4)}-${pad(d.getMonth() + 1)}-${
        pad(d.getDate())
    } ${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
};

/**
 * Formats an XMLDocument without using the XSLTProcessor class since it doesn't exist in node.js
 * @param {String} xml the XML document (as a string) to format
 * @param {String?} tab optional, the indentation character to use, default is '\t'
 * 
 * @returns {String} formatted XML document
 * */
const formatXML = (xml, tab = '\t') => {
    var formatted = "",
        indent = "";

    xml.split(/>\s*</).forEach((node) => {
        if (node.match(/^\/\w/)) indent = indent.substring(tab.length); // decrease indent by one 'tab'
        formatted += `${indent}<${node}>\r\n`;
        if (node.match(/^<?\w[^>]*[^\/]$/)) indent += tab; // increase indent
    });

    return formatted.substring(1, formatted.length - 3);
};

/**
 * Checks for Android root permissions, which allows this script to be able
 * to read Geometry Dash save files on android.
 * 
 * @throws {Error} When no root permissions are found
 * @returns {Promise}
 */
const checkAndroidRoot = () => {
    return new Promise((resolve, reject) => {
        access("/", constants.R_OK, (e) => {
            if (e) {
                reject(
                    `Your device is either not rooted, or you didn't launch the node.js process using 'sudo'. (${e.code})`
                );
            }
        });

        resolve();
    });
};

/**
 * Constructs a CRC table to be used by the CRC32 algorithm
 * @returns {Number[]}
 */
const makeCRCTable = () => {
    let c;
    let crcTable = [];

    for (let n =0; n < 256; n++) {
        c = n;

        for (let k =0; k < 8; k++) c = ((c&1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));

        crcTable[n] = c;
    }

    return crcTable;
}

/**
 * Applies the CRC32 algorithm to a string
 * @param {String} str 
 * @returns {Number}
 */
const crc32 = (str) => {
    let crcTable = makeCRCTable();
    let crc = 0 ^ (-1);

    for (let i = 0; i < str.length; i++) crc = (crc >>> 8) ^ crcTable[(crc ^ str.charCodeAt(i)) & 0xFF];

    return (crc ^ (-1)) >>> 0;
};

/**
 * Basically the same as Python's ord() function
 * 
 * @param {String} char 
 * @returns {Number}
 */
const getUnicodeDecimal = (char) => {
    if (char.length > 1) throw new Error("char.length > 1!");

    return parseInt(char.charCodeAt(0), 10);
};

/**
 * Deflates a string using zlib's deflateSync and returns the result as a
 * group of unicode decimals, because JavaScript REALLY likes to turn
 * escape sequences into characters for some reason...
 * 
 * @param {String} str The string to better deflate
 * @returns {Uint8Array} The better deflated string, as a uint8_t array
 */
const betterDeflate = (str) => {
    let deflated = deflateSync(str).toString("latin1");
    let buf = new Uint8Array(deflated.length);

    for (let i = 0; i < deflated.length; i++)
        buf[i] = getUnicodeDecimal(deflated[i]);

    return buf;
};

module.exports = {
    getTimestamp, formatXML, checkAndroidRoot,
    crc32, betterDeflate
};
