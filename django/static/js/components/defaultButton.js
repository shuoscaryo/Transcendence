export default function createButton({ bgColor, bgHoverColor, textColor, content, onClick }) {
    const component = document.createElement('button');
    component.classList.add('button-default');
    if (textColor !== undefined)
        component.style.color = textColor;
    
    // Add background color
    if(bgColor) {
        const hoverPercent = 10; // Default hover effect: 20% lighter
        const hoverColor = bgHoverColor ?? lightenColor(toRGBA(bgColor), hoverPercent);
        component.style.backgroundColor = bgColor;
        // Add hover effect
        component.addEventListener('mouseenter', () => {
            component.style.backgroundColor = hoverColor;
            component.style.boxShadow = `0 0 5px ${hoverColor}`;
        });
        component.addEventListener('mouseleave', () => {
            component.style.backgroundColor = bgColor;
            component.style.boxShadow = 'none';
        });
    }

    // Add content (text or HTML element)
    if (typeof content === 'string')
        component.textContent = content;
    else if (content instanceof HTMLElement)
        component.appendChild(content);
    else
        throw new Error('Content must be a string or a valid HTMLElement');

    // Add click event
    if (onClick && typeof onClick === 'function')
        component.addEventListener('click', onClick);
    else
        throw new Error('onClick must be a function');

    return component;
}

function toRGBA(color) {
    const tempElement = document.createElement('div');
    tempElement.style.backgroundColor = color; // Apply the color
    document.body.appendChild(tempElement); // Add the element to the DOM
    const computedColor = getComputedStyle(tempElement).backgroundColor; // Get the computed color
    document.body.removeChild(tempElement); // Remove the element from the DOM

    // Parse rgba/rgb text into a list of numbers
    const rgbaRegex = /rgba?\((\d+), (\d+), (\d+)(?:, ([\d.]+))?\)/;
    const match = computedColor.match(rgbaRegex);

    if (!match) {
        throw new Error('Invalid color format');
    }

    // Return [r, g, b, a] as numbers, with default opacity 1
    return [
        parseInt(match[1], 10), // r
        parseInt(match[2], 10), // g
        parseInt(match[3], 10), // b
        parseFloat(match[4] || '1') // a
    ];
}

function lightenColor(colorArray, percent) {
    // Extract r, g, b, and a values from the input array
    const [r, g, b, a = 1] = colorArray;

    // Calculate the lighter version of the color
    const newR = Math.min(255, Math.floor(r + (255 - r) * (percent / 100)));
    const newG = Math.min(255, Math.floor(g + (255 - g) * (percent / 100)));
    const newB = Math.min(255, Math.floor(b + (255 - b) * (percent / 100)));

    // Return the lighter color in rgba format
    return `rgba(${newR}, ${newG}, ${newB}, ${a})`;
}
