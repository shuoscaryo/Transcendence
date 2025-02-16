export default async function apiIsLogged() {
    try {
        const response = await fetch('/api/is-logged', { credentials: 'include' });
        return response.ok;
    } catch (error) {
        console.error('Session check failed:', error);
        return false;
    }
}