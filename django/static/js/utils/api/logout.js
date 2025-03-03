export default async function logout() {
    try {
        const response = await fetch('/api/logout', { method: 'POST', credentials: 'include' });
        return response.ok;
    } catch (error) {
        console.error('Request failed:', error);
        return false;
    }
}