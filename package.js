Package.describe({
  name: 'leaf4monkey:sync-redis',
  version: '0.0.1',
  // Brief, one-line summary of the package.
  summary: 'A synced redis client.',
  // URL to the Git repository containing the source code for this package.
  git: 'git@github.com:leaf4monkey/sync-redis.git',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Npm.depends({
  "redis": "2.6.2",
  "redis-commands": "1.2.0",
  'lodash': '4.14.2'
});

Package.onUse(function(api) {
  api.versionsFrom('1.4.1');
  api.use([
    'ecmascript',
    'ejson',
    'leaf4monkey:prototype-extensions',
    'mongo'
  ], 'server');
  api.mainModule('sync-redis.js', 'server');
});

//Package.onTest(function(api) {
//  api.use('ecmascript');
//  api.use('tinytest');
//  api.use('leaf4monkey:sync-redis');
//  api.mainModule('sync-redis-tests.js');
//});
