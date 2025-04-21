import newElement from '/static/js/utils/newElement.js';
import Path from '/static/js/utils/Path.js';

export default function getFooter() {
    const component = document.createElement('footer');
    component.className = 'main-footer';

    newElement('span', {
        parent: component,
        textContent: 'Ft-transcendence by '
    });

    const users = [
        { name: 'orudek', github: 'https://github.com/shuoscaryo', school: 'https://profile.intra.42.fr/users/orudek' },
        { name: 'iortega-', github: 'https://github.com/NACHORTE', school: 'https://profile.intra.42.fr/users/iortega-' },
        { name: 'aabourri', github: 'https://github.com/kuragna', school: 'https://profile.intra.42.fr/users/aabourri' }
    ];

    users.forEach((user, i) => {
        const container = newElement('span', { parent: component, className: 'user-link' });

        // GitHub logo con link
        const githubLink = newElement('a', {
            parent: container,
            href: user.github,
            target: '_blank'
        });
        newElement('img', {
            parent: githubLink,
            src: Path.img('githubLogo.png'),
            alt: 'GitHub'
        });

        // 42 logo con link
        const schoolLink = newElement('a', {
            parent: container,
            href: user.school,
            target: '_blank'
        });
        newElement('img', {
            parent: schoolLink,
            src: Path.img('42Logo.png'),
            alt: '42'
        });

        container.append(` ${user.name}`);
        if (i < users.length - 1) component.append(' • ');
    });

    return component;
}
