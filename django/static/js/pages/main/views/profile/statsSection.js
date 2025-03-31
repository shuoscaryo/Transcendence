import newElement from '/static/js/utils/newElement.js';

// Function to create and return a canvas with a bar graph
function createBarGraph(stats) {
    // Create the canvas element
    const canvas = newElement('canvas');
    canvas.id = 'matchesChart';
    canvas.width = 400;
    canvas.height = 200;

    // Get the 2D context for the canvas
    const ctx = canvas.getContext('2d');

    // Example data for the chart
    const data = {
        labels: ['Local', 'AI', 'Online'],
        datasets: [
            {
                label: 'Local Total',
                data: [stats.local.total, null, null], // Only Local has a value
                backgroundColor: '#888', // Gray color for Local
                barThickness: 20,
                categoryPercentage: 0.4, // Reduce the space assigned to this bar
            },
            {
                label: 'Wins',
                data: [null, stats.ai.wins, stats.online.wins], // Only AI and Online have values
                backgroundColor: '#2196f3', // Blue for wins
                barThickness: 10,
            },
            {
                label: 'Losses',
                data: [null, stats.ai.losses, stats.online.losses], // Only AI and Online have values
                backgroundColor: '#ca1e1e', // Red for losses
                barThickness: 10,
            }
        ]
    };

    // Chart configuration
    const config = {
        type: 'bar',
        data,
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }, // Hide the legend
                title: {
                    display: true,
                    text: 'Match Stats by Type'
                }
            },
            scales: {
                x: {
                    stacked: false, // Bars are not stacked
                    grid: { display: false }, // Hide grid lines on X axis
                    categoryPercentage: 0.8, // General space per category
                    barPercentage: 0.9,      // Width of bars within the category
                },
                y: {
                    beginAtZero: true, // Y axis starts at zero
                    ticks: { precision: 0 } // No decimals on Y axis
                }
            }
        }
    };

    // Initialize the chart on the canvas
    new Chart(ctx, config);

    // Return the canvas element
    return canvas;
}

// Main function to generate the stats section
export default function getStatsSection(profile, stats, matchHistory) {
    const component = newElement('div', { id: 'stats', classList: ['section-block'] });

    // Append the canvas with the bar graph to the component
    component.append(createBarGraph(stats));

    return component;
}