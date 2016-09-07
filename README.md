[![Join the chat at https://gitter.im/Daplie/letsencrypt-express](https://badges.gitter.im/Daplie/letsencrypt-express.svg)](https://gitter.im/Daplie/letsencrypt-express?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

| [letsencrypt](https://github.com/Daplie/node-letsencrypt) (library)
| [letsencrypt-cli](https://github.com/Daplie/letsencrypt-cli)
| [letsencrypt-express](https://github.com/Daplie/letsencrypt-express)
| [letsencrypt-koa](https://github.com/Daplie/letsencrypt-koa)
| [letsencrypt-hapi](https://github.com/Daplie/letsencrypt-hapi)
|

le-challenge-dns
================

A dns-based strategy for node-letsencrypt for setting, retrieving,
and clearing ACME DNS-01 challenges issued by the ACME server

It creates a subdomain record for `_acme-challenge` wich `challenge`
to be tested by the ACME server.

```
_acme-challenge.example.com   TXT   xxxxxxxxxxxxxxxx    TTL 60
```

* Safe to use with node cluster
* Safe to use with ephemeral services (Heroku, Joyent, etc)

Install
-------

```bash
npm install --save le-challenge-dns@2.x
```

Usage
-----

```bash
var leChallengeDns = require('le-challenge-dns').create({
  email: 'john.doe@example.com'
, refreshToken: '...'
, ttl: 60

, debug: false
});

var LE = require('letsencrypt');

LE.create({
  server: LE.stagingServerUrl                               // Change to LE.productionServerUrl in production
, challengeType: 'dns-01'
, challenges: {
    'dns-01': leChallengeDns
  }
, approvedDomains: [ 'example.com' ]
});
```

NOTE: If you request a certificate with 6 domains listed,
it will require 6 individual challenges.

Exposed Methods
---------------

For ACME Challenge:

* `set(opts, domain, challange, keyAuthorization, done)`
* `get(defaults, domain, challenge, done)`
* `remove(defaults, domain, challenge, done)`

Note: `get()` is a no-op for `dns-01` and although `dns-01` does not use `keyAuthorization`,
it must be passed in as `null` to keep the correct method signature.

For node-letsencrypt internals:

* `getOptions()` returns the internal defaults merged with the user-supplied options
* `loopback(defaults, domain, challange, keyAuthorization, done)` should test, by external means, that the ACME server's challenge server will succeed
* `test(opts, domain, challange, keyAuthorization, done)` runs set, loopback, remove, loopback