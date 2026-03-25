type StoredEntry = {
  expiresAt: number | null;
  value: string;
};

export function createInMemoryRedisService() {
  const store = new Map<string, StoredEntry>();

  const getEntry = (key: string) => {
    const entry = store.get(key);

    if (!entry) {
      return null;
    }

    if (entry.expiresAt !== null && entry.expiresAt <= Date.now()) {
      store.delete(key);
      return null;
    }

    return entry;
  };

  const getTimeToLiveMilliseconds = (key: string) => {
    const entry = getEntry(key);

    if (!entry) {
      return -2;
    }

    if (entry.expiresAt === null) {
      return -1;
    }

    return Math.max(0, entry.expiresAt - Date.now());
  };

  const client = {
    async connect() {
      return undefined;
    },
    async del(key: string) {
      return store.delete(key) ? 1 : 0;
    },
    async get(key: string) {
      return getEntry(key)?.value ?? null;
    },
    async incr(key: string) {
      const existingEntry = getEntry(key);
      const nextValue = Number(existingEntry?.value ?? '0') + 1;

      store.set(key, {
        expiresAt: existingEntry?.expiresAt ?? null,
        value: String(nextValue),
      });

      return nextValue;
    },
    async pexpire(key: string, ttlMilliseconds: number) {
      const entry = getEntry(key);

      if (!entry) {
        return 0;
      }

      store.set(key, {
        ...entry,
        expiresAt: Date.now() + ttlMilliseconds,
      });

      return 1;
    },
    async ping() {
      return 'PONG';
    },
    async pttl(key: string) {
      return getTimeToLiveMilliseconds(key);
    },
    async quit() {
      return 'OK';
    },
    async set(key: string, value: string, ...args: Array<string | number>) {
      const existingEntry = getEntry(key);
      const hasNx = args.includes('NX');

      if (hasNx && existingEntry) {
        return null;
      }

      let expiresAt: number | null = existingEntry?.expiresAt ?? null;

      for (let index = 0; index < args.length; index += 1) {
        const argument = args[index];

        if (argument === 'EX') {
          const ttlSeconds = Number(args[index + 1]);
          expiresAt = Date.now() + ttlSeconds * 1000;
          index += 1;
          continue;
        }

        if (argument === 'PX') {
          const ttlMilliseconds = Number(args[index + 1]);
          expiresAt = Date.now() + ttlMilliseconds;
          index += 1;
        }
      }

      store.set(key, {
        expiresAt,
        value,
      });

      return 'OK';
    },
    get status() {
      return 'ready';
    },
  };

  return {
    getClient: () => client,
  };
}
