import * as css from '/static/js/utils/css.js';
import Path from '/static/js/utils/Path.js';
import getHomeButton from '/static/js/components/homeButton.js';


function getUpperHalf() {
    const component = document.createElement('div');
    return component;
}

function getLowerHalf() {
    const component = document.createElement('div');
    return component;
}

export default async function mainPage() {
    await css.loadPageCss([
        Path.css('main/main.css'),
    ]);
    await css.loadViewCss([
        Path.css('main/sidebar.css'),
        Path.css('main/mainView.css')
    ]);

    const app = document.getElementById('app');

    const page = document.createElement('div');
    page.id = 'page';
    app.appendChild(page);
    
    const content = document.createElement('div');
    content.id = 'content';
    page.appendChild(content);
    
    content.appendChild(getHomeButton());

    const divMain = document.createElement('div');
    divMain.id = 'div-main';
    content.appendChild(divMain);

    const divUpper = getUpperHalf();
    divUpper.id = 'div-upper';
    divMain.appendChild(divUpper);

    const divLower = getLowerHalf();
    divLower.id = 'div-lower';
    divMain.appendChild(divLower);
}
