import Path from '/static/js/utils/Path.js';
import * as css from '/static/js/utils/css.js';
import Storage from '/static/js/utils/Storage.js';

const current = {
    name: null,
    view: null,
    pageFile: null,
    viewFile: null
};

export default async function loadPage(pageName, view) {
    if (!pageName || !view)
        throw new Error('loadPage: The pageName and view parameters are required.');

    const divApp = document.getElementById('app');
    const isSamePage = current.name == pageName;
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
        
        // Replace the page frame if needed
        const pageFile = isSamePage ? current.pageFile : await import(Path.page(pageName, 'index.js'));
        if (!isSamePage) {
            const newPage = await pageFile.default();
            divApp.replaceChildren(...newPage.children);
        }
        // Replace the view if needed
        const divView = document.getElementById('view');
        let viewFile = null;
        if (divView) {
            viewFile = current.view == view
                ? current.viewFile
                : await import(Path.join(
                    '/', Path.page(pageName), 'views', `${view}.js`));

            const newView = await viewFile.default();
            divView.replaceChildren(...newView.children);
        }
        
        // Update the current page
        Object.assign(current, { name: pageName, view: view, pageFile: pageFile, viewFile: viewFile });
    } catch (error) {
        console.error(error);
        if (current.name != pageName && current.pageFile)
            current.pageFile.default(divApp, view, !isSamePage); //TODO: 404 page
        // update the url back to the previous page
        //history.pushState({}, '', Path.join('/', current.name, current.view));
        throw new Error(`loadPage: The page "${pageName}" does not have a default export.`);
    };
}
