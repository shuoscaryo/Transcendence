import Path from '/static/js/utils/Path.js';
import loadPage from '/static/js/utils/loadPage.js';

export default function getHomeButton()
{
    const component = document.createElement('button');
    component.className = 'home-button';
    
    const image = document.createElement('img');
    image.src = Path.img('homeLogo.png');
    image.alt = 'Home';
    component.appendChild(image);

    component.addEventListener('click', () => {
        loadPage('home');
    });

    return component;
}