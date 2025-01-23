export default function getSectionButton(image, mainText, subText, onClick) {
    const component = document.createElement('button');
    component.className = 'section-button';
    component.addEventListener('click', onClick);

    const divLeft = document.createElement('div');
    divLeft.className = 'section-button-left';
    component.appendChild(divLeft);

    const img = document.createElement('img');
    img.src = image;
    divLeft.appendChild(img);

    const divRight = document.createElement('div');
    divRight.className = 'section-button-right';
    component.appendChild(divRight);

    const h2 = document.createElement('h2');
    h2.textContent = mainText;
    divRight.appendChild(h2);

    const p = document.createElement('p');
    p.textContent = subText;
    divRight.appendChild(p);

    return component;
}