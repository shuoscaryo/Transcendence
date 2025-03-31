import request from '/static/js/utils/request.js';
import Path from '/static/js/utils/Path.js';

/**
 * Fetches profile data for the current user or a specified user.
 * @param {string} path - The URL path (e.g., '/' for current user, '/displayName' for another user).
 * @returns {Promise<{status: number, data: Object|null, error: string|null}>} - The response object.
 */
export default async function fetchStats(path) {
    let url;
    if (path === '/') {
        url = Path.API.STATS;
    } else {
        const displayName = path.split('/')[1];
        url = `${Path.API.STATS}/${displayName}`;
    }

    return await request('GET', url);
}