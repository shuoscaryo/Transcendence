import Path from '/static/js/utils/Path.js';
import getSidebar from './sidebar.js';
import * as css from '/static/js/utils/css.js';

export default async function mainPage() {
    await css.loadPageCss([
        Path.css('main/main.css'),
        Path.css('main/sidebar.css'),
    ]);

    const component = document.createElement('div');

    const page = document.createElement('div');
    page.id = 'page';
    component.appendChild(page);

    page.appendChild(getSidebar());

    const content = document.createElement('div');
    content.id = 'content';
    page.appendChild(content);

    const main = document.createElement('main');
    main.id = 'view';
    content.appendChild(main);

    return component;
}
