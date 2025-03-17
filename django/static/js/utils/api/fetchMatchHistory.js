export default async function fetchMatchHistory(path, offset, limit) {
    let url;
    if (path === '/') {
        url = `/api/match-history/?offset=${offset}&limit=${limit}`;
    } else {
        const username = path.split('/')[1];
        url = `/api/match-history/${username}?offset=${offset}&limit=${limit}`;
    }

    try {
        const response = await fetch(url, { method: 'GET' });
        if (!response.ok)
            return {
                status: response.status,
                data: null, error:
                'Error fetching match history'
            };
        const data = await response.json();
        return {
            status: response.status,
            data,
            error: null
        }
    } catch (error) {
        return { status: 500, data: null, error: 'Network error' };
    }
}
