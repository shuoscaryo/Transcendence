export default async function fetchProfileData(path) {
    let url;
    if (path === '/') {
        url = `/api/profile/`;
    } else {
        const username = path.split('/')[1];
        url = `/api/profile/${username}`;
    }

    try {
        const response = await fetch(url, {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok)
            return {
                status: response.status,
                data: null,
                error: 'Error fetching profile'
            };

        const data = await response.json();
        return {
            status: response.status,
            data,
            error: null
        };
    } catch (error) {
        return { status: 500, data: null, error: 'Network error' };
    }
}
