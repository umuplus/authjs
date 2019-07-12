'use strict';

const AuthJS = require('..');
const { existsSync: exists, unlinkSync: unlink } = require('fs');
const is = require('is_js');

let auth, data = { t: Date.now() }, token;
afterAll(() => {
    const { private: privateKey, public: publicKey } = auth._options;
    if (exists(privateKey)) unlink(privateKey);
    if (exists(publicKey)) unlink(publicKey);
});
beforeAll(async done => {
    auth = new AuthJS({ jwt: { expiresIn: '2 days' } });
    done();
});

test('generate keys', async done => {
    await auth.generate();
    done();
});

test('sign data', async done => {
    token = auth.sign(data);
    expect(is.string(token)).toBeTruthy();
    done();
});

test('verify token', async done => {
    const r = auth.verify(token);
    expect(r.t).toEqual(data.t);
    done();
});
