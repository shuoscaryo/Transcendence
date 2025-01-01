export class Ticker {
	/* Global tick count, use Ticker.now() to get the current tick count */
	static #count = 0;

	static {
		Ticker.#startCount();
	}

	static #startCount() {
		Ticker.#count++;
		requestAnimationFrame(() => Ticker.#startCount());
	}

	static now() {
		return Ticker.#count;
	}
}
