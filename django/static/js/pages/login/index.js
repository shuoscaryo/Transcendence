import * as css from '/static/js/utils/css.js';
import Path from '/static/js/utils/Path.js';
import getHomeButton from '/static/js/components/homeButton.js';
import loadPage from '/static/js/utils/loadPage.js';

function getOtherLogin() {
    const component = document.createElement('div');

    const fortitoButton = document.createElement('button');
    fortitoButton.id = 'button-fortito';
    fortitoButton.textContent = 'Sign in with fortito';
    fortitoButton.addEventListener('click', () => {
        loadPage('main');
    });
    component.appendChild(fortitoButton);

    return component;
}

function getUpperHalf() {
    const component = document.createElement('div');

    const divForm = document.createElement('div');
    divForm.id = 'div-form';
    component.appendChild(divForm);

    const form = getForm();
    divForm.appendChild(form);

    const loginButton = document.createElement('button');
    loginButton.classList.add('button-green');
    loginButton.id = 'button-login';
    loginButton.textContent = 'Log In';
    loginButton.addEventListener('click', () => {
        loadPage('main');
    });
    divForm.appendChild(loginButton);

    const forgotPassword = document.createElement('button');
    forgotPassword.id = 'button-forgot-password';
    forgotPassword.textContent = 'Forgot Password?';
    forgotPassword.addEventListener('click', () => {
        loadPage('forgotPassword');
    });
    divForm.appendChild(forgotPassword);

    const divOtherLogin = getOtherLogin();
    divOtherLogin.id = 'div-other-login';
    component.appendChild(divOtherLogin);
    
    return component;
}

function getForm() {
    const component = document.createElement('form');

    const inputEmail = document.createElement('input');
    inputEmail.id = 'input-email';
    inputEmail.type = 'email';
    inputEmail.placeholder = 'Email';
    component.appendChild(inputEmail);

    const inputPassword = document.createElement('input');
    inputPassword.id = 'input-password';
    inputPassword.type = 'password';
    inputPassword.placeholder = 'Password';
    component.appendChild(inputPassword);

    return component;
}

function getLowerHalf() {
    const component = document.createElement('div');
    return component;
}

export default async function mainPage(view = null) {
    await css.loadPageCss([
    ]);
    await css.loadViewCss([
    ]);

    const app = document.getElementById('app');

    const page = document.createElement('div');
    page.id = 'page';
    app.appendChild(page);
    
    const content = document.createElement('div');
    content.id = 'content';
    page.appendChild(content);
    
    content.appendChild(getHomeButton());

    const divMain = document.createElement('div');
    divMain.id = 'div-main';
    content.appendChild(divMain);

    const divUpper = getUpperHalf();
    divUpper.id = 'div-upper';
    divMain.appendChild(divUpper);


    const divLower = getLowerHalf();
    divLower.id = 'div-lower';
    divMain.appendChild(divLower);

    const registerButton = document.createElement('button');
    registerButton.id = 'button-register';
    registerButton.addEventListener('click', () => {
        loadPage('register');
    });
    registerButton.textContent = 'Sign Up';
    divLower.appendChild(registerButton);
}
