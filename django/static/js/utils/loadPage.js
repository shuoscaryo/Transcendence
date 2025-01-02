import Path from '/static/js/utils/Path.js';
import * as css from '/static/js/utils/css.js';
import Storage from '/static/js/utils/Storage.js';

export default async function loadPage(pageName, view = null) {
    // Check if the input is valid (throw an error if it's not)
    if (typeof pageName !== 'string') {
        throw new Error('loadPage: The page name must be a string.');
    }
    pageName = pageName.replace(/\.js$/, ''); // Remove the .js extension
    if (!pageName) {
        throw new Error('loadPage: No page name was provided.');
    }

    // Load the page from the pages folder
    const pageFile = await import(Path.page(pageName, 'index.js'));
    if (pageFile.default) {
        const appDiv = document.getElementById('app');
        appDiv.innerHTML = '';
        css.deleteCss();
        Storage.deletePageData();
        pageFile.default();
    } else
        throw new Error(`loadPage: The page "${pageName}" does not have a default export.`); //TODO: 404 page
}