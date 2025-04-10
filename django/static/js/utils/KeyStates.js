class KeyStates {
    static keyState = {};

    constructor() {
        throw new Error('KeyStates is a static class and cannot be instantiated.');
    }

    static init() {
        document.addEventListener('keydown', (event) => {
            KeyStates.keyState[event.key] = true;
        });

        document.addEventListener('keyup', (event) => {
            KeyStates.keyState[event.key] = false;
        });

        // Reset all keys when window loses focus
        window.addEventListener('blur', () => {
            KeyStates.keyState = {};
        });
    }

    static get(key) {
        return KeyStates.keyState[key] || false;
    }
}

// Auto initialize KeyStates
KeyStates.init();

export default KeyStates;