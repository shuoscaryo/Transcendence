import * as css from '/static/js/utils/css.js';
import Path from '/static/js/utils/Path.js';
import loadPage from '/static/js/utils/loadPage.js';

export default async function login() {
    await css.loadViewCss([
        Path.css("login/login.css"),
    ]);

    const main = document.createElement('main');

    const registerButton = document.createElement('button');
    registerButton.id = 'button-register';
    registerButton.addEventListener('click', () => {
        loadPage('login','login');
    });
    registerButton.textContent = 'New? Sign up - and start playing pong!';
    main.appendChild(registerButton);

    return main;
}