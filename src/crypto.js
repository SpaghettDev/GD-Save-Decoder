const { unzipSync } = require("zlib");
const struct = require("python-struct");
const { crc32, betterDeflate } = require("./misc.js");

/**
 * Crypto class. Houses the XOR, decrypt & encrypt functions.
 */
class crypto {
    /**
     * XORs a string using a key
     * @param {String} str the string to XOR
     * @param {Number} key the key to use
     * 
     * @returns {String} the XORed string
     */
    xor(str, key) {     
        let res = "";
        str = String(str).split('').map(letter => letter.charCodeAt());

        for (let i = 0; i < str.length; i++) res += String.fromCodePoint(str[i] ^ key);

        return res; 
    };

    /**
     * Decrypts Geometry Dash .dat files
     * @param {String} data data to decode, it is xor'd then decoded from base64
     * 
     * @returns {Buffer|Error} the decoded data or an error
    */
    decrypt(data) {
        if (data.startsWith('<?xml version="1.0"?>'))
            return data;

        let dexored = this.xor(data, 11);
        let decoded = Buffer.from(dexored, 'base64');
        try {
            return unzipSync(decoded);
        }
        catch (e) {
            throw new Error("Error! GD save file seems to be corrupt!");
        }
    };

    /**
     * Encrypts an XML file to a Geometry Dash .dat file
     * @param {String} data data to encode
     * 
     * @returns {String} the encoded data 
     */
    encrypt(data) {
        if (data.startsWith("C?xBJJJJJJJJH<Dsy3aE^XcGGXyDqF&q]_G^F:Hr|FJ[H]iAs^JJJJ6"))
            return data;

        const gzipHeader = new Uint8Array([31, 139, 8, 0, 0, 0, 0, 0, 0, 11])
        const packedStructArr = new Uint8Array(struct.pack("I I", crc32(data), data.length))
        let compressedData = betterDeflate(data);

        compressedData = Buffer.concat([
            gzipHeader,
            compressedData.slice(2, -4),
            packedStructArr
        ]);

        let encoded_data = Buffer.from(compressedData).toString("base64").replace(/\+/g, "-").replace(/\//g, "_");
        return this.xor(encoded_data, 11);
    };
}

module.exports = crypto;
