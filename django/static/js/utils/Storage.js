export default class Storage {
    static #storeApp = new Map();
    static #storePage = new Map();
    static #storeView = new Map();

    constructor() {
        throw new Error('Storage cannot be instantiated. Use its static methods instead.');
    }

    static #add(key, instance, store) {
        if (!key || typeof key !== 'string')
            throw new Error('A string key is required to add to storage.');
        if (!instance)
            throw new Error('An instance is required to add to storage.');
        if (this.#storeApp.has(key)
            || this.#storePage.has(key)
            || this.#storeView.has(key)) {
            throw new Error(`Instance with key "${key}" already exists in storage.`);
        }
        store.set(key, instance);
    }

    static addToView(key, instance) {
        this.#add(`view-${key}`, instance, this.#storeView);
    }

    static addToPage(key, instance) {
        this.#add(`page-${key}`, instance, this.#storePage);
    }

    static addToApp(key, instance) {
        this.#add(`app-${key}`, instance, this.#storeApp);
    }

    static get(key) {
        if (this.#storeApp.has(key))
            return this.#storeApp.get(key);
        if (this.#storePage.has(key))
            return this.#storePage.get(key);
        if (this.#storeView.has(key))
            return this.#storeView.get(key);
        throw new Error(`No instance found with key "${key}".`);
    }

    static has(key) {
        return this.#storeApp.has(key)
            || this.#storePage.has(key)
            || this.#storeView.has(key);
    }

    static delete(key) {
        if (this.#storeApp.has(key))
            this.#storeApp.delete(key);
        else if (this.#storePage.has(key))
            this.#storePage.delete(key);
        else if (this.#storeView.has(key))
            this.#storeView.delete(key);
        else
            throw new Error(`No instance found with key "${key}".`);
    }

    static deletePageData() {
        this.#storePage.clear();
        this.#storeView.clear();
    }

    static deleteViewData() {
        this.#storeView.clear();
    }

    static deleteAppData() {
        this.#storeApp.clear();
    }

    static deleteData() {
        this.#storeApp.clear();
        this.#storePage.clear();
        this.#storeView.clear();
    }
}
