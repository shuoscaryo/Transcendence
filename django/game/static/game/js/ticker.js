class Ticker {
	/* Global tick count, use Ticker.now() to get the current tick count */
	static #count = 0;

	static {
		Ticker.#iniciarCuenta();
	}

	static #iniciarCuenta() {
		Ticker.#count++;
		requestAnimationFrame(() => Ticker.#iniciarCuenta());
	}

	static now() {
		return Ticker.#count;
	}
}
	