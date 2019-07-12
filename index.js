'use strict';

const { exec } = require('child_process');
const { existsSync: exists, unlinkSync: unlink } = require('fs');
const is = require('is_js');
const { join: joinPath } = require('path');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const { readFileSync: readFile } = require('fs');
const { tmpdir } = require('os');

const execute = promisify(exec);

class Auth {
    /**
     * creates an instance of Auth
     * @param {Object} options { "jwt": Object, "keygen": String, "openssl": String, "private": String, "public": String }
     * @memberof Auth
     */
    constructor(options) {
        if (is.not.object(options) || is.array(options)) options = {};
        this._keys = {};
        this._options = Object.assign({}, options);
        this._defaults();
    }

    /**
     * @description sets default values up
     * @private
     * @memberof Auth
     */
    _defaults() {
        if (is.not.string(this._options.keygen) || is.empty(this._options.keygen))
            this._options.keygen = 'ssh-keygen';
        if (is.not.string(this._options.openssl) || is.empty(this._options.openssl))
            this._options.openssl = 'openssl';
        if (is.not.string(this._options.private) || is.empty(this._options.private))
            this._options.private = joinPath(tmpdir(), 'private.key');
        if (is.not.string(this._options.public) || is.empty(this._options.public))
            this._options.public = `${ this._options.private }.pub`;

        if (is.not.object(this._options.jwt) || is.array(this._options.jwt))
            this._options.jwt = {};
        if (is.not.string(this._options.jwt.algorithm) || is.empty(this._options.jwt.algorithm))
            this._options.jwt.algorithm = 'RS256';
    }

    /**
     * @description
     * @param {string} [keys=[ 'private', 'public' ]] keys to load their files
     * @private
     * @memberof Auth
     */
    async _loadKeys(keys = [ 'private', 'public' ]) {
        if (is.array(keys))
            for (let key of keys) {
                const path = this._options[key];
                if (is.string(path) && is.not.empty(path) && exists(path))
                    this._keys[key] = readFile(path).toString();
            }
    }

    /**
     * @description generates a public key from existing private key
     * @private
     * @memberof Auth
     */
    async _generatePublicKey() {
        const { openssl, private: privateKey, public: publicKey } = this._options;
        if (exists(publicKey)) unlink(publicKey);
        await execute(`${ openssl } rsa -in ${ privateKey } -pubout -outform PEM -out ${ publicKey }`);
        await this._loadKeys([ 'public' ]);
    }

    /**
     * @description generates a private key
     * @private
     * @memberof Auth
     */
    async _generatePrivateKey() {
        const { keygen, private: privateKey } = this._options;
        if (exists(privateKey)) unlink(privateKey);
        await execute(`${ keygen } -t rsa -b 4096 -m PEM -f ${ privateKey }`);
        await this._loadKeys([ 'private' ]);
        await this._generatePublicKey();
    }

    /**
     * @description generates private and/or public keys by parameters
     * @param {Boolean} [overwrite] if set true, overwrites existing keys
     * @param {Boolean} [both] if set true, overwrites private key too
     * @memberof Auth
     */
    async generate(overwrite, both) {
        if (!exists(this._options.private)) await this._generatePrivateKey();
        else if (overwrite) {
            if (both) await this._generatePrivateKey();
            else {
                await this._loadKeys([ 'private' ]);
                await this._generatePublicKey();
            }
        } else {
            await this._loadKeys();
        }
    }

    /**
     * @description returns content of key
     * @param {boolean} [isPrivate]
     * @returns String
     * @memberof Auth
     */
    key(isPrivate) {
        return this._keys[ isPrivate ? 'private' : 'public' ];
    }

    /**
     * @description helper method to sign data with jsonwebtoken
     * @param {Object} data data
     * @returns String
     * @memberof Auth
     */
    sign(data) {
        if (is.not.object(data) || is.array(data) || is.empty(data))
            throw new Error('invalid data');

        return jwt.sign(data, this.key(true), this._options.jwt);
    }

    /**
     * @description helper method to verify token with jsonwebtoken
     * @param {String} token token
     * @returns Object
     * @memberof Auth
     */
    verify(token) {
        if (is.not.string(token)) throw new Error('invalid token');

        return jwt.verify(token, this.key(), this._options.jwt);
    }
}


module.exports = Auth;
