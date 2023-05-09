const { unzipSync, deflateSync } = require("zlib");
const struct = require("python-struct");
const Crypto = require("crypto");
const {
    crc32, toUint8Array
} = require("./misc.js");


/**
 * Crypto class. Houses the XOR, decrypt & encrypt functions.
 */
class crypto {
    #macOSKey = toUint8Array([
        "\x69\x70\x75\x39\x54\x55\x76\x35\x34\x79\x76\x5d\x69\x73\x46\x4d\x68\x35\x40",
        "\x3b\x74\x2e\x35\x77\x33\x34\x45\x32\x52\x79\x40\x7b"
    ].join(""));

    /**
     * XORs the {@link str} using the {@link key}
     * 
     * @param {String} str the string to XOR
     * @param {Number} key the key to use
     * @returns {String} the XORed string
     */
    xor(str, key) {     
        let res = "";
        str = String(str).split("").map(letter => letter.charCodeAt());

        for (let i = 0; i < str.length; i++) res += String.fromCodePoint(str[i] ^ key);

        return res; 
    };

    /**
     * Decrypts Geometry Dash .dat files
     * 
     * @param {String} data data to decode, it is xor'd then decoded from base64
     * @returns {Buffer|Error} the decoded data or an error
    */
    decrypt(data) {
        if (data.startsWith('<?xml version="1.0"?>'))
            return data;

        // Windows & Linux
        if (data.charCodeAt(0) == 67) {
            let dexored = this.xor(data.slice(0, Math.trunc(data.length, 4) * 4), 11);
            let decoded = Buffer.from(dexored, "base64");
            try {
                return unzipSync(decoded);
            }
            catch (e) {
                throw new Error("Error! GD save file seems to be corrupt!");
            };
        } else { // Mac
            let decipher = Crypto.createDecipheriv("aes-256-ecb", this.#macOSKey, null);
            decipher.setAutoPadding(true);

            let decrypted = decipher.update(data, "binary", "utf-8");
            decrypted += decipher.final("utf-8");

            return decrypted;
        };
    };

    /**
     * Encrypts {@link data} to a Geometry Dash .dat file
     * Credit: https://github.com/WEGFan/Geometry-Dash-Savefile-Editor,
     * ported to JavaScript by SpaghettDev.
     * 
     * @param {String} data data to encode
     * @param {Boolean} macosEncoding use MacOS encoding or not
     * @returns {String} the encoded data 
     */
    encrypt(data, macosEncoding) {
        if (data.startsWith("C?xBJJJJJJJJH"))
            return data;

        if (!macosEncoding) {
            const gzipHeader   = toUint8Array("\x1f\x8b\x08\x00\x00\x00\x00\x00\x00\x0b");
            const packedStruct = toUint8Array(struct.pack("I I", crc32(data), data.length));
            let compressedData = toUint8Array(deflateSync(data).toString("latin1"));

            compressedData = Buffer.concat([
                gzipHeader,
                compressedData.slice(2, -4),
                packedStruct
            ]);

            const encodedData = Buffer.from(compressedData).toString("base64")
                .replace(/\+/g, "-")
                .replace(/\//g, "_");
            return this.xor(encodedData, 11);
        } else {
            const cipher = Crypto.createCipheriv("aes-256-ecb", this.#macOSKey, null);
            cipher.setAutoPadding(true);

            let encrypted = cipher.update(data, "utf-8", "binary");
            encrypted += cipher.final("binary");

            return encrypted;
        }
    };
}

module.exports = crypto;
