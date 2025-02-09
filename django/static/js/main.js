import loadPage from '/static/js/utils/loadPage.js';

function router() {
    const currentURL = new URL(window.location.href);
    const parts = currentURL.pathname.split('/').filter(part => part.length > 0);

    if (currentURL.pathname == '/')
        loadPage('main', 'home');
    else if (parts[1] == 'pages') {
        const page = parts[1];
        const view = parts[2]; // TODO check if exists and choose default option
        loadPage(page, view);
    }
    else
        loadPage('error', '404'); // TODO: 404 page
}

window.addEventListener('popstate', router);
window.addEventListener('load', router);