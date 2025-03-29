// /static/js/utils/Path.js
export default class Path {
    // Static paths for static assets
    static _IMG_PATH = 'img';
    static _CSS_PATH = 'css';
    static _JS_PATH = 'js';
    static _PAGES_PATH = 'js/pages';
    static _MEDIA_PATH = 'media';
    static _API_PATH = 'api';

    // API paths (full paths as strings)
    static _API = {
        // Matches
        SEND_TOURNAMENT: 'matches/send-tournament',

        // Authentication
        IS_LOGGED: 'is-logged',
        LOGIN: 'login',
        LOGOUT: 'logout',
        REGISTER: 'register',

        // Profile
        PROFILE: 'profile',
        MATCH_HISTORY: 'match-history',

        // Friend requests
        SEND_FRIEND_REQUEST: 'friends/request/send',
        RESPOND_FRIEND_REQUEST: 'friends/request/respond',
        CANCEL_FRIEND_REQUEST: 'friends/request/cancel',
        GET_FRIEND_REQUESTS: 'friends/request/list',
        REMOVE_FRIEND: 'friends/remove',
        GET_FRIENDS: 'friends/list',

    };

    static _WS_MSG = {
        ONLINE_STATUS: 'online_status',
    }

    constructor() {
        throw new Error('Path is a static class and cannot be instantiated.');
    }

    // Public API object with validation using Proxy
    static API = new Proxy(Path._API, {
        get(target, prop) {
            if (prop in target)
                return Path.join('/', Path._API_PATH, target[prop]);
            throw new Error(`Path.API.${String(prop)} does not exist`);
        }
    });

    /* python os.path.join() equivalent */
    static join(...segments) {
        return segments
            .filter(segment => segment != null)
            .map(segment => segment.replace(/\/+$/, ''))
            .join('/')
            .replace(/\/{2,}/g, '/');
    }

    /* These functions can be used as Path.f('folder/logo.png') or
    Path.f('folder', 'logo.png') */
    static img(...segments) {
        return Path.join(Path._IMG_PATH, ...segments);
    }

    static css(...segments) {
        return Path.join(Path._CSS_PATH, ...segments);
    }

    static js(...segments) {
        return Path.join(Path._JS_PATH, ...segments);
    }

    static page(...segments) {
        return Path.join(window.__STATIC_URL__, Path._PAGES_PATH, ...segments);
    }

    static media(...segments) {
        return Path.join('/', Path._MEDIA_PATH, ...segments);
    }
}