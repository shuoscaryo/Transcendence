import * as events from "/static/js/loginUtils/login_events.js"

export default function main() {
    // HTML para la página de login
    const page = document.createElement('div');
    page.innerHTML = `
        <h1>Register</h1>
        <form id="registerForm">
            <input type="text" id="username" placeholder="Username" required />
            <input type="email" id="email" placeholder="email" required />
            <input type="password" id="password" placeholder="Password" required />
            <button type="submit">register</button>
        </form>
        <button id="backToMain">Back to Main Menu</button>
    `;

    // Estilos para la página de login
    const styles = document.createElement('style');
    styles.textContent = `
        #loginForm {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            max-width: 200px;
            margin: 0 auto;
        }
        #loginForm input {
            padding: 0.5rem;
            font-size: 1rem;
        }
        #loginForm button {
            padding: 0.5rem;
            font-size: 1rem;
            background-color: #007bff;
            color: white;
            border: none;
            cursor: pointer;
        }
        #loginForm button:hover {
            background-color: #0056b3;
        }
        #backToMain {
            margin-top: 1rem;
            padding: 0.5rem;
            font-size: 1rem;
            background-color: #6c757d;
            color: white;
            border: none;
            cursor: pointer;
        }
        #backToMain:hover {
            background-color: #5a6268;
        }
    `;

    // Agregar evento de submit al formulario
    const form = page.querySelector('#registerForm');
    form.addEventListener('submit', (event) => events.handleRegisterSubmit(event, form));

    // Add event listener to back button
    const backToMain = page.querySelector('#backToMain');
    backToMain.addEventListener('click', () => events.handleBackToMain(page));

    return {page, styles};
}
