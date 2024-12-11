
export default function main()
{
    const headerElement = document.createElement('header');
    headerElement.className = 'main-header';

    const title = document.createElement('h1');
    title.textContent = 'My Application';
    title.className = 'header-title';

    const nav = document.createElement('nav');
    nav.className = 'main-nav';

    const links = [
        { label: 'Home', href: '#home' },
        { label: 'About', href: '#about' },
        { label: 'Contact', href: '#contact' }
    ];

    links.forEach(link => {
        const anchor = document.createElement('a');
        anchor.textContent = link.label;
        anchor.href = link.href;
        anchor.className = 'nav-link';

        anchor.addEventListener('click', (event) => {
            event.preventDefault();
            console.log(`Navigating to ${link.href}`);
        });

        nav.appendChild(anchor);
    });

    headerElement.appendChild(title);
    headerElement.appendChild(nav);

    return headerElement;
}