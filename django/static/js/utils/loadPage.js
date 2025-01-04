import Path from '/static/js/utils/Path.js';
import * as css from '/static/js/utils/css.js';
import Storage from '/static/js/utils/Storage.js';

const currentPage = {
    name: null,
    view: null,
    pageFile: null
};

export default async function loadPage(pageName, view = null) {
    try {
        const appDiv = document.getElementById('app');
        const isSamePage = currentPage.name == pageName;

        // Update the URL
        //history.pushState({}, '', Path.join('/', pageName, view));
        
        // If is the same page clear the page, otherwise only the view
        const clearDiv = (isSamePage ? document.getElementById('view') : appDiv);
        if (clearDiv)
            clearDiv.innerHTML = '';
        if (!isSamePage) {
            css.deletePageCss();
            Storage.deletePageData();
        }
        css.deleteViewCss();
        Storage.deleteViewData();
        
        let pageFile = isSamePage ? currentPage.pageFile : await import(Path.page(pageName, 'index.js'));
        pageFile.default(appDiv, view);
        
        Object.assign(currentPage, { name: pageName, view: view, pageFile: pageFile });
    } catch (error) {
        // update the url back to the previous page
        //history.pushState({}, '', Path.join('/', currentPage.name, currentPage.view));
        throw new Error(`loadPage: The page "${pageName}" does not have a default export.`); //TODO: 404 page
    };
}
