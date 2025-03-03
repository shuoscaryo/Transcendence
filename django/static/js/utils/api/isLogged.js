export default async function isLogged() {
    try {
        const response = await fetch('/api/is-logged', { credentials: 'include' });
        const data = await response.json();
        return data.isLogged;
    } catch (error) {
        console.error('Session check failed:', error);
        return false;
    }
}