import Path from '/static/js/utils/Path.js';
import getHomeButton from '/static/js/components/homeButton.js';

export default async function getPage(isLogged, data) {
    const css = [
        Path.css("login/index.css"),
    ];
    const component = document.createElement("div");

    const page = document.createElement('div');
    page.id = 'page';
    page.style.backgroundImage = `url("${Path.img('loginBackGround.png')}")`;
    page.style.backgroundSize = "contain"; // Ajusta sin deformarse
    page.style.backgroundRepeat = "no-repeat"; // Evita que el patrón se repita
    page.style.backgroundPosition = "center";
    page.style.imageRendering = "pixelated";
    component.append(page);

    const content = document.createElement('div');
    content.id = 'content';
    page.append(content);

    content.append(getHomeButton());

    const divSquare = document.createElement('div');
    divSquare.id = 'div-square-container';
    divSquare.classList.add('section-block');
    content.append(divSquare);

    const main = document.createElement('main');
    main.id = 'view';
    divSquare.append(main);

    return {status: 200, component, css};
}
