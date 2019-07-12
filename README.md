# authjs

key manager and auth wrapper for jwt in node.js

## Install

```bash
npm i --save authjs
```

You can also clone this repository and make use of it yourself.

```bash
git clone https://github.com/umuplus/authjs.git
cd authjs
npm i
npm test
```

## Configuration

- **keygen :** path for "ssh-keygen". default value is "ssh-keygen"
- **jwt :** options for jsonwebtoken
- **openssl :** path for "openssl". default value is "openssl"
- **private :** path for private key. default value is "/tmp/private.key"
- **public :** path for public key. default value is "/tmp/private.key.pub"

## Methods

- **.generate(overwrite, both):** generates private and/or public keys by parameters
- **.key(isPrivate):** returns content of key
- **.sign(data):** helper method to sign data with jsonwebtoken
- **.verify(token):** helper method to verify token with jsonwebtoken

## Examples

```js
const AuthJS = require('authjs');

const auth = new AuthJS({ expiresIn: '2 days' });
await auth.generate(); // async
const token = auth.sign(data, auth.key('private'));
const r = auth.verify(token, auth.key());
```
