require('dotenv').config()
var CryptoJS = require("crypto-js")
var AES = require("crypto-js/aes")

const decrypt = (value) => {

    try {

        if(process.env.ENCRYPT_IV !== null && process.env.ENCRYPT_KEY !== null) {

            let iv = CryptoJS.enc.Hex.parse(process.env.ENCRYPT_IV)
            let key = CryptoJS.enc.Hex.parse(process.env.ENCRYPT_KEY)

            var decrypted = CryptoJS.AES.decrypt(value, key, {
                mode: CryptoJS.mode.CTR,
                iv,
                padding: CryptoJS.pad.ZeroPadding
            })

            return decrypted.toString(CryptoJS.enc.Utf8)

        } else {

            return {error: "No iv and key encrypt defined"}

        }

    } catch (error) {
        console.error(error);
        // Expected output: ReferenceError: nonExistentFunction is not defined
        // (Note: the exact output may be browser-dependent)
    }

}

const encrypt = (value) => {

    try {
        
        if(process.env.ENCRYPT_IV !== null && process.env.ENCRYPT_KEY !== null) {

            let iv = CryptoJS.enc.Hex.parse(process.env.ENCRYPT_IV)
            let key = CryptoJS.enc.Hex.parse(process.env.ENCRYPT_KEY)

            var encrypted = CryptoJS.AES.encrypt(value, key, {
                mode: CryptoJS.mode.CTR,
                iv,
                padding: CryptoJS.pad.ZeroPadding
            });

            return encrypted.toString()

        } else {

            return {error: "No iv and key encrypt defined"}

        }

    } catch (error) {

        console.error(error);

    }

}


module.exports = { decrypt, encrypt };