import Path from '/static/js/utils/Path.js';
import * as css from '/static/js/utils/css.js';
import Storage from '/static/js/utils/Storage.js';

const currentPage = {
    name: null,
    view: null,
    pageFile: null
};

export default async function loadPage(pageName, view = null) {
    const divApp = document.getElementById('app');
    const isSamePage = currentPage.name == pageName;
    try {
        // Update the URL
        //history.pushState({}, '', Path.join('/', pageName, view));
        
        // If is the same page clear the page, otherwise only the view
        const clearDiv = (isSamePage ? document.getElementById('view') : divApp);
        if (clearDiv)
            clearDiv.innerHTML = '';
        if (!isSamePage) {
            css.deletePageCss();
            Storage.deletePageData();
        }
        css.deleteViewCss();
        Storage.deleteViewData();
        
        // Call the page function
        const pageFile = isSamePage ? currentPage.pageFile : await import(Path.page(pageName, 'index.js'));
        pageFile.default(divApp, view, !isSamePage);
        
        // Update the current page
        Object.assign(currentPage, { name: pageName, view: view, pageFile: pageFile });
    } catch (error) {
        console.error(error);
        if (currentPage.name != pageName && currentPage.pageFile)
            currentPage.pageFile.default(divApp, view, !isSamePage); //TODO: 404 page
        // update the url back to the previous page
        //history.pushState({}, '', Path.join('/', currentPage.name, currentPage.view));
        throw new Error(`loadPage: The page "${pageName}" does not have a default export.`);
    };
}
