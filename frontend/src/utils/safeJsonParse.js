export default function safeJsonParse(value, fallback = null) {
    try {
        if (value === null || value === undefined) return fallback;
        return JSON.parse(value);
    } catch (_error) {
        return fallback;
    }
}
