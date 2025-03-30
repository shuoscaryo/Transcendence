import Path from '/static/js/utils/Path.js';
import newElement from "/static/js/utils/newElement.js";
import request from "/static/js/utils/request.js";
import {navigate} from "/static/js/utils/router.js";
import * as validators from "/static/js/utils/validators.js";

function getPhotoSection(profile) {
    const component = newElement('section', { classList: ['section-block'], id: 'photo-section'});

    const profileImgContainer = newElement('div', {id: 'profile-img-container', parent: component});
    const profileImg = newElement('img', {parent: profileImgContainer});
    profileImg.src = profile.profile_photo;
    const changePhotoButton = newElement('button', {parent: profileImgContainer});
    changePhotoButton.textContent = 'Change Photo';

    // Hidden element that triggers when the user clicks on the change photo button
    const fileInput = newElement('input', {parent: profileImgContainer});
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';

    // change photo button triggers the file input
    changePhotoButton.addEventListener('click', () => {
        fileInput.click();
    });

    // When the user selects a file, upload it to the server
    fileInput.addEventListener('change', async () => {
        const file = fileInput.files[0];
        if (!file) return;
    
        const formData = new FormData();
        formData.append('profile_photo', file);
    
        try {
            const res = await fetch('/api/update_credentials/profile_photo', {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });
    
            if (!res.ok) {
                if (res.status === 413) {
                    alert('Image too large. Max size is 10MB.');
                    return;
                }
                const err = await res.json();
                alert('Upload failed: ' + (err.error || res.status));
                return;
            }
    
            const data = await res.json();
            profileImg.src = data.profile_photo; // Update image preview
        } catch (err) {
            alert('Error uploading image.');
            console.error(err);
        }
    });

    const userInfo = newElement('div', {id: 'user-info', parent: component});
    const displayName = newElement('h1', {parent: userInfo});
    displayName.textContent = profile.display_name;
    displayName.addEventListener('click', () => {navigate('/pages/main/profile');});

    return component;
}

function getInputRow(label, type, name, placeholder, required = true) {
    const component = newElement('div', {classList: ['input-row']});
    
    // component
    const labelElement = newElement('label', {parent: component});
    labelElement.textContent = label;
    const input = newElement('input', {parent: component});
    input.type = type;
    input.name = name;
    input.placeholder = placeholder;
    input.required = required;
    
    return component;
}

function getUserUpdatesSection() {
    const component = newElement('section', { classList: ['section-block']});

    const userForm = newElement('form', {parent: component, classList: ['credential-update']});
    userForm.method = "POST";
    userForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(userForm);
        const username = formData.get('username');
        const password = formData.get('password');
        if (!validators.usernameOk(username)) {
            alert('Invalid username');
            return;
        }
        const response = await request('POST', Path.join(Path.API.UPDATE_CREDENTIALS, "username"), { value: username, password });
        if (response.status !== 200) {
            alert(response.error);
            return;
        }
        alert('Username updated');
        navigate();
    });
    const usernameInput = getInputRow('Username:', 'text', 'username', 'username', true);
    userForm.append(usernameInput);
    const usernamePwInput = getInputRow('Password:', 'password', 'password', 'password', true);
    userForm.append(usernamePwInput);
    const usernameButton = newElement('button', {parent: userForm});
    usernameButton.textContent = 'Save';


    const displayNameForm = newElement('form', {parent: component, classList: ['credential-update']});
    displayNameForm.method = "POST";
    displayNameForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(displayNameForm);
        const displayName = formData.get('display_name');
        const password = formData.get('password');
        if (!validators.usernameOk(displayName)) {
            alert('Invalid display name');
            return;
        }
        const response = await request('POST', Path.join(Path.API.UPDATE_CREDENTIALS, "display_name"), { value: displayName, password });
        if (response.status !== 200) {
            alert(response.error);
            return;
        }
        alert('display name updated');
        navigate();
    });
    const displayNameInput = getInputRow('Display name:', 'text', 'display_name', 'display name', true);
    displayNameForm.append(displayNameInput);
    const displayNamePwInput = getInputRow('Password:', 'password', 'password', 'password', true);
    displayNameForm.append(displayNamePwInput);
    const displayNameButton = newElement('button', {parent: displayNameForm});
    displayNameButton.textContent = 'Save';

    const emailForm = newElement('form', {parent: component, classList: ['credential-update']});
    emailForm.method = "POST";
    emailForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(emailForm);
        const email = formData.get('email');
        const password = formData.get('password');
        if (!validators.emailOk(email)) {
            alert('Invalid email');
            return;
        }
        const response = await request('POST', Path.join(Path.API.UPDATE_CREDENTIALS, "email"), { value: email, password });
        if (response.status !== 200) {
            alert(response.error);
            return;
        }
        alert('email updated');
        navigate();
    });
    const emailInput = getInputRow('Email:', 'email', 'email', 'email', true);
    emailForm.append(emailInput);
    const emailPwInput = getInputRow('Password:', 'password', 'password', 'password', true);
    emailForm.append(emailPwInput);
    const emailButton = newElement('button', {parent: emailForm});
    emailButton.textContent = 'Save';

    const passwordForm = newElement('form', {parent: component, classList: ['credential-update']});
    passwordForm.method = "POST";
    passwordForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(passwordForm);
        const password = formData.get('password');
        const newPassword = formData.get('new_password');
        const newPassword2 = formData.get('new_password2');
        if (!validators.pwOk(newPassword)) {
            alert('Invalid password');
            return;
        }
        if (newPassword !== newPassword2) {
            alert('Passwords do not match');
            return;
        }
        const response = await request('POST', Path.join(Path.API.UPDATE_CREDENTIALS, "password"), { value: newPassword, password });
        if (response.status !== 200) {
            alert(response.error);
            return;
        }
        alert('password updated');
        navigate();
    });
    const newPasswordInput = getInputRow('New password:', 'password', 'new_password', 'new password', true);
    passwordForm.append(newPasswordInput);
    const newPassword2Input = getInputRow('Repeat new password:', 'password', 'new_password2', 'new password', true);
    passwordForm.append(newPassword2Input);
    const passwordInput = getInputRow('Current password:', 'password', 'password', ' Current password', true);
    passwordForm.append(passwordInput);
    const passwordButton = newElement('button', {parent: passwordForm});
    passwordButton.textContent = 'Save';

    return component;
}

export default async function getView(isLogged, path) {
    if (!isLogged)
        return { status: 300, redirect: '/pages/login/login' };
    if (path.subPath !== '/')
        return { status: 300, redirect: '/pages/main/settings' };
    const css = [
        Path.css("main/settings.css")
    ];
    const component = document.createElement('div');

    const response = await request('GET', Path.API.PROFILE);
    if (response.status !== 200)
        return { status: response.status, error: response.error };
    const profile = response.data;
    
    const title = newElement('h1', { parent: component});
    title.textContent = '⚙️ Settings';
    component.append(getPhotoSection(profile));
    component.append(getUserUpdatesSection(profile));
    return { status: 200, css, component };
}