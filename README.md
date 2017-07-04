# leaf4monkey:sync-redis

## APIs

- `Redis.defaultClient:` 默认的客户端实例

- `Redis.initializeDefault(options):` 初始化 `Redis.defaultClient`
    
- `Redis.register(options):` 注册并返回一个新的客户端实例

- `Redis.getConnection(name):` 返回指定名称的客户端实例

- `redisClient.rawClient:` 该实例对应的源客户端实例

- `redisClient.connect():` 使客户端实例尝试连接与服务端