import Path from '/static/js/utils/Path.js';
import { navigate } from '/static/js/utils/router.js';
import getDefaultButton from '/static/js/components/defaultButton.js';
import ViewScope from '/static/js/utils/ViewScope.js';
import getOtherLogin from '../getOtherLogin.js';

function getInput(name, type, placeholder) {
    const component = document.createElement('div');

    const input = document.createElement('input');
    input.name = name;
    input.type = type;
    input.placeholder = placeholder;
    component.append(input);

    const error = document.createElement('p');
    error.style.display = 'none';
    component.append(error);
    return component;
}

function getForm() {
    const component = document.createElement('form');

    component.append(getInput('username', 'text', 'Username'));
    component.append(getInput('password', 'password', 'Password'));

    return component;
}

function disableButtonOnEvent(button, form) {
    const checkInputs = () => {
        const formData = new FormData(form);
        const jsonData = {
            username: formData.get('username'),
            pw: formData.get('password'),
        };
        let disable = false;
        if (!jsonData.username || !jsonData.pw)
            disable = true;
        button.disabled = disable;
    };
    const inputs = form.querySelectorAll('input');
    inputs.forEach((input) => {
        input.addEventListener('input', checkInputs);
        input.addEventListener('blur', checkInputs);

    });
}

function getUpperHalf() {
    const component = document.createElement('div');

    const divNormalLogin = document.createElement('div');
    divNormalLogin.id = 'div-normal-login';
    component.append(divNormalLogin);

    const divForm = document.createElement('div');
    divForm.id = 'div-form';
    divNormalLogin.append(divForm);

    const form = getForm();
    divForm.append(form);

    const forgotPassword = document.createElement('button');
    forgotPassword.id = 'button-forgot-password';
    forgotPassword.textContent = 'Forgot Password?';
    forgotPassword.addEventListener('click', () => {
        navigate('pages/forgotPassword');
    });
    divForm.append(forgotPassword);

    
    const loginButton = getDefaultButton({
        bgColor: 'var(--color-lime)',
        bgHoverColor: 'var(--color-lime-hover)',
        textColor: null,
        content: 'Log In',
        onClick: async () => {
            if(loginButton.disabled)
                return;
            const formData = new FormData(form);
            const jsonData = {
                username: formData.get('username'),
                password: formData.get('password')
            };
            ViewScope.request('POST', Path.API.LOGIN, {
                body: jsonData,
                onResolve: (res) => {
                    if (res.status === 200)
                        navigate('/main/home');
                    else
                        alert(res.data.error ? res.data.error : 'An error occurred');
                },
            });
        },
    });
    loginButton.disabled = true;
    loginButton.id = 'button-login';
    divNormalLogin.append(loginButton);
    disableButtonOnEvent(loginButton, form);

    const divOtherLogin = getOtherLogin();
    divOtherLogin.id = 'div-other-login';
    component.append(divOtherLogin);
    
    return component;
}

export default async function getView(isLogged) {
    const css = [
    ];
    const component = document.createElement('div');

    const divUpper = getUpperHalf();
    divUpper.id = 'div-upper';
    component.append(divUpper);

    /* The text for register */
    const divLower = document.createElement('div');
    divLower.id = 'div-lower';
    component.append(divLower);

    const registerButton = document.createElement('button');
    registerButton.id = 'button-register';
    registerButton.addEventListener('click', () => {
        navigate('/login/register');
    });
    registerButton.textContent = 'New? Sign up - and start playing pong!';
    divLower.append(registerButton);

    return {status: 200, component, css};
}
