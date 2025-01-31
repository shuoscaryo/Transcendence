import Path from '/static/js/utils/Path.js';
import loadPage from '/static/js/utils/loadPage.js';
import getDefaultButton from '/static/js/components/defaultButton.js';

function getOtherLogin() {
    const component = document.createElement('div');

    const separatorDiv = document.createElement('div');
    separatorDiv.id = 'div-separator';
    separatorDiv.textContent = 'OR';
    component.appendChild(separatorDiv);

    const buttonContent = document.createElement('div');
    buttonContent.classList.add('button-content');
    
    const img = document.createElement('img');
    img.src = Path.img('42Logo.png');
    buttonContent.appendChild(img);

    const textDiv = document.createElement('div');
    textDiv.id = 'div-text';
    textDiv.textContent = 'Log in with 42';
    buttonContent.appendChild(textDiv);

    const fortitoButton = getDefaultButton({
        bgColor: 'var(--color-button-fortito)',
        bgHoverColor: 'var(--color-button-fortito-hover)',
        content: buttonContent,
        onClick: () => {loadPage('main','home');},
    });
    fortitoButton.classList.add('button-other-login');
    component.appendChild(fortitoButton);

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

    
    const loginButton = getDefaultButton({
        bgColor: 'var(--color-lime)',
        bgHoverColor: 'var(--color-lime-hover)',
        textColor: null,
        content: 'Log In',
        onClick: () => {loadPage('main','home');},
    });
    loginButton.id = 'button-login';
    divNormalLogin.appendChild(loginButton);

    const divOtherLogin = getOtherLogin();
    divOtherLogin.id = 'div-other-login';
    component.appendChild(divOtherLogin);
    
    return component;
}

export default async function getView(component, loadCssFunction) {
    await loadCssFunction([
    ]);

    const divUpper = getUpperHalf();
    divUpper.id = 'div-upper';
    component.appendChild(divUpper);

    /* The text for register */
    const divLower = document.createElement('div');
    divLower.id = 'div-lower';
    component.appendChild(divLower);

    const registerButton = document.createElement('button');
    registerButton.id = 'button-register';
    registerButton.addEventListener('click', () => {
        loadPage('login','register');
    });
    registerButton.textContent = 'New? Sign up - and start playing pong!';
    divLower.appendChild(registerButton);
}
