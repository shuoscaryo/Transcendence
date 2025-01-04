import * as css from '/static/js/utils/css.js';
import Path from '/static/js/utils/Path.js';
import getHomeButton from '/static/js/components/homeButton.js';

let currentView = null;

async function getContent(view) {
    if (view == null)
        view = "login";
    const pageFile = view == currentView ? currentView : await import(Path.join('./views', `${view}.js`));
    const content = await pageFile.default();
    return content;
}

export default async function mainPage(divApp, view, reloadPage) {
    if (reloadPage) {
        await css.loadPageCss([
            Path.css("login/index.css"),
        ]);

        const page = document.createElement('div');
        page.id = 'page';
        page.style.backgroundImage = `url("${Path.img('loginBackGround.png')}")`;
        page.style.backgroundSize = "contain"; // Ajusta sin deformarse
        page.style.backgroundRepeat = "no-repeat"; // Evita que el patrón se repita
        page.style.backgroundPosition = "center";
        page.style.imageRendering = "pixelated";
        divApp.appendChild(page);

        const content = document.createElement('div');
        content.id = 'content';
        page.appendChild(content);

        content.appendChild(getHomeButton());

        const divSquare = document.createElement('div');
        divSquare.id = 'div-square-container';
        content.appendChild(divSquare);

        const main = document.createElement('main');
        main.id = 'view';
        divSquare.appendChild(main);
    }

    const main = document.getElementById('view');
    const newView = await getContent(view);
    main.replaceChildren(...newView.children);
}
