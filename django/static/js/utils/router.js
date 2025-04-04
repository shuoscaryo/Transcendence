import Path from '/static/js/utils/Path.js';
import * as css from '/static/js/utils/css.js';
import request from '/static/js/utils/request.js';
import WebSocketService from '/static/js/utils/WebSocketService.js';
import ViewLifeCycle from '/static/js/utils/ViewLifeCycle.js';

const current = {
    page: null,
    view: null,
    pageOnDestroy: null,
    viewOnDestroy: null,
};

async function apiIsLogged() {
    const response = await request('GET', Path.API.IS_LOGGED);
    return response.status === 200 && response.data.isLogged;
}

function parsePath(path) {
    // The path is expected to be in the format /page/view/restOfPath?query#hash
    if (path.startsWith('/'))
        path = path.substring(1);
    const parts = path.split('/');

    // Get the important parts
    const page = parts[0];
    const view = parts[1];
    const subPath = '/' + parts.slice(2).join('/');

    return { page, view, subPath };
}

// returns {status, component, css, [onDestroy]} on success, {status + extras (like redirect with 300)} if error
async function getComponentFromUrl(url, isLogged, path) {
    // Import the file
    let file = null;
    try {
        // Check if the file exists
        const response = await fetch(url, { method: 'HEAD', credentials: 'include' });
        if (!response.ok)
            return {status: response.status, error: `Error fetching HEAD of file ${url}`};
        // Import the file
        file = await import(url);
    } catch (error) {
        return {status: 500, error: `Error importing file ${url} - ${error}`};
    }

    // Execute the main function of the file (returns {status, component, css, [onDestroy]} or {status + extras} if error)
    const result = await file.default(isLogged, path); // let it throw if it fails, dont catch
    if (!result || !result.status)
        return {status: 500, error: `No result or no result.status returned from file ${url}`};
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
    
    // Don't allow clicking while loading
    document.body.style.pointerEvents = 'none';

    // Load the page
    ViewLifeCycle.destroy();
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
        const viewPath = Path.page(path.page, 'views', `${path.view}`);
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

    // - Call mount on the new view
    ViewLifeCycle.mount();

    // Update the current data
    current.page = path.page;
    current.view = path.view;
    current.pageOnDestroy = pageImport?.onDestroy ? pageImport.onDestroy : null;
    current.viewOnDestroy = viewImport?.onDestroy ? viewImport.onDestroy : null;

    // Undo the pointer events block
    document.body.style.pointerEvents = '';

    return {status: 200};
}

// if hte path is a number between 400 and 599, it is an error page
function isErrorPage(path) {
    const number = parseInt(path.substring(1), 10);
    return !isNaN(number) && number >= 400 && number <= 599;
}

/**
 * Handles the routing logic for the application.
 *
 * - Determines the user's authentication status by calling `apiIsLogged`.
 * - Manages WebSocket connections based on the user's login state.
 * - Resolves the current path and maps it to the appropriate page or view.
 * - Redirects to specific pages based on conditions (e.g., login, register, error pages).
 * - Loads the corresponding page and view components dynamically.
 * - Handles errors by attempting to load an error page or displaying a fallback error message.
 *
 * This function ensures that the correct page is displayed based on the current URL
 * and user state, while managing WebSocket connections and dynamic imports.
 *
 * @async
 * @function
 * @returns nothing
 */
export async function router() {
    const isLogged = await apiIsLogged();

    // Connect or disconnect the WebSocket
    if (isLogged) {
        if (!WebSocketService.isConnected())
            WebSocketService.connect();
        // wait until connects
        while (!WebSocketService.isConnected())
            await new Promise(resolve => setTimeout(resolve, 100));
    } else
        WebSocketService.disconnect();
    
    // Change path to the correct page on specific cases
    let path = window.location.pathname;
    if (path === '/' || path === '/home' || path === '/main' || path === '/main/' ||  path === '/home/')
        path = '/main/home';
    else if (path === '/login')
        path = '/login/login';
    else if (path === '/register')
        path = '/login/register';
    else if (isErrorPage(path))
        path = `/error${path}`;
    // Redirect home if logged in from login pages
    if (isLogged && path.startsWith("/login"))
        return navigate('/home', true);
    
    // Load the page
    let result = await loadPage(path, isLogged);
    
    // if everything is ok, do nothing more
    if (result.status === 200)
        return;
    // If page wants to redirect, do it
    if (result.status === 300)
        return navigate(result.redirect, true);
    // Print the error and load the error page
    if (result.error)
        console.error(`[ROUTER] ${result.error}`);
    result = await loadPage(`/error/${result.status}`, isLogged);
    // If error page fails to load, do manual html error
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

/**
 * Navigates to a specified path or reloads the current page.
 *
 * - If `path` is `null`, the function simply reloads the current page.
 * - If `path` is provided and `redirect` is `false`, the new page is added to the browser's history.
 * - If `path` is provided and `redirect` is `true`, the current history entry is replaced with the new one.
 *
 * @param {string|null} [path=null] - The path to navigate to. If `null`, the page is reloaded.
 * @param {boolean} [redirect=false] - Determines whether to replace the current history entry (`true`) or add a new one (`false`).
 */
export function navigate(path = null, redirect=false) {

    if (path != null){
        if (redirect)
            window.history.replaceState({}, '', path);
        else
            window.history.pushState({}, '', path);
    }
    router();
}
