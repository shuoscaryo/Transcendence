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

async function loadPage(path, isLogged, data = null) {
    path = parsePath(path);
    if (path.prefix !== 'pages')
        return {status: 404};
    // Load the page
    let pageFile;
    if (current.page !== path.page || current.isLogged !== isLogged) {
        try {
            pageFile = await import(Path.page(path.page, 'index.js'));
        } catch (error) {
            console.log(error);
            return { status: error.message.includes('404') ? 404 : 500 };
        }
        const divApp = document.getElementById('app');
        if (!divApp)
            throw new Error('Element #app not found')
        divApp.innerHTML = '';
        css.deletePageCss();
        css.deleteViewCss();
        const result = await pageFile.default(divApp, css.loadPageCss, isLogged, data, path); // throws if fails, dont catch
        if (result && typeof result.status !== "undefined" && result.status !== 200)
            return result;
    }
    
    // Get the view
    const divView = document.getElementById('view');
    let viewFile;
    if (divView) {
        try {
            viewFile = await import(Path.page(path.page, 'views', `${path.view}.js`));
        } catch (error) {
            console.log(error);
            return {status: error.code === 'MODULE_NOT_FOUND' ? 404 : 500};
        }
        divView.innerHTML = '';
        css.deleteViewCss();
        const result = await viewFile.default(divView, css.loadViewCss, isLogged, data, path); // throws if fails, dont catch
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
    if (path === '/' || path === '/home')
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

    const result = await loadPage(path, isLogged, data);
    
    if (result.status === 300)
        return redirect(result.data);
    if (result.status === 404 && path !== '/404')
        return redirect('/404');
    else if (result.status === 500 && path !== '/500')
        return redirect('/500');
}

export function navigate(path, data = null) {
    window.history.pushState({}, '', path);
    router(data);
}

export function redirect(path, data = null) {
    window.history.replaceState({}, '', path);
    router(data);
}

export function goBack() {
    if (window.history.length > 1) {
        window.history.back();
    } else {
        navigate('/home');
    }
}