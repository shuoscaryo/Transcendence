import newElement from '/static/js/utils/newElement.js';
import Path from '/static/js/utils/Path.js';

// Function to create and return a canvas with a bar graph
function getBarGraph(stats) {
    const canvas = newElement('canvas', {id: 'stats-bar-graph'});
    canvas.width = 400;
    canvas.height = 300;

    const ctx = canvas.getContext('2d');
    const data = {
        labels: ['Local', 'AI', 'Online', 'Tournament'],
        datasets: [
            {
                label: 'Local Total',
                data: [stats.local.total, null, null, null],
                backgroundColor: '#888',
                barThickness: 20,
                categoryPercentage: 0.4,
                order: 1,
            },
            {
                label: 'Wins',
                data: [null, stats.ai.wins, stats.online.wins, stats.tournament.wins],
                backgroundColor: '#2196f3',
                barThickness: 10,
                order: 0,
            },
            {
                label: 'Losses',
                data: [null, stats.ai.losses, stats.online.losses, stats.tournament.losses],
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
                    color: '#eee',
                    font: { size: 16 }
                }
            },
            scales: {
                x: {
                    stacked: false,
                    grid: {
                        display: false,
                        drawBorder: true,
                        borderColor: '#eee'
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
                        borderColor: '#eee'
                    }
                }
            }
        }
    };

    new Chart(ctx, config);
    return canvas;
}

export function lastGamesStats(matchHistory, profile) {
    let wins = 0;
    let losses = 0;
    let neutral = 0;
    let totalScoreMe = 0;
    let totalScoreOpp = 0;

    const matchTypes = { local: 0, AI: 0, online: 0, tournament: 0};

    for (const match of matchHistory) {
        let type = match.match_type;
        if (type === 'tournament_local')
            type = 'tournament';
        // Skip if the match type is not in the list
        if (matchTypes[type] === undefined)
            continue;
        // Add to the match type count
        matchTypes[type]++;
        if (type === 'local') {
            neutral++;
            totalScoreMe += match.score_left; // I'm always left in local matches
            totalScoreOpp += match.score_right;
        } else if (type === 'AI' || type === 'online') {
            const isPlayer1 = match.player_left__display_name === profile.display_name;
            const myScore = isPlayer1 ? match.score_left : match.score_right;
            const oppScore = isPlayer1 ? match.score_right : match.score_left;
            totalScoreMe += myScore;
            totalScoreOpp += oppScore;
            if (myScore > oppScore)
                wins++;
            else
                losses++;
        } else { // is tournament
            if (match.winner === profile.display_name)
                wins++;
            else
                losses++;
        }
    }

    const totalGames = wins + losses + neutral;
    const totalNormalMatches = matchTypes.local + matchTypes.AI + matchTypes.online;
    const winrate = wins + losses > 0 ? Math.round((wins / (wins + losses)) * 100) : 0;
    const avgMe = totalNormalMatches > 0 ? (totalScoreMe / totalNormalMatches).toFixed(1) : '0';
    const avgOpp = totalNormalMatches > 0 ? (totalScoreOpp / totalNormalMatches).toFixed(1) : '0';

    const container = newElement('div', { id: 'last-games-stats', classList: ['last-games-container'] });

    // Title
    const title = newElement('p', { parent: container, classList: ['last-games-title'] });
    title.textContent = `Last ${totalGames} matches`;

    // Wrapper for left and right blocks
    const mainContent = newElement('div', { parent: container, classList: ['last-games-main'] });

    // LEFT side: graph + score
    const leftBlock = newElement('div', { parent: mainContent, classList: ['left-block'] });

    const pieBox = newElement('div', { parent: leftBlock, classList: ['pie-box'] });
    const canvas = newElement('canvas', { parent: pieBox });
    canvas.width = 150;
    canvas.height = 150;
    const ctx = canvas.getContext('2d');

    const pieData = totalGames > 0
        ? {
            labels: ['Wins', 'Losses', 'Neutral'],
            datasets: [{
                data: [wins, losses, neutral],
                backgroundColor: ['#2196f3', '#ca1e1e', '#888']
            }]
        }
        : {
            labels: ['No matches'],
            datasets: [{
                data: [1],
                backgroundColor: ['#ccc']
            }]
        };

    new Chart(ctx, {
        type: 'pie',
        data: pieData,
        options: {
            layout: { padding: 0 },
            plugins: {
                legend: { display: false },
                title: { display: false }
            },
            responsive: false,
            maintainAspectRatio: false
        }
    });

    const winrateDiv = newElement('div', { parent: pieBox, classList: ['winrate-box'] });
    newElement('span', { parent: winrateDiv, classList: ['winrate-text'], textContent: 'Winrate' });
    const winrateValue = newElement('span', { parent: winrateDiv, classList: ['winrate-value'] });
    winrateValue.textContent = `${wins + losses > 0 ? `${winrate}%` : '-'}`;

    const scoreBox = newElement('div', { parent: leftBlock, classList: ['score-box'] });
    newElement('p', { parent: scoreBox }).textContent = 'Average Score (You vs Opponent)';
    newElement('p', { parent: scoreBox, classList: ['score-values'] }).textContent = `${avgMe} - ${avgOpp}`;

    // RIGHT side: match type breakdown
    const rightBlock = newElement('div', { parent: mainContent, classList: ['right-block'] });
    newElement('p', {
        parent: rightBlock,
        textContent: 'Match Types Breakdown',
        style: 'font-weight: bold'
    });
    
    const list = newElement('ul', { parent: rightBlock, classList: ['match-types-list'] });
    
    Object.entries(matchTypes).forEach(([type, count]) => {
        const percent = Math.round((count / totalGames) * 100) || 0;
    
        const li = newElement('li', { parent: list, classList: ['match-type-item'] });
    
        newElement('span', { parent: li, textContent: type, classList: ['type-label'] });
        newElement('span', { parent: li, textContent: `${percent}%`, classList: ['type-percent'] });
    });
    return container;
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
        tournament: 'tournament',
    };

    for (const key in modes) {
        const section = stats[key];
        const total = section?.total ?? 0;
        const seconds = section?.total_seconds ?? 0;

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
  
        // Add losses if not already present
        if ('wins' in section && 'total' in section)
            section.losses = total - wins;

        // avg_match_duration = total_seconds / total
        section.avg_match_duration = total > 0 ? (total_seconds / total).toFixed(1) : 0;

        // winrate = wins / total
        if (wins !== undefined && total > 0)
            section.winrate = +(wins / total * 100).toFixed(1);

        globalTotal += total;
        globalSeconds += total_seconds;
    }
  
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

    const component = newElement('div', { id: 'stats-section', classList: ['section-block'] });

    // Append the canvas with the bar graph to the component
    component.append(getSummaryStats(stats));
    component.append(getBarGraph(stats));
    component.append(lastGamesStats(matchHistory, profile));

    return component;
}