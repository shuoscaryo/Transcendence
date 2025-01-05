export default class Path {
    static IMG_PATH = 'img';
    static CSS_PATH = 'css';
    static JS_PATH = 'js';
    static PAGES_PATH = 'js/pages';

    constructor() {
        throw new Error('Path is a static class and cannot be instantiated.');
    }

    static url() {
        // Get the current URL
        const currentURL = new URL(window.location.href);

        // Get the path segments
        const segments = currentURL.pathname
            .split('/')
            .filter(segment => segment.length > 0);

        return segments;
    }

    /* python os.path.join() equivalent */
    static join(...segments) {
        return segments
            .filter(segment => segment != null) // TODO check if works
            .map(segment => segment.replace(/\/+$/, ''))
            .join('/')
            .replace(/\/{2,}/g, '/');
    }

    /* These functions can be used as Path.f('folder/logo.png') or
    Path.f('folder', 'logo.png') */
    static img(...segments) {
        return Path.join(Path.IMG_PATH, ...segments);
    }

    static css(...segments) {
        return Path.join(Path.CSS_PATH, ...segments);
    }

    static js(...segments) {
        return Path.join(Path.JS_PATH, ...segments);
    }

    static page(...segments) {
        return Path.join(window.__STATIC_URL__, Path.PAGES_PATH, ...segments);
    }
}
