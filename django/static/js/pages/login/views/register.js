import * as css from '/static/js/utils/css.js';
import Path from '/static/js/utils/Path.js';
import loadPage from '/static/js/utils/loadPage.js';

function getOtherLogin() {
    const component = document.createElement('div');

    const separatorDiv = document.createElement('div');
    separatorDiv.id = 'div-separator';
    separatorDiv.textContent = 'OR';
    component.appendChild(separatorDiv);

    const fortitoButton = document.createElement('button');
    fortitoButton.id = 'button-fortito';
    fortitoButton.addEventListener('click', () => {
        loadPage('main');
    });
    component.appendChild(fortitoButton);

    const imgDiv = document.createElement('div');
    imgDiv.id = 'div-img';
    fortitoButton.appendChild(imgDiv);

    const img = document.createElement('img');
    img.src = Path.img('42Logo.png');
    imgDiv.appendChild(img);

    const textDiv = document.createElement('div');
    textDiv.id = 'div-text';
    textDiv.textContent = 'Continue with 42';
    fortitoButton.appendChild(textDiv);

    return component;
}

function getForm() {
    const component = document.createElement('form');

    const inputEmail = document.createElement('input');
    inputEmail.id = 'input-email';
    inputEmail.type = 'email';
    inputEmail.placeholder = 'Email';
    component.appendChild(inputEmail);

    const username = document.createElement('input');
    username.id = 'input-username';
    username.type = 'text';
    username.placeholder = 'Username';
    component.appendChild(username);

    const inputPassword = document.createElement('input');
    inputPassword.id = 'input-password';
    inputPassword.type = 'password';
    inputPassword.placeholder = 'Password';
    component.appendChild(inputPassword);

    const repeatPassword = document.createElement('input');
    repeatPassword.id = 'input-repeat-password';
    repeatPassword.type = 'password';
    repeatPassword.placeholder = 'Repeat Password';
    component.appendChild(repeatPassword);

    return component;
}

function getUpperHalf() {
    const component = document.createElement('div');

    const divNormalLogin = document.createElement('div');
    divNormalLogin.id = 'div-normal-login';
    component.appendChild(divNormalLogin);

    const h1 = document.createElement('h1');
    h1.textContent = 'Create A New Account!';
    divNormalLogin.appendChild(h1);

    const divForm = document.createElement('div');
    divForm.id = 'div-form';
    divNormalLogin.appendChild(divForm);

    const form = getForm();
    divForm.appendChild(form);
    
    const loginButton = document.createElement('button');
    loginButton.classList.add('button-green');
    loginButton.id = 'button-login';
    loginButton.textContent = 'Sign Up';
    loginButton.addEventListener('click', () => {
        loadPage('main');
    });
    divNormalLogin.appendChild(loginButton);

    const divOtherLogin = getOtherLogin();
    divOtherLogin.id = 'div-other-login';
    component.appendChild(divOtherLogin);
    
    return component;
}

export default async function login() {
    await css.loadViewCss([
        Path.css("login/login.css"),
    ]);

    const main = document.createElement('main');
    const divUpper = getUpperHalf();
    divUpper.id = 'div-upper';
    main.appendChild(divUpper);

    /* The text for register */
    const divLower = document.createElement('div');
    divLower.id = 'div-lower';
    main.appendChild(divLower);

    const registerButton = document.createElement('button');
    registerButton.id = 'button-register';
    registerButton.addEventListener('click', () => {
        loadPage('login','login');
    });
    registerButton.textContent = 'Log In';
    divLower.appendChild(registerButton);

    return main;
}
