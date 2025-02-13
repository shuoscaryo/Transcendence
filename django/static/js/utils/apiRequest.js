"use strict";

export default async function apiRequest(url, method = 'GET', data = null) {
    const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
    };

    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(url, options);
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Request failed');
        }

        return result; // Retorna la respuesta JSON si todo salió bien
    } catch (error) {
        console.error(`Error in ${method} ${url}:`, error.message);
        return { error: error.message };
    }
}
