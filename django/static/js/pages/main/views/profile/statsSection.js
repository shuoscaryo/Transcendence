import newElement from '/static/js/utils/newElement.js';

export default function getStatsSection() {
    const component = newElement('div', {id: 'stats', classList: ['section-block']});

    const canvas = newElement('canvas', {parent: component});
    canvas.id = 'matchesChart';
    canvas.width = 400;
    canvas.height = 200;

    const ctx = canvas.getContext('2d');

    // Datos de ejemplo
    const data = {
        labels: ['Local', 'AI Wins', 'AI Losses', 'Online Wins', 'Online Losses'],
        datasets: [{
            label: 'Games Played',
            data: [5, 8, 4, 10, 6],
            backgroundColor: [
                '#888',   // local
                '#4caf50', // ai win
                '#f44336', // ai lose
                '#2196f3', // online win
                '#e91e63'  // online lose
            ]
        }]
    };

    const config = {
        type: 'bar',
        data: data,
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                title: {
                    display: true,
                    text: 'Sample Match Stats'
                }
            }
        },
    };

    new Chart(ctx, config);

    return component;
}

