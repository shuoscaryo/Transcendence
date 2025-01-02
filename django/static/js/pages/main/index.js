import Path from '/static/js/utils/Path.js';
import getSidebar from './sidebar.js';
import getContent from './homeContent.js';
import getFooter from './footer.js';
import * as css from '/static/js/utils/css.js';

// Loads the page content and styles
export default async function mainPage() {
    await css.loadPageCss([
        Path.css('main/main.css'),
    ]);
    await css.loadViewCss([
        Path.css('main/sidebar.css'),
        Path.css('main/mainView.css'),
    ]);
    const app = document.getElementById('app');

    const page = document.createElement('div');
    page.id = 'page';
    app.appendChild(page);
    
    page.appendChild(getSidebar());

    const content = document.createElement('div');
    content.id = 'content';
    page.appendChild(content);
    
    content.appendChild(getContent());

    const footer = getFooter();
    content.appendChild(footer);
}
