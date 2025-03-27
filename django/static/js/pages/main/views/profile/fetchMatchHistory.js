import request from '/static/js/utils/request.js';
import Path from '/static/js/utils/Path.js';

/**
 * Fetches match history for the current user or a specified user.
 * @param {string} path - The URL path (e.g., '/' for current user, '/displayName' for another user).
 * @param {number} offset - The offset for pagination.
 * @param {number} limit - The limit for pagination.
 * @returns {Promise<{status: number, data: Object|null, error: string|null}>} - The response object.
 */
export default async function fetchMatchHistory(path, offset, limit) {
    let url;
    if (path === '/') {
        url = `${Path.API.MATCH_HISTORY}?offset=${offset}&limit=${limit}`; // /api/match-history?offset=0&limit=10
    } else {
        const displayName = path.split('/')[1];
        url = `${Path.API.MATCH_HISTORY}/${displayName}?offset=${offset}&limit=${limit}`; // /api/match-history/:displayName?offset=0&limit=10
    }

    return await request('GET', url);
}