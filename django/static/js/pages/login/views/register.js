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
        onClick: () => {loadPage('/pages/main/home');},
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
    const emailDiv = getInput('email', 'email', 'Email');
    const emailInput = emailDiv.querySelector('input');
    emailInput.addEventListener("blur", () => {
        const value = emailInput.value;
        const errorMsg = emailDiv.querySelector('p');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            errorMsg.textContent = 'Invalid email address';
            errorMsg.style.display = 'block';
        } else {
            errorMsg.style.display = 'none';
        }
        if (value === '') {
            errorMsg.style.display = 'none';
        }
    });
    component.appendChild(emailDiv);
    

    const usernameDiv = getInput('username', 'text', 'Username');
    const usernameInput = usernameDiv.querySelector('input');
    usernameInput.addEventListener("blur", () => {
        const value = usernameInput.value;
        const errorMsg = usernameDiv.querySelector('p');
        if (/[^a-zA-Z0-9_]/.test(value)) {
            errorMsg.textContent = 'Username contains invalid characters';
            errorMsg.style.display = 'block';
        }
        else if (value.length < 3) {
            errorMsg.textContent = 'Username must be at least 3 characters long';
            errorMsg.style.display = 'block';
        }
        else if (value.length > 20) {
            errorMsg.textContent = 'Username must be at most 20 characters long';
            errorMsg.style.display = 'block';
        }
        else {
            errorMsg.style.display = 'none';
        }
        if (value === '') {
            errorMsg.style.display = 'none';
        }
    });
    component.appendChild(usernameDiv);

    const pwDiv = getInput('password', 'password', 'Password');
    const pwInput = pwDiv.querySelector('input');
    pwInput.addEventListener("input", () => {
        const value = pwInput.value;
        const errorMsg = pwDiv.querySelector('p');
        if (value.length < 8 || !/[A-Z]/.test(value) || !/[a-z]/.test(value) || !/[^a-zA-Z0-9]/.test(value)) {
            errorMsg.textContent = 'Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, and one special character';
            errorMsg.style.display = 'block';
        } else {
            errorMsg.style.display = 'none';
        }
    });
    pwInput.addEventListener("blur", () => {
        const value = pwInput.value;
        if( value === '') {
            pwDiv.querySelector('p').style.display = 'none';
        }
    });
    component.appendChild(pwDiv);

    const repPwDiv = getInput('repeat-password', 'password', 'Repeat Password');
    const repPwInput = repPwDiv.querySelector('input');
    repPwInput.addEventListener("input", () => {
        const value = repPwInput.value;
        const errorMsg = repPwDiv.querySelector('p');
        if (value !== pwInput.value) {
            errorMsg.textContent = 'Passwords do not match';
            errorMsg.style.display = 'block';
        } else {
            errorMsg.style.display = 'none';
        }
    });
    component.appendChild(repPwDiv);

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
    
    const loginButton = getDefaultButton({
        bgColor: 'var(--color-lime)',
        bgHoverColor: 'var(--color-lime-hover)',
        textColor: null,
        content: 'Sign Up',
        onClick: async () => {
            const formData = new FormData(form);
            const jsonData = {
                email: formData.get('email'),
                username: formData.get('username'),
                password: formData.get('password'),
            };

            if (formData.get('password') !== formData.get('repeat-password')) {
                alert('Passwords do not match');
                return;
            }

            try {
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(jsonData)
                });

                const result = await response.json();
                if (response.ok) {
                    alert('Account created successfully');
                    loadPage('/pages/main/home');
                } else {
                    alert(result.error);
                }
            } catch (error) {
                console.log('Request failed:', error);
            }
        },
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
        loadPage('pages/login/login');
    });
    registerButton.textContent = 'Already have an account? Log in';
    divLower.appendChild(registerButton);

    const TMP = getDefaultButton({
        bgColor: 'var(--color-button-fortito)',
        content: 'Toggle popups',
        onClick: () => {
            const popups = document.querySelectorAll('.popup');
            popups.forEach((popup) => {
                popup.classList.toggle('hidden');
            });
        },
    });
}
