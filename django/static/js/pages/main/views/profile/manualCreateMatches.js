import { navigate } from '/static/js/utils/router.js';
import getDefaultButton from '/static/js/components/defaultButton.js';
import { usernameOk } from '/static/js/utils/validators.js';
import newElement from '/static/js/utils/newElement.js';
import request from '/static/js/utils/request.js';

function isUintValid(score) {
    for (let i = 0; i < score.length; i++) {
        if (score[i] < '0' || score[i] > '9') return false;
    }
    return true;
}

function getInputRow(label, type, name, value, required = true) {
    const component = newElement('div', {classList: ['input-row']});
    
    // component
    const labelElement = newElement('label', {parent: component});
    labelElement.textContent = label;
    const input = newElement('input', {parent: component});
    input.type = type;
    input.name = name;
    input.value = value;
    input.required = required;
    
    return component;
}

function getNewMatchForm(profile) {
    const component = document.createElement('div');

    // component
    const title = newElement('div', {parent: component, classList: ['subsection-title']});
    title.textContent = 'Create Match';
    const form = newElement('form', {parent: component});
    form.method = "POST";
    
    // component form
    const inputDiv = newElement('div', {parent: form, classList: ['input-div']});

    // component form inputDiv
    inputDiv.append(getInputRow('Player Left:', 'text', 'playerLeft', profile.display_name, true));
    inputDiv.append(getInputRow('Player Right:', 'text', 'playerRight', 'player2', false));
    inputDiv.append(getInputRow('Score Left:', 'number', 'scoreLeft', 10, true));
    inputDiv.append(getInputRow('Score Right:', 'number', 'scoreRight', 5, true));
    inputDiv.append(getInputRow('Duration (s):', 'number', 'duration', 120, true));
    const matchTypeDiv = newElement('div', {parent: inputDiv, classList: ['input-row']});

    // component form inputDiv matchTypeDiv
    const matchTypeLabel = newElement('label', {parent: matchTypeDiv});
    matchTypeLabel.textContent = 'Match Type:';
    const matchTypeSelect = newElement('select', {parent: matchTypeDiv});
    matchTypeSelect.name = 'matchType';

    // component form inputDiv matchTypeDiv matchTypeSelect
    const types = ['local', 'AI', 'online'];
    types.forEach(type => {
        const option = newElement('option', {parent: matchTypeSelect});
        option.value = type;
        option.textContent = type;
        if (type === 'local')
            option.selected = true;
    });

    // component form
    const submitButton = getDefaultButton({
        bgColor: 'var(--color-lime)',
        content: 'Create Match',
    });
    form.append(submitButton);
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
    
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
    
        if (!usernameOk(data.playerLeft)) {
            alert('Invalid player left');
            return;
        }
        if (data.matchType === 'online' && data.playerRight !== '' && !usernameOk(data.playerRight)) {
            alert('Invalid player right');
            return;
        }
        if (!isUintValid(data.scoreLeft) || !isUintValid(data.scoreRight)) {
            alert('Invalid scores');
            return;
        }
        if (!isUintValid(data.duration)) {
            alert('Invalid duration');
            return;
        }
        const response = await request('POST', '/api/add-match', data);
        if (response.status === 200) {
            alert('Match added successfully!');
            navigate();
        } else {
            alert(`Error: ${response.error}`);
        }
    });

    return component;
}

function getNewTournamentForm(profile) {
    const component = document.createElement('div');
    
    // component
    const title = newElement('div', {parent: component, classList: ['subsection-title']});
    title.textContent = 'Create Tournament';

    const form = newElement('form', {parent: component});
    form.method = "POST";

    // component form
    const inputDiv = newElement('div', {parent: form, classList: ['input-div']});

    // component form inputDiv
    inputDiv.append(getInputRow('Player List:', 'text', 'playerList',
        `${profile.display_name}, player2, player3`, true));
    inputDiv.append(getInputRow('Winner:', 'text', 'winner', profile.display_name, true));
    inputDiv.append(getInputRow('Duration (s):', 'number', 'duration', 1200, true));
    const matchTypeDiv = newElement('div', {parent: inputDiv, classList: ['input-row']});
    
    // component form inputDiv matchTypeDiv
    const matchTypeLabel = newElement('label', {parent: matchTypeDiv});
    matchTypeLabel.textContent = 'Match Type:';
    const matchTypeSelect = newElement('select', {parent: matchTypeDiv});
    matchTypeSelect.name = 'matchType';
    
    // component form inputDiv matchTypeDiv matchTypeSelect
    const types = ['tournament-local', 'tournament-online'];
    types.forEach(type => {
        const option = newElement('option', {parent: matchTypeSelect});
        option.value = type;
        option.textContent = type;
        if (type === 'tournament-local')
            option.selected = true;
    });

    // component form
    form.append(getDefaultButton({
        bgColor: 'var(--color-lime)',
        content: 'Create Tournament',
    }));
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
    
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
    
        data.playerList = data.playerList.split(',').map(p => p.trim());
        if (!data.playerList.every(usernameOk)) {
            alert('Invalid player list');
            return;
        }
        if (data.playerList.length < 2 || data.playerList.length > 8) {
            alert('players must be between 2 and 8');
            return;
        }
        if (!data.winner || !data.playerList.includes(data.winner)) {
            alert('Invalid winner');
            return;
        }
        if (!isUintValid(data.duration)) {
            alert('Invalid duration');
            return;
        }
        const response = await request('POST', '/api/add-tournament', data);
        if (response.status === 200) {
            alert('Tournament added successfully!');
            navigate();
        } else {
            alert(`Failed to add tournament (${response.error})`);
        }
    });

    return component;
}

export default function getCreateELementsDiv(profile) {
    const component = newElement('div', {id: 'create-elements-subsection'});

    // component
    const header = newElement('div', {parent: component, classList: ['subsection-header']});
    
    // component header
    const headerTitle = newElement('div', {parent: header, classList: ['subsection-title']});
    headerTitle.textContent = 'Manually Create Matches & Tournaments';
    const headerButton = getDefaultButton({
        bgColor: 'var(--color-lime)',
        content: 'Show forms',
        onClick: () => {
            if (createElementsDiv.style.display === 'none') {
                createElementsDiv.style.display = 'flex';
                headerButton.textContent = 'Hide forms';
            } else {
                createElementsDiv.style.display = 'none';
                headerButton.textContent = 'Show forms';
            }
        }
    });
    header.append(headerButton);

    // component
    const createElementsDiv = newElement('div', {id: 'create-elements-form-container', parent: component});
    createElementsDiv.style.display = 'none';

    // component createElementsDiv
    const addNewMatchDiv = getNewMatchForm(profile);
    addNewMatchDiv.classList.add('new-element-form');
    createElementsDiv.append(addNewMatchDiv);

    const addNewTournamentDiv = getNewTournamentForm(profile);
    addNewTournamentDiv.classList.add('new-element-form');
    createElementsDiv.append(addNewTournamentDiv);

    return component;
}