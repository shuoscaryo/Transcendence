// /static/js/utils/Path.js
export default class Path {
    // Static paths for static assets
    static #IMG_PATH = 'img';
    static #CSS_PATH = 'css';
    static #JS_PATH = 'js';
    static #PAGES_PATH = 'js/pages';
    static #MEDIA_PATH = 'media';
    static #API_PATH = 'api';

    // API paths (full paths as strings)
    static #API = {
        // Matches
        SEND_TOURNAMENT: Path.join('/', Path.#API_PATH, 'matches/send-tournament'),

        // Authentication
        IS_LOGGED: Path.join('/', Path.#API_PATH, 'is-logged'),
        LOGIN: Path.join('/', Path.#API_PATH, 'login'),
        LOGOUT: Path.join('/', Path.#API_PATH, 'logout'),
        REGISTER: Path.join('/', Path.#API_PATH, 'register'),

        // Profile
        PROFILE: Path.join('/', Path.#API_PATH, 'profile'),
        MATCH_HISTORY: Path.join('/', Path.#API_PATH, 'match-history'),

        // Friend requests
        SEND_FRIEND_REQUEST: Path.join('/', Path.#API_PATH, 'friends/request/send'),
        RESPOND_FRIEND_REQUEST: Path.join('/', Path.#API_PATH, 'friends/request/respond'),
        CANCEL_FRIEND_REQUEST: Path.join('/', Path.#API_PATH, 'friends/request/cancel'),
        GET_FRIEND_REQUESTS: Path.join('/', Path.#API_PATH, 'friends/request/list'),
        REMOVE_FRIEND: Path.join('/', Path.#API_PATH, 'friends/remove'),
        GET_FRIENDS: Path.join('/', Path.#API_PATH, 'friends/list'),

    };

    constructor() {
        throw new Error('Path is a static class and cannot be instantiated.');
    }

    // Public API object with validation using Proxy
    static API = new Proxy(Path.#API, {
        get(target, prop) {
            if (prop in target) {
                return target[prop];
            }
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
        return Path.join(Path.#IMG_PATH, ...segments);
    }

    static css(...segments) {
        return Path.join(Path.#CSS_PATH, ...segments);
    }

    static js(...segments) {
        return Path.join(Path.#JS_PATH, ...segments);
    }

    static page(...segments) {
        return Path.join(window.__STATIC_URL__, Path.#PAGES_PATH, ...segments);
    }

    static media(...segments) {
        return Path.join('/', Path.#MEDIA_PATH, ...segments);
    }
}