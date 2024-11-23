export async function handleLoginSubmit(event, form) {
    event.preventDefault();

    const username = form.querySelector('#username').value;
    const password = form.querySelector('#password').value;

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });

        if (response.ok) {
            alert('Login successful');
            history.back();
        } else {
            alert('Login failed');
        }
    } catch (error) {
        console.error('Error during login:', error);
        alert('An error occurred. Please try again.');
    }
}

export function handleBackToMain() {
    document.getElementById('app').innerHTML = '';
    history.back();
}