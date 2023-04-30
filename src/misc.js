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
const checkAndroidRoot = async () => {
    await access("/", constants.R_OK, (e) => {
        if (e) {
            new Error(
                `Your device is either not rooted, or you didn't launch the node.js process using 'sudo'. (${e.code})`
            );
        }
    });
};

module.exports = { getTimestamp, formatXML, checkAndroidRoot };
