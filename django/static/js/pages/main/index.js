import Path from '/static/js/utils/Path.js';
import getSidebar from '/static/js/components/sidebar.js';

export default async function getPage( isLogged, path) {
    const css = [
        Path.css('main/index.css'),
        Path.css('main/sidebar.css'),
    ];
    const component = document.createElement('div');

    const page = document.createElement('div');
    page.id = 'page';
    component.appendChild(page);

    page.appendChild(getSidebar(isLogged));

    const content = document.createElement('div');
    content.id = 'content';
    page.appendChild(content);

    const main = document.createElement('main');
    main.id = 'view';
    content.appendChild(main);

    return {status: 200, component, css};
}
