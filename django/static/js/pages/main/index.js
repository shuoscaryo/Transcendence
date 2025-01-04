import Path from '/static/js/utils/Path.js';
import getSidebar from './sidebar.js';
import * as css from '/static/js/utils/css.js';

let currentView = null;

async function getContent(view) {
    if (view == null)
        view = "home";
    const pageFile = view == currentView ? currentView : await import(Path.join('./views', `${view}.js`));
    const content = await pageFile.default();
    return content;
}

// Loads the page content and styles
export default async function mainPage(divApp, view, reloadPage) {
    if (reloadPage) {
        await css.loadPageCss([
            Path.css('main/main.css'),
            Path.css('main/sidebar.css'),
        ]);

        const page = document.createElement('div');
        page.id = 'page';
        divApp.appendChild(page);
    
        page.appendChild(getSidebar());

        const content = document.createElement('div');
        content.id = 'content';
        page.appendChild(content);

        const main = document.createElement('main');
        main.id = 'view';
        content.appendChild(main);
    }
    const divView = document.getElementById('view');
    const newView = await getContent(view);
    divView.replaceChildren(...newView.children);
}
