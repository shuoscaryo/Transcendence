import newElement from '/static/js/utils/newElement.js';

// Function to create and return a canvas with a bar graph
function getBarGraph(stats) {
    const canvas = newElement('canvas');
    canvas.id = 'matchesChart';
    canvas.width = 400;
    canvas.height = 200;

    const ctx = canvas.getContext('2d');

    const data = {
        labels: ['Local', 'AI', 'Online'],
        datasets: [
            {
                label: 'Local Total',
                data: [stats.local.total, null, null],
                backgroundColor: '#888',
                barThickness: 20,
                categoryPercentage: 0.4,
                // move bar right
                order: 1,
            },
            {
                label: 'Wins',
                data: [null, stats.ai.wins, stats.online.wins],
                backgroundColor: '#2196f3',
                barThickness: 10,
                // move bar left
                order: 0,
            },
            {
                label: 'Losses',
                data: [null, stats.ai.losses, stats.online.losses],
                backgroundColor: '#ca1e1e',
                barThickness: 10,
                order: 1,
            }
        ]
    };

    const config = {
        type: 'bar',
        data,
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                title: {
                    display: true,
                    text: 'Total matches and wins/losses',
                }
            },
            scales: {
                x: {
                    stacked: false,
                    grid: { display: false },
                    categoryPercentage: 0.8,
                    barPercentage: 0.9
                },
                y: {
                    beginAtZero: true,
                    ticks: { precision: 0 }
                }
            }
        }
    };

    new Chart(ctx, config);
    return canvas;
}

function lastGamesStats(matchHistory) {

}


// Main function to generate the stats section
export default function getStatsSection(profile, stats, matchHistory) {
    const component = newElement('div', { id: 'stats-section', classList: ['section-block'] });

    const generalStatsDiv = newElement('div', {id: 'general-stats', parent: component});

    // Append the canvas with the bar graph to the component
    component.append(getBarGraph(stats)); // TODO fix the local bar looking weird
    component.append(lastGamesStats(matchHistory));

    return component;
}