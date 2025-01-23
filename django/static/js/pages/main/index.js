import Path from '/static/js/utils/Path.js';
import getSidebar from '/static/js/components/sidebar.js';

export default async function getPage(component, loadCssFunction) {
    await loadCssFunction([
        Path.css('main/index.css'),
        Path.css('main/sidebar.css'),
    ]);

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
}
