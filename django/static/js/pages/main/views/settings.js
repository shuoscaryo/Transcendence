import Path from '/static/js/utils/Path.js';
import newElement from "/static/js/utils/newElement.js";
import {navigate} from "/static/js/utils/router.js";
import * as validators from "/static/js/utils/validators.js";
import getDefaultButton from "/static/js/components/defaultButton.js";
import ViewScope from "/static/js/utils/ViewScope.js";

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
    
        await ViewScope.request(
            'POST',
            Path.join(Path.API.UPDATE_CREDENTIALS, 'profile_photo'),
            {
                body: formData,
                headers: {'Content-Type': null}, // Let the browser set the correct Content-Type
                onResolve: (res) => {
                    if (res.status === 413) {
                        alert('Image too large. Max size is 10MB.');
                        return;
                    }
                    if (res.status !== 200) {
                        const error = res.data?.error || res.status;
                        alert('Upload failed: ' + error);
                        return;
                    }
                    profileImg.src = res.data.profile_photo; // Update image preview
                },
                onThrow: (err) => {
                    alert('Error uploading image.');
                    console.error(err);
                }
            }
        );
    });

    const userInfo = newElement('div', {id: 'user-info', parent: component});
    const displayName = newElement('span', {id: 'display-name', parent: userInfo});
    displayName.textContent = profile.display_name;
    displayName.addEventListener('click', () => {navigate('/main/profile');});

    if (!profile.is_42_user) {
        const username = newElement('span', {id: 'username', parent: userInfo});
        username.textContent = `username: ${profile.username}`;

        const email = newElement('span', {id: 'email', parent: userInfo});
        email.textContent = `email: ${profile.email}`;
    } else {
        const user42 = newElement('span', {id: 'user-42', parent: userInfo});
        user42.textContent = `42 user`;
    }

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

function getUserUpdatesSection(profile) {
    const component = newElement('section', { classList: ['section-block'], id: 'user-updates-section'});
    const header = newElement('h2', {parent: component, id: 'user-updates-header'});
    header.textContent = 'Update your credentials';

    // Each form configuration
    const formConfigs = [
        {
            endpoint: 'username',
            fields: [
                { label: 'Username:', type: 'text', name: 'username', placeholder: 'username', validator: validators.usernameOk },
                { label: 'Password:', type: 'password', name: 'password', placeholder: 'password' }
            ],
            successMessage: 'Username updated'
        },
        {
            endpoint: 'display_name',
            fields: [
                { label: 'Display name:', type: 'text', name: 'display_name', placeholder: 'display name', validator: validators.usernameOk },
            ],
            successMessage: 'Display name updated'
        },
        {
            endpoint: 'email',
            fields: [
                { label: 'Email:', type: 'email', name: 'email', placeholder: 'email', validator: validators.emailOk },
                { label: 'Password:', type: 'password', name: 'password', placeholder: 'password' }
            ],
            successMessage: 'Email updated'
        },
        {
            endpoint: 'password',
            fields: [
                { label: 'New password:', type: 'password', name: 'new_password', placeholder: 'new password', validator: validators.pwOk },
                { label: 'Repeat new password:', type: 'password', name: 'new_password2', placeholder: 'new password' },
                { label: 'Current password:', type: 'password', name: 'password', placeholder: 'Current password' }
            ],
            successMessage: 'Password updated'
        }
    ];

    // Function to create a form
    const createUpdateForm = ({ endpoint, fields, successMessage }) => {
        const form = newElement('form', { parent: component, classList: ['credential-update'] });
        form.method = 'POST';

        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            const formData = new FormData(form);
            const password = formData.get('password');
            const value = formData.get(fields[0].name);

            // Validate fields
            if (fields[0].validator && !fields[0].validator(value)) {
                alert(`Invalid ${fields[0].name}`);
                return;
            }
            if (endpoint === 'password' && value !== formData.get('new_password2')) {
                alert('Passwords do not match');
                return;
            }

            // Send request
            await ViewScope.request(
                'POST',
                Path.join(Path.API.UPDATE_CREDENTIALS, endpoint),
                {
                    body: { value, password },
                    onResolve: (res) => {
                        if (res.status !== 200){
                            alert(res.data.error || res.status);
                            return;
                        }
                        alert(successMessage);
                        navigate();
                    },
                    onThrow: (err) => { console.error(err); }
                }
            );
        });
        const inputsDiv = newElement('div', { parent: form , classList: ['inputs-div'] });
        // Create input rows
        fields.forEach(field => {
            const inputRow = getInputRow(field.label, field.type, field.name, field.placeholder, true);
            inputsDiv.append(inputRow);
        });
        const saveButton = getDefaultButton({
            bgColor: 'var(--color-lime)',
            content: 'Save',
        });
        form.append(saveButton);

        return form;
    };

    // Create all forms
    formConfigs.forEach((config) => {
        if (!profile.is_42_user || config.endpoint === 'display_name')
            createUpdateForm(config);
    });

    return component;
}

export default async function getView(isLogged, path) {
    if (!isLogged)
        return { status: 300, redirect: '/login/login' };
    if (path.subPath !== '/')
        return { status: 300, redirect: '/main/settings' };
    const css = [
        Path.css("main/settings.css")
    ];
    const component = document.createElement('div');

    const response = await ViewScope.request(
        'GET',
        Path.API.PROFILE,
        {onThrow: (err) => { console.error(err);}}
    );
    if (!response)
        return { status: 500, error: 'Error fetching profile data' };
    if (response.status !== 200)
        return { status: response.status, error: response.error };
    const profile = response.data;
    
    const title = newElement('h1', { parent: component});
    title.textContent = '⚙️ Settings';
    component.append(getPhotoSection(profile));
    component.append(getUserUpdatesSection(profile));
    return { status: 200, css, component };
}