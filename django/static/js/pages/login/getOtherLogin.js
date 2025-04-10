import Path from '/static/js/utils/Path.js';
import getDefaultButton from '/static/js/components/defaultButton.js';
import ViewScope from '/static/js/utils/ViewScope.js';

export default function getOtherLogin() {
    const component = document.createElement('div');

    const separatorDiv = document.createElement('div');
    separatorDiv.id = 'div-separator';
    separatorDiv.textContent = 'OR';
    component.append(separatorDiv);

    const buttonContent = document.createElement('div');
    buttonContent.classList.add('button-content');
    
    const img = document.createElement('img');
    img.src = Path.img('42Logo.png');
    buttonContent.append(img);

    const textDiv = document.createElement('div');
    textDiv.id = 'div-text';
    textDiv.textContent = 'Log in with 42';
    buttonContent.append(textDiv);

    const fortitoButton = getDefaultButton({
        bgColor: 'var(--color-button-fortito)',
        bgHoverColor: 'var(--color-button-fortito-hover)',
        content: buttonContent,
        onClick: async () => {
            const response = await ViewScope.request('GET', Path.API.GET_42_CLIENT_ID);
            if (!response || response.status !== 200)
                return;
            const clientId = response.data.client_id;
            const host = window.location.origin;
            const redirectUri = `${host}/api/login_42`;
            const authUrl = `https://api.intra.42.fr/oauth/authorize?prompt=login&client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code`;
        
            const width = 500;
            const height = 600;
            const left = (window.innerWidth - width) / 2;
            const top = (window.innerHeight - height) / 2;
        
            window.open(
                authUrl,
                "Login42",
                `width=${width},height=${height},top=${top},left=${left}`
            );
        }
    });
    fortitoButton.classList.add('button-other-login');
    component.append(fortitoButton);
    
    ViewScope.onMount(() => {
        ViewScope.addEventListener(window, "message", (event) => {
            if (event.data.success) {
                window.location.href = "/main/home";
            }
        });
    });
    return component;
}
