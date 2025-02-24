import Path from '/static/js/utils/Path.js';
import { navigate } from '/static/js/utils/router.js';
import getDefaultButton from '/static/js/components/defaultButton.js';
import apiIsLogged from '/static/js/utils/api/apiIsLogged.js';

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
        onClick: () => {navigate('/pages/main/home');},
    });
    fortitoButton.classList.add('button-other-login');
    component.appendChild(fortitoButton);

    return component;
}

function getInput(name, type, placeholder) {
    const component = document.createElement('div');

    const input = document.createElement('input');
    input.name = name;
    input.type = type;
    input.placeholder = placeholder;
    component.appendChild(input);

    const error = document.createElement('p');
    error.style.display = 'none';
    component.appendChild(error);
    return component;
}

function getForm() {
    const component = document.createElement('form');

    component.appendChild(getInput('username', 'text', 'Username'));
    component.appendChild(getInput('password', 'password', 'Password'));

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
        navigate('pages/forgotPassword');
    });
    divForm.appendChild(forgotPassword);

    
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

            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    credentials: 'include',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(jsonData)
                });

                const result = await response.json();
                if (response.ok) {
                    if (await apiIsLogged())
                        console.log('Logged in');
                    else
                        console.log('Not logged in');
                    navigate('/pages/main/home');
                } else {
                    alert(result.error);
                }
            } catch (error) {
                console.log('Request failed:', error);
            }
        },
    });
    loginButton.disabled = true;
    loginButton.id = 'button-login';
    divNormalLogin.appendChild(loginButton);
    disableButtonOnEvent(loginButton, form);

    const divOtherLogin = getOtherLogin();
    divOtherLogin.id = 'div-other-login';
    component.appendChild(divOtherLogin);
    
    return component;
}

export default async function getView(component, loadCssFunction, isLogged, data) {
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
        navigate('/pages/login/register');
    });
    registerButton.textContent = 'New? Sign up - and start playing pong!';
    divLower.appendChild(registerButton);
}
