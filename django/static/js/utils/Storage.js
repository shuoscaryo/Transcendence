export default class Storage {
    static store = new Map();

    constructor() {
        throw new Error('Storage cannot be instantiated. Use its static methods instead.');
    }

    static add(key, instance) {
        if (!key || typeof key !== 'string') {
            throw new Error('A string key is required to add to storage.');
        }
        if (!instance) {
            throw new Error('An instance is required to add to storage.');
        }
        if (this.store.has(key)) {
            throw new Error(`Instance with key "${key}" already exists in storage.`);
        }
        this.store.set(key, instance);
    }

    static get(key) {
        if (!this.store.has(key)) {
            throw new Error(`No instance found with key "${key}".`);
        }
        return this.store.get(key);
    }

    static delete(key) {
        if (!this.store.has(key)) {
            throw new Error(`No instance found with key "${key}".`);
        }
        return this.store.delete(key);
    }

    static has(key) {
        return this.store.has(key);
    }

    static clear() {
        this.store.clear();
    }
}
