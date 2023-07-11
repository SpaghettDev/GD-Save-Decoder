const Constants = require("./constants");


/**
 * Is thrown when an XMLDocument is not a valid decoded GD data file
 */
class ParserValidationError extends Error {
    constructor() {
        super("The XMLDocument given is not a valid GD data file, or is a corrupt one.");
        this.name = this.constructor.name;
    }
}

class parser {
    /**
     * Validates {@link data} to ensure it's a decoded Geometry Dash data file
     * and not some random XML file
     * 
     * @param {XMLDocument} data the data to validate
     * @throws {ParserValidationError} if the data is not valid
     * @returns {void}
     */
    validateXML(data) {
        if (
            !data || !data.children ||
            !data.children.length // || !data.children[0].children[0] ||
            // data.children[0].children[0].children[0].innerHTML != "valueKeeper"
        ) throw new ParserValidationError();
    };

    /**
     * parse basic values
     * Credit: https://gdcolon.com/gdsave
     * 
     * @param {XMLDocument} data data to parse
     * @param {Boolean} include_unused include unused keys/values (true), or not (false)
     * @returns {Object} parsed data in the form of an object
     * */
    parseXML(data, include_unused) {
        let res = {};

        data = data.children[0].children[0];

        for (let i = 0; i < data.children.length; i += 2) {
            let keyName = data.children[i].innerHTML;

            if (Constants.keys[keyName]) keyName = Constants.keys[keyName];
            if (include_unused && keyName == "[unused]") continue;

            let valueTag = data.children[i + 1];
            if (valueTag.tagName != "d")
                res[keyName] = this.parseValue(valueTag);
            else
                res[keyName] = this.parseDict(valueTag);
        }

        return res;
    };

    /**
     * Parses a GD Data value
     * Credit: https://gdcolon.com/gdsave
     * 
     * @param {Element} tag GD Data Element to parse
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
    };

    /**
     * Parses GD Data dictionaries
     * Credit: https://gdcolon.com/gdsave
     * 
     * @param {Document} dict dict to parse
     * @returns {Object} parsed dict
     * */
    parseDict(dict) {
        let dictObj = {};

        for (let i = 0; i < dict.children.length; i += 2)
        {
            let keyName = dict.children[i].innerHTML;
            let keyValue = dict.children[i + 1];

            if (keyValue && keyValue.children.length)
                dictObj[keyName] = this.parseDict(keyValue);
            else if (keyValue)
                dictObj[keyName] = this.parseValue(keyValue);
        }

        return dictObj;
    };

    /**
     * Replaces keys such as "gv_0001" with "editor.followPlayer", ...
     * Credit: https://gdcolon.com/gdsave, modified to work with strings instead of
     * objects since we only parseXML the data when exporting to JSON
     * 
     * @param {XMLDocument} data data to replace it's keys with readable ones
     */
    replaceKeys(data) {
        let keyValuePairs = [];
        data = data.children[0].children[0];

        // extract key names from save, allows to get values
        // without relying on the save being sorted in a specific wau
        let keysIndex = Array.from(data.children);
        keysIndex.forEach((e) => {
            let ind = keysIndex.indexOf(e);

            keysIndex[ind] = ind % 2 == 0 ? e.innerHTML : null;
        });


        // valueKeeper, contains game settings and unlocked icons
        keyValuePairs = data.children[keysIndex.indexOf("valueKeeper") + 1].innerHTML.split(/>\s*</g);

        for (let i = 0; i < keyValuePairs.length; i += 2) {
            let match = keyValuePairs[i].match(/gv_\d{4}/g);

            if (match)
                keyValuePairs[i] = keyValuePairs[i].replace(/gv_\d{4}/g, Constants.gameVariables[match[0].split("_")[1]] ?? match[0]);

            if (match = (keyValuePairs[i].match(/c0_\d/g)))
                keyValuePairs[i] = keyValuePairs[i].replace(/c0_(\d+)/g, "primarycolor_$1");

            if (match = (keyValuePairs[i].match(/c1_(\d+)/g)))
                keyValuePairs[i] = keyValuePairs[i].replace(/c1_(\d+)/g, "secondarycolor_$1");

            if (match = (keyValuePairs[i].match(/i_(\d+)/g)))
                keyValuePairs[i] = keyValuePairs[i].replace(/i_(\d+)/g, "cube_$1");

            if (match = (keyValuePairs[i].match(/ship_(\d+)/g)))
                keyValuePairs[i] = keyValuePairs[i].replace(/ship_(\d+)/g, "ship_$1");

            if (match = (keyValuePairs[i].match(/ball_(\d+)/g)))
                keyValuePairs[i] = keyValuePairs[i].replace(/ball_(\d+)/g, "ball_$1");

            if (match = (keyValuePairs[i].match(/bird_(\d+)/g)))
                keyValuePairs[i] = keyValuePairs[i].replace(/bird_(\d+)/g, "ufo_$1");

            if (match = (keyValuePairs[i].match(/dart_(\d+)/g)))
                keyValuePairs[i] = keyValuePairs[i].replace(/dart_(\d+)/g, "wave_$1");

            if (match = (keyValuePairs[i].match(/robot_(\d+)/g)))
                keyValuePairs[i] = keyValuePairs[i].replace(/robot_(\d+)/g, "robot_$1");

            if (match = (keyValuePairs[i].match(/spider_(\d+)/g)))
                keyValuePairs[i] = keyValuePairs[i].replace(/spider_(\d+)/g, "spider_$1");

            if (match = (keyValuePairs[i].match(/special_(\d+)/g)))
                keyValuePairs[i] = keyValuePairs[i].replace(/special_(\d+)/g, "trail_$1");

            if (match = (keyValuePairs[i].match(/death_(\d+)/g)))
                keyValuePairs[i] = keyValuePairs[i].replace(/death_(\d+)/g, "deatheffect_$1");
        };

        data.children[keysIndex.indexOf("valueKeeper") + 1].innerHTML = keyValuePairs.join("><");


        // unlockValueKeeper, contains game events
        keyValuePairs = data.children[keysIndex.indexOf("unlockValueKeeper") + 1].innerHTML.split(/>\s*</g);

        for (let i = 0; i < keyValuePairs.length; i += 2)
            keyValuePairs[i] = keyValuePairs[i].replace(/ugv_(\d+)/g, (_, v) => Constants.gameEvents[v]);

        data.children[keysIndex.indexOf("unlockValueKeeper") + 1].innerHTML = keyValuePairs.join("><");


        // stats, contains,... stats
        keyValuePairs = data.children[keysIndex.indexOf("GS_value") + 1].innerHTML.split(/>\s*</g);

        for (let i = 0; i < keyValuePairs.length; i += 2) {
            let tag = i == 0 ? "<k>" : "k>"
            let key = keyValuePairs[i].replace(/<k>|k>/g, "").replace(/<\/k/g, "");
            let keyName = Constants.statKeys[key] || keyValuePairs[i].replace(/<k>|k>/g, "").replace(/<\/k/g, "");

            if (keyName.includes("unique")) {
                let coinData = keyName.split("_");

                if (parseInt(coinData[1]) != NaN)
                    keyValuePairs[i] = `${tag}${
                        (Constants.levelNames[coinData[1]] ?? Constants.levelNames[0]).replace(/ /g, "-")
                    }_coin${coinData[1]}</k`;
            }
            else
                keyValuePairs[i] = `${tag}${keyName}</k`;
        };

        data.children[keysIndex.indexOf("GS_value") + 1].innerHTML = keyValuePairs.join("><");
    };
};

module.exports = parser;
