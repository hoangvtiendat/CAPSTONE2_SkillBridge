import { API_BASE_URL } from '../config/appConfig';

const SVG_PLACEHOLDER = (bg, fg, label) =>
    `data:image/svg+xml;utf8,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="100%" height="100%" fill="${bg}"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="${fg}" font-size="36" font-family="Arial, sans-serif" font-weight="700">${label}</text></svg>`
    )}`;

export const DEFAULT_AVATAR_IMAGE = SVG_PLACEHOLDER('#e2e8f0', '#475569', 'U');
export const DEFAULT_COMPANY_IMAGE = SVG_PLACEHOLDER('#eef2ff', '#4f46e5', 'C');

export const resolveImageUrl = (path) => {
    if (!path || path === 'null' || path === 'undefined') return '';
    if (path.startsWith('http')) return path;
    const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${cleanPath}`;
};
