import Path from '/static/js/utils/Path.js';
import * as css from '/static/js/utils/css.js';
import apiIsLogged from '/static/js/utils/api/apiIsLogged.js';

const current = {
    page: null,
    isLogged: null,
};

async function loadPage(path, isLogged, data = null) {
    // Get the page and view
    if (path.startsWith('/'))
        path = path.substring(1);
    const [prefix, page, view] = path.split('/');
    if (prefix != 'pages' || !page)
        throw new Error(`Invalid path ${path}`);

    // Load the page
    let pageFile;
    if (current.page !== page || current.isLogged !== isLogged) {
        try {
            pageFile = await import(Path.page(page, 'index.js'));
        } catch (error) {
            return error.code === 'MODULE_NOT_FOUND' ? 404 : 500;
        }
        const divApp = document.getElementById('app');
        if (!divApp)
            throw new Error('Element #app not found')
        divApp.innerHTML = '';
        css.deletePageCss();
        css.deleteViewCss();
        await pageFile.default(divApp, css.loadPageCss, isLogged, data); // throws if fails, dont catch
    }
    
    // Get the view
    const divView = document.getElementById('view');
    let viewFile;
    if (divView) {
        try {
            viewFile = await import(Path.page(page, 'views', `${view}.js`));
        } catch (error) {
            return error.code === 'MODULE_NOT_FOUND' ? 404 : 500;
        }
        divView.innerHTML = '';
        css.deleteViewCss();
        await viewFile.default(divView, css.loadViewCss, isLogged, data); // throws if fails, dont catch
    }
    
    // Update the current data
    current.page = page;
    current.isLogged = isLogged;

    return 200;
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

    if (isLogged && path.startsWith("/pages/login"))
        return redirect('/home');
    else if (!isLogged && path.startsWith("/pages/user/"))
        return redirect('/login');

    const result = await loadPage(path, isLogged, data);

    if (result === 404 && path !== '/404')
        return redirect('/404');
    else if (result === 500 && path !== '/500')
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