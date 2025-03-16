import Path from '/static/js/utils/Path.js';
import * as css from '/static/js/utils/css.js';
import apiIsLogged from '/static/js/utils/api/isLogged.js';

const current = {
    page: null,
    view: null,
    pageOnDestroy: null,
    viewOnDestroy: null,
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

// returns {status, component, css, [onDestroy]} on success, {status + extras (like redirect with 300)} if error
async function getComponentFromUrl(url, isLogged, path) {
    // Import the file
    let file = null;
    try {
        // Check if the file exists
        const response = await fetch(url, { method: 'HEAD', credentials: 'include' });
        if (!response.ok)
            return {status: response.status, msg: `Error fetching HEAD of file ${url}`};
        // Import the file
        file = await import(url);
    } catch (error) {
        return {status: 500, msg: `Error importing file ${url} - ${error}`};
    }

    // Execute the main function of the file (returns {status, component, css, [onDestroy]} or {status + extras} if error)
    const result = await file.default(isLogged, path); // let it throw if it fails, dont catch
    if (!result || !result.status)
        return {status: 500, msg: `No result or no result.status returned from file ${url}`};
    if (result.status !== 200)
        return result;

    return {
        status: 200,
        component: result.component,
        css: result.css,
        onDestroy: result.onDestroy
    };
}

async function loadPage(path, isLogged) {
    // Split the path into parts
    path = parsePath(path);
    if (path.prefix !== 'pages')
        return {status: 404};
    
    // Load the page
    const pagePath = Path.page(path.page, 'index.js');
    const pageImport = await getComponentFromUrl(pagePath, isLogged, path);
    if (pageImport.status !== 200)
        return pageImport;
    
    // Get the view and add it to the page component (if #view exists in the page)
    const divView = pageImport.component.querySelector('#view');
    let viewImport = null;
    if (divView) {
        if (!path.view)
            return {status: 404};
        const viewPath = Path.page(path.page, 'views', `${path.view}.js`);
        viewImport = await getComponentFromUrl(viewPath, isLogged, path);
        if (viewImport.status !== 200)
            return viewImport;
        viewImport.component.id = 'view';
        divView.replaceWith(viewImport.component);
    }

    // replace the elements
    // - Get the div App or create it
    const divApp = document.getElementById('app');
    if (!divApp) {
        divApp = document.createElement('div');
        divApp.id = 'app';
        document.body.append(divApp);
    }
    divApp.innerHTML = '';

    // - Load the css
    if (current.page !== path.page) {
        css.deletePageCss();
        css.deleteViewCss();
        // Load view and page css at the same time
        await Promise.all([
            css.loadPageCss(pageImport.css),
            viewImport ? css.loadViewCss(viewImport.css) : Promise.resolve()
        ]);
    }
    else if (current.view !== path.view) {
        css.deleteViewCss();
        await css.loadViewCss(viewImport.css);
    }
    // - Call destroy on the current view
    if (current.viewOnDestroy)
        current.viewOnDestroy();
    if (current.pageOnDestroy)
        current.pageOnDestroy();

    // - Replace the app with the new component
    divApp.replaceWith(pageImport.component);
    pageImport.component.id = 'app';

    // Update the current data
    current.page = path.page;
    current.isLogged = isLogged;
    current.view = path.view;
    current.pageOnDestroy = pageImport?.onDestroy ? pageImport.onDestroy : null;
    current.viewOnDestroy = viewImport?.onDestroy ? viewImport.onDestroy : null;

    return {status: 200};
}

function isErrorPage(path) {
    const number = parseInt(path.substring(1), 10);
    return !isNaN(number) && number >= 400 && number <= 599;
}

export async function router(reload=false) {
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
        return navigate('/home', true);
    else if (!isLogged && path.startsWith("/pages/user/"))
        return navigate('/login', true);
    
    let result = await loadPage(path, isLogged, reload);
    
    if (result.status === 200)
        return;
    if (result.status === 300)
        return navigate(result.redirect, true);
    if (result.msg)
        console.error(`[ROUTER] ${result.msg}`);
    result = await loadPage(`/pages/error/${result.status}`, isLogged);
    if (result.status !== 200) {
        const divApp = document.getElementById('app');
        if (!divApp) {
            divApp = document.createElement('div');
            divApp.id = 'app';
            document.body.append(divApp);
        }
        divApp.innerHTML = '';
        divApp.textContent = `Error ${result.status}`;
    }
}

export function navigate(path = null, redirect=false) {
    if (path != null){
        if (redirect)
            window.history.replaceState({}, '', path);
        else
            window.history.pushState({}, '', path);
    }
    router();
}

export function goBack() {
    if (window.history.length > 1) {
        window.history.back();
    } else {
        navigate('/home');
    }
}