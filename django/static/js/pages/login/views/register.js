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

function usernameOk(username) {
    return username !== '' && /^[a-zA-Z0-9_]{3,20}$/.test(username);
}

function emailOk(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function pwOk(pw) {
    return pw.length >= 8
        && /[A-Z]/.test(pw)
        && /[a-z]/.test(pw)
        && /[^a-zA-Z0-9]/.test(pw);
}

function getForm() {
    const component = document.createElement('form');
    const emailDiv = getInput('email', 'email', 'Email');
    const emailInput = emailDiv.querySelector('input');
    emailInput.addEventListener("focus", () => {
        emailDiv.querySelector('p').style.display = 'none';
        emailInput.classList.remove('error-input');
    });
    emailInput.addEventListener("blur", () => {
        const value = emailInput.value;
        const errorMsg = emailDiv.querySelector('p');
        if (!emailOk(value)) {
            errorMsg.textContent = 'Invalid email address';
            errorMsg.style.display = 'block';
            emailInput.classList.add('error-input');
        } else {
            errorMsg.style.display = 'none';
            emailInput.classList.remove('error-input');
        }
        if (value === '') {
            errorMsg.style.display = 'none';
            emailInput.classList.remove('error-input');
        }
    });
    component.appendChild(emailDiv);
    

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
    component.appendChild(usernameDiv);

    const pwDiv = getInput('password', 'password', 'Password');
    const pwInput = pwDiv.querySelector('input');
    component.appendChild(pwDiv);
    
    const repPwDiv = getInput('repeat-password', 'password', 'Repeat Password');
    const repPwInput = repPwDiv.querySelector('input');
    component.appendChild(repPwDiv);

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
            email: formData.get('email'),
            username: formData.get('username'),
            pw: formData.get('password'),
            repPw: formData.get('repeat-password'),
        };
        let disable = false;
        if (!emailOk(jsonData.email)
            || !usernameOk(jsonData.username)
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
            if (loginButton.disabled)
                return;
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
    loginButton.disabled = true;
    loginButton.id = 'button-login';
    divNormalLogin.appendChild(loginButton);
    disableButtonOnEvent(loginButton, form);

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
