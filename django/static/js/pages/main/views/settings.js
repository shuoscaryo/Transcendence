import Path from '/static/js/utils/Path.js';
import newElement from "/static/js/utils/newElement.js";
import request from "/static/js/utils/request.js";
import {navigate} from "/static/js/utils/router.js";

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

function getUserSettingsSection() {
    const component = newElement('section', { classList: ['section-block']});
    return component;
}

export default async function getView(isLogged, path) {
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
    component.append(getUserSettingsSection(profile));
    return { status: 200, css, component };
}