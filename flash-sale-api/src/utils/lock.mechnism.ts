import { NodeRedisAdapter, createLock, type Lock } from 'redlock-universal';
import type { RedisClientType } from 'redis';
import { injectable } from 'tsyringe';

@injectable()
export class LockMechanism {
  private adapter: NodeRedisAdapter;
  private keyPrefix = 'lock:';
  constructor(nodeRedisClient: RedisClientType) {
    this.adapter = new NodeRedisAdapter(nodeRedisClient);
  }

  createLockFor(resourceKey: string, ttl = 30_000) {
    const lock = createLock({
      adapter: this.adapter,
      key: `${this.keyPrefix}${resourceKey}`,
      ttl,
    });
    return lock;
  }
}
