const normalizeBaseUrl = (url) => String(url || '').replace(/\/+$/, '');

const API_BASE_URL = normalizeBaseUrl(
    process.env.REACT_APP_API_BASE_URL || 'http://localhost:8081/api/v1'
);

const WS_ENDPOINT = `${API_BASE_URL}/ws-log`;

export { API_BASE_URL, WS_ENDPOINT };
