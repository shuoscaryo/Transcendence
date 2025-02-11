import Path from '/static/js/utils/Path.js';
import * as css from '/static/js/utils/css.js';

const current = {
    page: null,
    view: null,
    data: null,
    pageFile: null,
    viewFile: null
};

export default async function loadPage(path, data = null, pushUrl = true) {
    const [prefix, page, view] = path.split('/');
    if (prefix != 'pages' || !page)
        throw new Error(`Invalid path ${path}`);

    const divApp = document.getElementById('app');
    const isSamePage = current.page == page;
    try {
        // If last page has destructor call it
        if (current.pageFile?.destroy)
            current.pageFile.destroy();

        // If is the same page clear the view, otherwise clear the page
        (isSamePage ? document.getElementById('view') : divApp)?.innerHTML = '';
        if (!isSamePage)
            css.deletePageCss();
        css.deleteViewCss();
        
        // Replace the page frame if needed
        const pageFile = isSamePage ? current.pageFile : await import(Path.page(page, 'index.js'));
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
                        '/', Path.page(page), 'views', `${view}.js`));

                await viewFile.default(divView, css.loadViewCss, data);
            }
        }

        // Update the current page
        Object.assign(current, { page: page, view: view, data: data, pageFile: pageFile, viewFile: viewFile });

        // Update the URL
        if (pushUrl)
            history.pushState({}, '', Path.join('/pages', page, view));
    } catch (error) {
        console.error(error);
        if (current.page != page && current.pageFile) {
            divApp.innerHTML = '';
            await current.pageFile.default(divApp, css.loadPageCss, current.data); //TODO: 404 page
        }
        if (current.view != view && current.viewFile && view) {
            const divView = document.getElementById('view');
            if (divView) {
                divView.innerHTML = '';
                await current.viewFile.default(document.getElementById('view'), css.loadViewCss, current.data); //TODO: 404 view
            }
        }
    };
}
