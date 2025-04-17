class KeyStates {
    static keyState = {};

    constructor() {
        throw new Error('KeyStates is a static class and cannot be instantiated.');
    }

    static init() {
        document.addEventListener('keydown', event => {
            const key = event.key.length === 1 
                ? event.key.toLowerCase() 
                : event.key;
            KeyStates.keyState[key] = true;
        });
          
        document.addEventListener('keyup', event => {
            const key = event.key.length === 1 
                ? event.key.toLowerCase() 
                : event.key;
            KeyStates.keyState[key] = false;
        });

        // Reset all keys when window loses focus
        window.addEventListener('blur', () => {
            KeyStates.keyState = {};
        });
    }

    static get(key) {
        const isLetter = key.length === 1 && key.match(/[a-z]/i);
        const processedKey = isLetter ? key.toLowerCase() : key;
        return KeyStates.keyState[processedKey] || false;
    }
}

// Auto initialize KeyStates
KeyStates.init();

export default KeyStates;