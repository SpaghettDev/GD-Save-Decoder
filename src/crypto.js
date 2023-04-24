const { unzipSync, gzipSync } = require("zlib");

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
    }

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
    }

    /**
     * Encrypts an XML file to a Geometry Dash .dat file
     * @param {String} data data to encode
     * 
     * @returns {String} the encoded data 
     */
    encrypt(data) {
        // if (data.startsWith('C?xBJJJJJJJJHyDsy3aE^XcGGXyDqF q]_G^F:Hr\x7F|FJ[H]iAs^JJJJ6')) return data;

        return this.xor(
            Buffer.from(
                gzipSync(data)
            ).toString('base64'), 11
        );
    }
}

module.exports = crypto;
