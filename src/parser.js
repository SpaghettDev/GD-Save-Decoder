const Constants = require("./constants");

/**
 * Is thrown when an XMLDocument is not a valid decoded GD data file
 */
class ParserValidationError extends Error {
    constructor() {
        super("The XMLDocument given is not a valid GD data file.");
        this.name = this.constructor.name;
    }
}

class parser {
    /**
     * Validates a XML file to ensure it's a decoded Geometry Dash data file and not some random XML file
     * @param {XMLDocument} data the data to validate
     * 
     * @throws {ParserValidationError} if the data is not valid
     * @returns {void}
     */
    validateXML(data) {
        if (!data || !data.children || !data.children.length)
            throw new ParserValidationError();
    }

    /**
     * parse basic values
     * @param {XMLDocument} data data to parse
     * 
     * @returns {Object} parsed data in the form of an object
     * */
    parseXML(data) {
        let raw = {};
        let res = {};

        for (let i = 0; i < data.children.length; i += 2) {
            let keyName = data.children[i].innerHTML;
            if (Constants.keys[keyName]) keyName = Constants.keys[keyName];
            if (keyName == "[unused]") continue;
            let valueTag = data.children[i + 1];
            if (valueTag.tagName != "d") {
                let value = this.parseValue(valueTag);
                res[keyName] = value;
            }
            else raw[keyName] = valueTag;
        }

        // parse complex values
        Object.keys(raw).sort().forEach(x => {
            res[x] = this.parseDict(raw[x]);
        });

        return res;
    }

    /**
     * Parses a GD Data value
     * @param {Element} tag GD Data Element to parse
     * 
     * @returns {Number|String|Boolean} parsed value in the format required
     */
    parseValue(tag) {
        let val = tag.innerHTML;

        switch (tag.tagName) {
            case "r": return parseFloat(val);
            case "i": return parseInt(val);
            case "s": return val;
            case "t": return true;
            case "f": return false;
        }
    }

    /**
     * Parses GD Data dictionaries
     * @param {Document} dict dict to parse
     * 
     * @returns {Object} parsed dict
     * */
    parseDict(dict) {
        let dictObj = {};

        for (let i = 0; i < dict.children.length; i += 2)
        {
            let keyName = dict.children[i].innerHTML;
            let keyValue = dict.children[i + 1];

            if (keyValue && keyValue.children.length) dictObj[keyName] = this.parseDict(keyValue);
            else if (keyValue) dictObj[keyName] = this.parseValue(keyValue) ;
        }

        return dictObj;
    }
}

module.exports = parser;
