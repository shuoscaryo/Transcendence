import Path from '/static/js/utils/Path.js';
import { navigate } from '/static/js/utils/router.js';

export default function getHomeButton()
{
    const component = document.createElement('button');
    component.className = 'home-button';
    
    const image = document.createElement('img');
    image.src = Path.img('homeLogo.png');
    image.alt = 'Home';
    component.append(image);

    component.addEventListener('click', () => {
        navigate("/main/home");
    });

    return component;
}