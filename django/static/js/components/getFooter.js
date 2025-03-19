import newElement from '/static/js/utils/newElement.js';

export default function getFooter() {
    const component = document.createElement('footer');
    component.textContent = 'Ft-transcendence by';

    const githubLink = newElement('a', {parent: component});
    return component;
}