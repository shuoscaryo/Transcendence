import Path from '/static/js/utils/Path.js';
import * as css from '/static/js/utils/css.js';
import apiIsLogged from '/static/js/utils/api/apiIsLogged.js';

const current = {
    page: null,
    isLogged: null,
};

function parsePath(path) {
    // The path is expected to be in the format /pages/page/view/restOfPath?query#hash
    if (path.startsWith('/'))
        path = path.substring(1);
    const parts = path.split('/');

    // Get the important parts
    const prefix = parts[0];
    const page = parts[1];
    const view = parts[2];
    const subPath = '/' + parts.slice(3).join('/');

    return { prefix, page, view, subPath };
}

async function checkFileExists(url) {
    const response = await fetch(url, { method: 'HEAD', credentials: 'include' });
    return response.status;
}

async function loadPage(path, isLogged) {
    path = parsePath(path);
    if (path.prefix !== 'pages')
        return {status: 404};
    // Load the page
    let pageFile;
    if (current.page !== path.page || current.isLogged !== isLogged) {
        const pageUrl = Path.page(path.page, 'index.js');
        const status = await checkFileExists(pageUrl);
        if (status !== 200) {
            return {status};
        }
        try {
            pageFile = await import(pageUrl);
        } catch (error) {
            console.error(error);
            return {status: 500};
        }
        const divApp = document.getElementById('app');
        if (!divApp)
            throw new Error('Element #app not found')
        divApp.innerHTML = '';
        css.deletePageCss();
        css.deleteViewCss();
        const result = await pageFile.default(divApp, css.loadPageCss, isLogged, path); // throws if fails, dont catch
        if (result && typeof result.status !== "undefined" && result.status !== 200)
            return result;
    }
    
    // Get the view
    const divView = document.getElementById('view');
    let viewFile;
    if (divView) {
        if (!path.view)
            return {status: 404};
        const viewUrl = Path.page(path.page, 'views', `${path.view}.js`);
        const status = await checkFileExists(viewUrl);
        if (status !== 200)
            return {status};
        try {
            viewFile = await import(Path.page(path.page, 'views', `${path.view}.js`));
        } catch (error) {
            return {status: 500};
        }
        divView.innerHTML = '';
        css.deleteViewCss();
        const result = await viewFile.default(divView, css.loadViewCss, isLogged, path); // throws if fails, dont catch
        if (result && typeof result.status !== "undefined" && result.status !== 200)
            return result;
    }
    
    // Update the current data
    current.page = path.page;
    current.isLogged = isLogged;

    return {status: 200};
}

function isErrorPage(path) {
    const number = parseInt(path.substring(1), 10);
    return !isNaN(number) && number >= 400 && number <= 599;
}

export async function router(data) {
    const isLogged = await apiIsLogged();

    let path = window.location.pathname;
    if (path === '/' || path === '/home' || path === '/pages/main')
        path = '/pages/main/home';
    else if (path === '/login')
        path = '/pages/login/login';
    else if (path === '/register')
        path = '/pages/login/register';
    else if (isErrorPage(path))
        path = `/pages/error${path}`;

    if (isLogged && path.startsWith("/pages/login"))
        return redirect('/home');
    else if (!isLogged && path.startsWith("/pages/user/"))
        return redirect('/login');
    
    let result = await loadPage(path, isLogged);
    
    if (result.status === 200)
        return;
    if (result.status === 300)
        return redirect(result.redirect);
    result = await loadPage(`/pages/error/${result.status}`);
    if (result.status !== 200) {
        const divApp = document.getElementById('app');
        divApp.innerHTML = '';
        divApp.textContent = `Error ${result.status}`;
    }
}

export function navigate(path) {
    window.history.pushState({}, '', path);
    router();
}

export function redirect(path) {
    window.history.replaceState({}, '', path);
    router();
}

export function goBack() {
    if (window.history.length > 1) {
        window.history.back();
    } else {
        navigate('/home');
    }
}