import loadPage from '/static/js/utils/loadPage.js';

function router() {
    const currentURL = new URL(window.location.href);
    const parts = currentURL.pathname.split('/').filter(part => part.length > 0);

    // Empty or /pages/ case
    if (currentURL.pathname == '/'
        || currentURL.pathname == '/pages/'
    ) {
        loadPage('main', 'home');
        return;
    }

    // If the URL is not pages, then 404
    if (parts[0] != 'pages') {
        throw new Error('The URL must start with /pages/'); //TODO 404 page
    }

    let page = parts[1];
    let view = parts[2];
    if (!view) {
        if (page == 'main')
            view = "home";
        else if (page == "login")
            view = "login";
    }        
    loadPage(page, view);
}

window.addEventListener('popstate', router);
window.addEventListener('load', router);