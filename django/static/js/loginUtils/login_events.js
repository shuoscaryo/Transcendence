import { navigate } from '/static/js/utils/router.js';

export async function handleLoginSubmit(event, form) {
    event.preventDefault();

    const username = form.querySelector('#username').value;
    const password = form.querySelector('#password').value;

    try {
        const response = await fetch('/accounts/login/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });

        if (response.ok) {
            alert('Login successful');
            document.getElementById('app').innerHTML = '';
            history.back();
        } else {
            alert('Login failed');
        }
    } catch (error) {
        console.error('Error during login:', error);
        alert('An error occurred. Please try again.');
    }
}

export async function handleRegisterSubmit(event, form) {
    event.preventDefault();

    const username = form.querySelector('#username').value;
    const email = form.querySelector('#email').value;
    const password = form.querySelector('#password').value;

    try {
        const response = await fetch('/accounts/register/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username,
                email,
                password,
            }),
        });

        if (response.ok) {
            alert('user registered successfuly');
            document.getElementById('app').innerHTML = '';
            history.back();
        } else {
            alert('Registration failed');
        }
    } catch (error) {
        console.error('Error during registration:', error);
        alert('An error occurred. Please try again.');
    }
}

export function handleBackToMain() {
    document.getElementById('app').innerHTML = '';
    history.back();
}

export function handleRegister() {
    navigate('pages/register');
}
