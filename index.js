'use strict';

var PromiseA = require('bluebird');
var dns = PromiseA.promisifyAll(require('dns'));
var Challenge = module.exports;

var leDnsResponse;

Challenge.create = function (defaults) {
  return {
    getOptions: function () {
      return defaults || {};
    }
  , set: Challenge.set
  , get: Challenge.get
  , remove: Challenge.remove
  , loopback: Challenge.loopback
  , test: Challenge.test
  };
};

// Show the user the token and key and wait for them to be ready to continue
Challenge.set = function (args, domain, challenge, keyAuthorization, cb) {
  var keyAuthDigest = require('crypto').createHash('sha256').update(keyAuthorization||'').digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
    ;
  var challengeDomain = domain;

  if (this.leDnsResponse) {
      this.leDnsResponse(challenge, keyAuthorization, keyAuthDigest, challengeDomain, domain)
      .then((successMessage) => {
          cb(null);
      });
  } else {
    console.info("");
    console.info("Challenge for '" + domain + "'");
    console.info("");
    console.info("We now present (for you copy-and-paste pleasure) your ACME Challenge");
    console.info("public Challenge and secret KeyAuthorization and Digest, in that order, respectively:");
    console.info(challenge);
    console.info(keyAuthorization);
    console.info(keyAuthDigest);
    console.info("");
    console.info(challengeDomain + "\tTXT " + keyAuthDigest + "\tTTL 60");
    console.info("");
    console.info(JSON.stringify({
      domain: domain
    , challenge: challenge
    , keyAuthorization: keyAuthorization
    , keyAuthDigest: keyAuthDigest
    }, null, '  ').replace(/^/gm, '\t'));
    console.info("");
    console.info("hit enter to continue...");
    process.stdin.resume();
    process.stdin.on('data', function () {
      process.stdin.pause();
      cb(null);
    });
  }
};

// nothing to do here, that's why it's manual
Challenge.get = function (defaults, domain, challenge, cb) {
  cb(null);
};

// might as well tell the user that whatever they were setting up has been checked
Challenge.remove = function (args, domain, challenge, cb) {
    console.info("Challenge for '" + domain + "' complete. You may remove it.");
    cb(null);
  //});
};

Challenge.loopback = function (defaults, domain, challenge, done) {
  var challengeDomain = (defaults.test || '') + defaults.acmeChallengeDns + domain;
  console.log("dig TXT +noall +answer @8.8.8.8 '" + challengeDomain + "' # " + challenge);
  dns.resolveTxtAsync(challengeDomain).then(function (x) { done(null, x); }, done);
};

Challenge.test = function (args, domain, challenge, keyAuthorization, done) {
  var me = this;

  args.test = args.test || '_test.';
  defaults.test = args.test;

  me.set(args, domain, challenge, keyAuthorization || challenge, function (err, k) {
    if (err) { done(err); return; }

    me.loopback(defaults, domain, challenge, function (err, arr) {
      if (err) { done(err); return; }

      if (!arr.some(function (a) {
        return a.some(function (keyAuthDigest) {
          return keyAuthDigest === k;
        });
      })) {
        err = new Error("txt record '" + challenge + "' doesn't match '" + k + "'");
      }

      me.remove(defaults, domain, challenge, function (_err) {
        if (_err) { done(_err); return; }

        // TODO needs to use native-dns so that specific nameservers can be used
        // (otherwise the cache will still have the old answer)
        done(err || null);
        /*
        me.loopback(defaults, domain, challenge, function (err) {
          if (err) { done(err); return; }

          done();
        });
        */
      });
    });
  });
}
