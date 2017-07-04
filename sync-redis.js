/**
 * Created on 2016/9/6.
 * @fileoverview 请填写简要的文件说明.
 * @author joc (Chen Wen)
 */
import redis from 'redis';
import commands from 'redis-commands';
import _ from 'lodash';
import {Meteor} from 'meteor/meteor';
import {Mongo, MongoInternals} from 'meteor/mongo';

let {REDIS_URL} = process.env;
let wrapAsync = Meteor.wrapAsync || Meteor._wrapAsync;
let wrapAsyncExec = function (fn, ctx, ...args) {
    return wrapAsync(fn.bind(ctx || (Redis.defaultClient && Redis.defaultClient.rawClient)))(...args);
};

let initClient = function (_client, options = {}) {
    let onReady = function (client) {
        if (client.initialized) {
            return client;
        }
        Redis.globalEvents.onInitialization && Redis.globalEvents.onInitialization(client);
        options.onInitialization && options.onInitialization(_client);
        client.initialized = true;
    };

    let client = {rawClient: _client};

    commands.list.forEach((method) => {
        let func = _client[method];

        if (!_.isFunction(func)) {
            return client[method] = func;
        }

        method = method.toLowerCase();
        client[method] = wrapAsync(func.bind(_client));
    });
    client.wrapAsyncExec = wrapAsyncExec;

    [
        'ready',
        'reconnecting',
        'error',
        'end'
    ].forEach((status) => {
        _client.on(status, () => {
            client.status = status;
            if (status === 'ready') {
                onReady(client);
            }
            let event = 'on' + status.capitalize();
            console.log(`redis [name: ${options.name}]`, status);
            Redis.globalEvents[event] && Redis.globalEvents[event](client);
            options[event] && options[event](client);
        });
    });
    return client;
};

const Redis = {register, connections: {}, globalEvents: {}, getConnection};

function register (options) {
    let ret = {
        options,
        name: options.name,
        connect: () => _.extend(ret, connect(options))
    };
    if (options.name && Redis.connections[options.name]) {
        throw new Error(`name: ${options.name} registered.`);
    }
    Redis.connections[options.name || options.url] = ret;
    return ret;
}

function getConnection (name) {
    return Redis.connections[name];
}

function connect (options = {}) {
    options = _.extend({}, Meteor.settings.redisConnectConfigs, options);
    let {retryOptions = {}} = options;
    let {
        maxRetrySeconds = 60 * 60,
        maxConnectTimes = 10,
        attemptFactor = 100,
        minRetryInterval = 3000
        } = retryOptions;

    options = _.omit(options, 'retryOptions');

    options.url = options.url || REDIS_URL;
    options.retry_strategy = function (options) {
        let error;
        options.error && console.error(options.error.toString());
        if ((options.error || {}).code === 'ECONNREFUSED') {
            // End reconnecting on a specific error and flush all commands with a individual error
            error = new Error('server-refused', 'The server refused the connection');
        }
        if ((options.total_retry_time || options.totalRetryTime) > 1000 * maxRetrySeconds) {
            // End reconnecting after a specific timeout and flush all commands with a individual error
            error = new Error('retry-time-exhausted', 'Retry time exhausted');
        }

        if (error) {
            console.error(error);
            return;
        }

        if ((options.times_connected || options.timesConnected) > maxConnectTimes) {
            // End reconnecting with built in error
            console.log('End reconnecting with built in error');
            return;
        }

        // reconnect after
        let after = Math.max(options.attempt * attemptFactor, minRetryInterval);
        console.log(`reconnect after ${after}, attempt=${options.attempt}`);
        return after;
    };

    let client = initClient(redis.createClient(options), options);
    client.url = options.url;
    return client;
}

Redis.connections.defaultClient = Redis.defaultClient = Redis.register({name: 'defaultConn'});
Redis.initializeDefault = function (options) {
    Redis.defaultClient.options =
        _.extend(Redis.defaultClient.options || {}, {url: REDIS_URL}, options);
    try {
        REDIS_URL && Redis.defaultClient.connect();
    } catch (e) {
        console.error(e, e.stack);
    }
};
Redis.wrapAsyncExec = wrapAsyncExec;
Redis.registerGlobalEvents = (events) =>
    _.each(events, (callback, event) => {
        Redis.globalEvents['on' + event.capitalize()] = callback;
    });

export default Redis;