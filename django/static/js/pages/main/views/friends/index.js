import getDefaultButton from '/static/js/components/defaultButton.js';
import newElement from '/static/js/utils/newElement.js';
import Path from '/static/js/utils/Path.js';
import { navigate } from '/static/js/utils/router.js';
import { usernameOk } from '/static/js/utils/validators.js';
import WebSocketService from '/static/js/utils/WebSocketService.js';
import { formatTimeAgo } from '/static/js/utils/time.js';
import ViewScope from '/static/js/utils/ViewScope.js';

import getFriendListSection from './getFriendListSection.js';
import getRequestSection from './getRequestSection.js';

export default async function getView(isLogged, path) {
    if (!isLogged) {
        return { status: 300, redirect: "/login/login" };
    }

    const css = [
        Path.css('main/friends.css'),
    ];
    const component = document.createElement('main');

    const title = newElement('h1', { parent: component, id: 'title' });
    title.textContent = "🤝Friends";
    component.append(await getRequestSection());
    component.append(await getFriendListSection());

    return { status: 200, component, css };
}