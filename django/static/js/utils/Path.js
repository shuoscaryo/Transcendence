export default class Path {
    static IMG_PATH = 'img';
    static CSS_PATH = 'css';
    static JS_PATH = 'js';

    constructor() {
        throw new Error('Path is a static class and cannot be instantiated.');
    }

    /* python os.path.join() equivalent */
    static join(...segments) {
        return segments
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
}