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
 * 
 * @param {String} xml the XML document (as a string) to format
 * @param {String?} tab optional, the indentation character to use, default is '\t'
 * @returns {String} formatted XML document
 * */
const formatXML = (xml, tab = '\t') => {
    const mark = "<!-- Prettified -->\n";
    let formatted = "",
        indent = "";

    xml.split(/>\s*</).forEach((node) => {
        if (node.match(/^\/\w/)) indent = indent.substring(tab.length); // decrease indent by one 'tab'
        formatted += `${indent}<${node}>\r\n`;
        if (node.match(/^<?\w[^>]*[^\/]$/)) indent += tab; // increase indent
    });

    return mark + formatted.substring(1, formatted.length - 3);
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
 * 
 * @returns {Number[]}
 */
const makeCRCTable = () => {
    let c;
    let crcTable = [];

    for (let n =0; n < 256; n++) {
        c = n;

        for (let k =0; k < 8; k++)
            c = ((c&1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));

        crcTable[n] = c;
    }

    return crcTable;
}

/**
 * Applies the CRC32 algorithm to a string
 * 
 * @param {String} str 
 * @returns {Number}
 */
const crc32 = (str) => {
    let crcTable = makeCRCTable();
    let crc = 0 ^ (-1);

    for (let i = 0; i < str.length; i++)
        crc = (crc >>> 8) ^ crcTable[(crc ^ str.charCodeAt(i)) & 0xFF];

    return (crc ^ (-1)) >>> 0;
};

/**
 * Turns the {@link buffer} argument into a Uint8Array
 * 
 * @param {String|Buffer|ArrayBuffer|Int32Array|Number[]} buffer
 * @returns {Uint8Array}
 */
const toUint8Array = (buffer) => {
    if (typeof buffer == "object" && buffer.constructor.name == "Buffer")
        return new Uint8Array(buffer);

    if (typeof buffer == "object" && buffer.constructor.name == "ArrayBuffer")
        return new Uint8Array(buffer);

    if (typeof buffer == "object" && buffer.constructor.name == "Int32Array")
        return new Uint8Array(buffer);

    if (
        typeof buffer == "object" &&
        buffer.constructor.name == "Array" &&
        buffer.every(e => typeof e == "number")
        )
        return new Uint8Array(buffer);


    let arr = new Uint8Array(buffer.length);

    for (i in buffer)
        arr[i] = buffer.charCodeAt(i);

    return arr;
};

module.exports = {
    getTimestamp, formatXML, checkAndroidRoot,
    crc32, toUint8Array
};
