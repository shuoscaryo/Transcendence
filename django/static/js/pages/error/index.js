import Path from '/static/js/utils/Path.js';
import getHomeButton from '/static/js/components/homeButton.js';

function getDefaultView(code) {
    const component = document.createElement('div');
    component.id = 'error-view';
    
    const h1 = document.createElement('h1');
    h1.textContent = code;
    component.append(h1);

    const h2 = document.createElement('h2');
    h2.textContent = "Very bad error indeed";
    component.append(h2);

    const spongeBob = document.createElement('img');
    spongeBob.src = Path.img('spongeBob.png');
    component.append(spongeBob);

    return component;
}

export default async function getPage(isLogged, path) {
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

    const customViews = new Set([]);
    if (customViews.has(path.view)) {
        const main = document.createElement('main');
        main.id = 'view';
        divSquare.append(main);
    }
    else {
        content.append(getDefaultView(path.view));
    }

    return {status: 200, component, css};
}
