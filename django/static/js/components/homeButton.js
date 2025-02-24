import Path from '/static/js/utils/Path.js';
import { navigate } from '/static/js/utils/router.js';

export default function getHomeButton()
{
    const component = document.createElement('button');
    component.className = 'home-button';
    
    const image = document.createElement('img');
    image.src = Path.img('homeLogo.png');
    image.alt = 'Home';
    component.appendChild(image);

    component.addEventListener('click', () => {
        navigate("/pages/main/home");
    });

    return component;
}