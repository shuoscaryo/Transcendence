export default async function fetchProfileData(path, offset = 0, limit = 10) {
    let url;
    if (path.subPath === '/') {
        url = `/api/profile/?offset=${offset}&limit=${limit}`;
    } else {
        const username = path.subPath.split('/')[1];
        url = `/api/profile/${username}?offset=${offset}&limit=${limit}`;
    }

    const response = await fetch(url, {
        method: 'GET',
        credentials: 'include'
    });
    if (!response.ok) {
        return { status: response.status, error: await response.json() };
    }
    return response.json();
}