import Path from "/static/js/utils/Path.js";

export default async function getView(component, loadCssFunction) {
    await loadCssFunction([
        Path.css("login/login.css"),
    ]);

    const mainDiv = document.createElement('div');
    component.appendChild(mainDiv);


}