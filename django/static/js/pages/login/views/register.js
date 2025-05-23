import Path from '/static/js/utils/Path.js';
import { navigate } from '/static/js/utils/router.js';
import getDefaultButton from '/static/js/components/defaultButton.js';
import { usernameOk, pwOk } from '/static/js/utils/validators.js';
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

    const usernameDiv = getInput('username', 'text', 'Username');
    const usernameInput = usernameDiv.querySelector('input');
    usernameInput.addEventListener("focus", () => {
        usernameDiv.querySelector('p').style.display = 'none';
        usernameInput.classList.remove('error-input');
    });
    usernameInput.addEventListener("blur", () => {
        const value = usernameInput.value;
        const errorMsg = usernameDiv.querySelector('p');
        if (!usernameOk(value)) {
            errorMsg.textContent = 'Username must be between 3 and 20 characters long and contain only letters, numbers, and underscores';
            errorMsg.style.display = 'block';
            usernameInput.classList.add('error-input');
        }
        else {
            errorMsg.style.display = 'none';
            usernameInput.classList.remove('error-input');
        }
        if (value === '') {
            errorMsg.style.display = 'none';
            usernameInput.classList.remove('error-input');
        }
    });
    component.append(usernameDiv);

    const displayNameDiv = getInput('display_name', 'text', 'display name');
    const displayNameInput = displayNameDiv.querySelector('input');
    displayNameInput.addEventListener("focus", () => {
        displayNameDiv.querySelector('p').style.display = 'none';
        displayNameInput.classList.remove('error-input');
    });
    displayNameInput.addEventListener("blur", () => {
        const value = displayNameInput.value;
        const errorMsg = displayNameDiv.querySelector('p');
        if (!usernameOk(value)) {
            errorMsg.textContent = 'display name must be between 3 and 20 characters long and contain only letters, numbers, and underscores';
            errorMsg.style.display = 'block';
            displayNameInput.classList.add('error-input');
        }
        else {
            errorMsg.style.display = 'none';
            displayNameInput.classList.remove('error-input');
        }
        if (value === '') {
            errorMsg.style.display = 'none';
            displayNameInput.classList.remove('error-input');
        }
    });
    component.append(displayNameDiv);

    const pwDiv = getInput('password', 'password', 'Password');
    const pwInput = pwDiv.querySelector('input');
    component.append(pwDiv);
    
    const repPwDiv = getInput('repeat-password', 'password', 'Repeat Password');
    const repPwInput = repPwDiv.querySelector('input');
    component.append(repPwDiv);

    pwInput.addEventListener("input", () => {
        const value = pwInput.value;
        const errorMsg = pwDiv.querySelector('p');
        if (!pwOk(value)) {
            errorMsg.textContent = 'Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, and one special character';
            errorMsg.style.display = 'block';
            pwInput.classList.add('error-input');
        } else {
            errorMsg.style.display = 'none';
            pwInput.classList.remove('error-input');
        }
        if (value != repPwInput.value && repPwInput.value !== '') {
            repPwDiv.querySelector('p').textContent = 'Passwords do not match';
            repPwDiv.querySelector('p').style.display = 'block';
            repPwInput.classList.add('error-input');
        }
        else {
            repPwDiv.querySelector('p').style.display = 'none';
            repPwInput.classList.remove('error-input');
        }
    });
    pwInput.addEventListener("blur", () => {
        if(pwInput.value === '') {
            pwDiv.querySelector('p').style.display = 'none';
            pwInput.classList.remove('error-input');
        }
    });
    repPwInput.addEventListener("input", () => {
        const value = repPwInput.value;
        const errorMsg = repPwDiv.querySelector('p');
        if (value !== pwInput.value) {
            errorMsg.textContent = 'Passwords do not match';
            errorMsg.style.display = 'block';
            repPwInput.classList.add('error-input');
        } else {
            errorMsg.style.display = 'none';
            repPwInput.classList.remove('error-input');
        }
    });

    return component;
}

function disableButtonOnEvent(button, form) {
    const checkInputs = () => {
        const formData = new FormData(form);
        const jsonData = {
            username: formData.get('username'),
            display_name: formData.get('display_name'),
            pw: formData.get('password'),
            repPw: formData.get('repeat-password'),
        };
        let disable = false;
        if (!usernameOk(jsonData.username)
            || !usernameOk(jsonData.display_name)
            || !pwOk(jsonData.pw)
            || jsonData.pw !== jsonData.repPw)
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

    const h1 = document.createElement('h1');
    h1.textContent = 'Create A New Account!';
    divNormalLogin.append(h1);

    const divForm = document.createElement('div');
    divForm.id = 'div-form';
    divNormalLogin.append(divForm);

    const form = getForm();
    divForm.append(form);

    const loginButton = getDefaultButton({
        bgColor: 'var(--color-lime)',
        bgHoverColor: 'var(--color-lime-hover)',
        textColor: null,
        content: 'Sign Up',
        onClick: async () => {
            if (loginButton.disabled)
                return;
            const formData = new FormData(form);
            const jsonData = {
                username: formData.get('username'),
                display_name: formData.get('display_name'),
                password: formData.get('password'),
            };
            ViewScope.request('POST', Path.API.REGISTER, {
                body: jsonData,
                onResolve: (res) => {
                    if (res.status === 200) {
                        alert('Account created successfully');
                        navigate('/main/home');
                    } else
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
        navigate('/login/login');
    });
    registerButton.textContent = 'Already have an account? Log in';
    divLower.append(registerButton);

    return {status: 200, component, css};
}
