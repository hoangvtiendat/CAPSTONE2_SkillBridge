import { toast } from 'sonner';

const cache = new Map();

const cleanup = (now) => {
    for (const [key, timestamp] of cache.entries()) {
        if (now - timestamp > 10000) {
            cache.delete(key);
        }
    }
};

const toastOnce = (type, message, options = {}, windowMs = 1800) => {
    const now = Date.now();
    cleanup(now);
    const key = `${type}:${message}`;
    const lastAt = cache.get(key);
    if (lastAt && now - lastAt < windowMs) return;
    cache.set(key, now);
    toast[type]?.(message, options);
};

export default toastOnce;
