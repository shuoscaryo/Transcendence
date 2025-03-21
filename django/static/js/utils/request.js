/**
 * Generalized function to make an HTTP request to an API url.
 * @param {string} method - The HTTP method (e.g., 'GET', 'POST').
 * @param {string} url - The backend URL (in urls.py) (use Path class for this: Path.API.GET_FRIENDS_LIST).
 * @param {Object} [data] - The data to send in the request body (optional, for POST/PUT/etc.).
 * @returns {Promise<{status: number, data: Object|null, error: string|null}>} - The response object.
 */
export default async function request(method, url, data = null) {
    if (!method || !url) {
        throw new Error('Missing required parameters in request function');
    }
    try {
        const options = {
            method: method.toUpperCase(),
            credentials: 'include'
        };

        if (data) {
            options.headers = {
                'Content-Type': 'application/json'
            };
            options.body = JSON.stringify(data);
        }

        const response = await fetch(url, options);

        if (!response.ok) {
            return {
                status: response.status,
                data: null,
                error: `Error in ${method} request to ${url}`
            };
        }

        const contentLength = response.headers.get('Content-Length');
        let responseData = null;
        if (contentLength)
            responseData = await response.json();
        return {
            status: response.status,
            data: responseData,
            error: null
        };
    } catch (error) {
        return {
            status: 500,
            data: null,
            error: error.message
        };
    }
}