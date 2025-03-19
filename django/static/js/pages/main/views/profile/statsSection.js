import newElement from '/static/js/utils/newElement.js';

export default function getStatsSection(profile) {
    const component = newElement('div', {id: 'stats', classList: ['section-block']});

    return component;
}
