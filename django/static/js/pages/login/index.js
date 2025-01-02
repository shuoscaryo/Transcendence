import * as css from '/static/js/utils/css.js';
import Path from '/static/js/utils/Path.js';
import getHomeButton from '/static/js/components/homeButton.js';
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
    textDiv.textContent = 'Log in with 42';
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

    const inputPassword = document.createElement('input');
    inputPassword.id = 'input-password';
    inputPassword.type = 'password';
    inputPassword.placeholder = 'Password';
    component.appendChild(inputPassword);

    return component;
}

function getUpperHalf() {
    const component = document.createElement('div');

    const divNormalLogin = document.createElement('div');
    divNormalLogin.id = 'div-normal-login';
    component.appendChild(divNormalLogin);

    const divForm = document.createElement('div');
    divForm.id = 'div-form';
    divNormalLogin.appendChild(divForm);

    const form = getForm();
    divForm.appendChild(form);

    const forgotPassword = document.createElement('button');
    forgotPassword.id = 'button-forgot-password';
    forgotPassword.textContent = 'Forgot Password?';
    forgotPassword.addEventListener('click', () => {
        loadPage('forgotPassword');
    });
    divForm.appendChild(forgotPassword);
    
    const loginButton = document.createElement('button');
    loginButton.classList.add('button-green');
    loginButton.id = 'button-login';
    loginButton.textContent = 'Log In';
    loginButton.addEventListener('click', () => {
        loadPage('main');
    });
    divNormalLogin.appendChild(loginButton);

    const divOtherLogin = getOtherLogin();
    divOtherLogin.id = 'div-other-login';
    component.appendChild(divOtherLogin);
    
    return component;
}

export default async function mainPage() {
    await css.loadPageCss([
        Path.css("login/index.css"),
    ]);
    await css.loadViewCss([
        Path.css("login/login.css"),
    ]);

    const app = document.getElementById('app');

    const page = document.createElement('div');
    page.id = 'page';
    page.style.backgroundImage = `url("${Path.img('loginBackGround.png')}")`;
    page.style.backgroundSize = "contain"; // Ajusta sin deformarse
    page.style.backgroundRepeat = "no-repeat"; // Evita que el patrón se repita
    page.style.backgroundPosition = "center";
    page.style.imageRendering = "pixelated";
    app.appendChild(page);
    
    const content = document.createElement('div');
    content.id = 'content';
    page.appendChild(content);
    
    content.appendChild(getHomeButton());

    const main = document.createElement('main');
    content.appendChild(main);

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
        loadPage('register');
    });
    registerButton.textContent = 'New? Sign up - and start playing pong!';
    divLower.appendChild(registerButton);
}
