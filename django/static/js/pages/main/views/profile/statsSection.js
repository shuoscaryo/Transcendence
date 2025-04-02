import newElement from '/static/js/utils/newElement.js';
import Path from '/static/js/utils/Path.js';

// Function to create and return a canvas with a bar graph
function getBarGraph(stats) {
    const canvas = newElement('canvas', {id: 'stats-bar-graph'});
    canvas.width = 400;
    canvas.height = 300;

    const ctx = canvas.getContext('2d');
    const data = {
        labels: ['Local', 'AI', 'Online', 'T_local', 'T_online'],
        datasets: [
            {
                label: 'Local Total',
                data: [stats.local.total, null, null, stats.tournaments_local.total, null],
                backgroundColor: '#888',
                barThickness: 20,
                categoryPercentage: 0.4,
                // move bar right
                order: 1,
            },
            {
                label: 'Wins',
                data: [null, stats.ai.wins, stats.online.wins, null, stats.tournaments_online.wins],
                backgroundColor: '#2196f3',
                barThickness: 10,
                // move bar left
                order: 0,
            },
            {
                label: 'Losses',
                data: [null, stats.ai.losses, stats.online.losses, null, stats.tournaments_online.losses],
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
            responsive: false,
            plugins: {
                legend: { display: false },
                title: {
                    display: true,
                    text: 'Total matches and wins/losses',
                    color: '#eee', // color claro para el título
                    font: { size: 16 }
                }
            },
            scales: {
                x: {
                    stacked: false,
                    grid: {
                        display: false,         // no dibuja líneas internas
                        drawBorder: true,       // sí muestra el eje
                        borderColor: '#eee'     // color claro para el eje
                    },
                    ticks: {
                        color: '#eee',
                        font: { size: 14 }
                    },
                    categoryPercentage: 0.8,
                    barPercentage: 0.9,
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0,
                        color: '#eee',
                        font: { size: 14 }
                    },
                    grid: {
                        display: false,
                        drawBorder: true,
                        borderColor: '#eee'     // color claro para el eje
                    }
                }
            }
        }
    };

    new Chart(ctx, config);
    return canvas;
}

function lastGamesStats(matchHistory) {

}

function formatTime(seconds) {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${(seconds / 3600).toFixed(1)}h`;
}

function getSummaryStats(stats) {
    const container = newElement('div', { id: 'summary-stats' });

    const table = newElement('table', { parent: container, classList: ['stats-table'] });

    const thead = newElement('thead', { parent: table });
    const headerRow = newElement('tr', { parent: thead });
    ['', 'Total', 'Time'].forEach(text => {
        const th = newElement('th', { parent: headerRow });
        th.textContent = text;
    });

    const tbody = newElement('tbody', { parent: table });

    const modes = {
        local: 'local',
        ai: 'AI',
        online: 'online',
        tournaments_local: 'tournament',
        tournaments_online: 'tournament_online'
    };

    for (const key in modes) {
        const section = stats[key];
        const total = section.total ?? 0;
        const seconds = section.total_seconds ?? 0;

        const row = newElement('tr', { parent: tbody });

        const imgCell = newElement('td', { parent: row });
        const img = newElement('img', { parent: imgCell });
        img.src = Path.img(`match_${modes[key]}.png`);
        img.width = 32;
        img.height = 32;

        newElement('td', { parent: row }).textContent = total;
        newElement('td', { parent: row }).textContent = formatTime(seconds);
    }

    const total = stats.summary?.total ?? 0;
    const totalSeconds = stats.summary?.total_seconds ?? 0;

    const totalRow = newElement('tr', { parent: tbody, classList: ['stat-summary'] });
    const totalLabel = newElement('td', { parent: totalRow });
    totalLabel.textContent = 'TOTAL';
    newElement('td', { parent: totalRow }).textContent = total;
    newElement('td', { parent: totalRow }).textContent = formatTime(totalSeconds);

    return container;
}

function addExtraStats(stats) {
    let globalTotal = 0;
    let globalSeconds = 0;
  
    for (const key in stats) {
      const section = stats[key];
      const { total = 0, wins = 0, total_seconds = 0 } = section;
  
      // losses = total - wins (solo si wins está definido)
      if ('wins' in section) {
        section.losses = total - wins;
      }
  
      // avg_match_duration = total_seconds / total
      section.avg_match_duration = total > 0 ? +(total_seconds / total).toFixed(1) : 0;
  
      // winrate = wins / total
      if (wins !== undefined && total > 0) {
        section.winrate = +(wins / total * 100).toFixed(1);
      }
  
      globalTotal += total;
      globalSeconds += total_seconds;
    }
  
    // añadir resumen global
    stats.summary = {
      total: globalTotal,
      total_seconds: globalSeconds,
      total_hours: + (globalSeconds / 3600).toFixed(2)
    };
  
    return stats;
  }

// Main function to generate the stats section
export default function getStatsSection(profile, stats, matchHistory) {
    stats = addExtraStats(stats);
    console.log(stats);
    console.log(matchHistory);
    const component = newElement('div', { id: 'stats-section', classList: ['section-block'] });


    // Append the canvas with the bar graph to the component
    component.append(getSummaryStats(stats));
    component.append(getBarGraph(stats));
    //component.append(lastGamesStats(matchHistory));

    return component;
}