import Path from '/static/js/utils/Path.js';
import * as css from '/static/js/utils/css.js';

const current = {
    name: null,
    view: null,
    data: null,
    pageFile: null,
    viewFile: null
};

export default async function loadPage(pageName, view = null, data = null) {
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
        if (!isSamePage)
            css.deletePageCss();
        css.deleteViewCss();
        
        // Replace the page frame if needed
        const pageFile = isSamePage ? current.pageFile : await import(Path.page(pageName, 'index.js'));
        if (!isSamePage)
            await pageFile.default(divApp, css.loadPageCss, data);
        // Replace the view if needed
        let viewFile = null;
        if (view) {
            const divView = document.getElementById('view');
            if (divView) {
                viewFile = current.view == view
                    ? current.viewFile
                    : await import(Path.join(
                        '/', Path.page(pageName), 'views', `${view}.js`));

                await viewFile.default(divView, css.loadViewCss, data);
            }
        }
        // Update the current page
        Object.assign(current, { name: pageName, view: view, data: data, pageFile: pageFile, viewFile: viewFile });
    } catch (error) {
        console.error(error);
        if (current.name != pageName && current.pageFile)
            await current.pageFile.default(divApp, css.loadPageCss, current.data); //TODO: 404 page
        if (current.view != view && current.viewFile && view)
            await current.viewFile.default(document.getElementById('view'), css.loadViewCss, current.data); //TODO: 404 view
        // update the url back to the previous page
        //history.pushState({}, '', Path.join('/', current.name, current.view));
    };
}
