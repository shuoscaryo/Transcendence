import * as config from '/static/js/config.js';

export default async function loadPage(pageName) {
    // Check if the input is valid (throw an error if it's not)
    if (typeof pageName !== 'string') {
        throw new Error('loadPage: The page name must be a string.');
    }
    pageName = pageName.replace(/\.js$/, ''); // Remove the .js extension
    if (!pageName) {
        throw new Error('loadPage: No page name was provided.');
    }

    // Load the page from the pages folder
    const pageFile = await import(`${config.PAGES_FOLDER}/${pageName}.js`);
    if (pageFile.default) {
        const {page, styles} = pageFile.default();
        const appDiv = document.getElementById('app');
        appDiv.replaceChildren(...page.childNodes);
        const dynamicStyles = document.getElementById('dynamic_styles');
        dynamicStyles.textContent = styles;
    } else
        throw new Error(`loadPage: The page "${pageName}" does not have a default export.`); //TODO: 404 page
}