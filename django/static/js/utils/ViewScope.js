import getCookie from "/static/js/utils/getCookie.js";

/**
 * ViewScope is a global singleton that manages the lifecycle of views in a single-page application (SPA).
 *
 * Its main role is to provide tools for safely:
 * - Attaching logic to the current view (onMount / onDestroy)
 * - Managing global event listeners with automatic cleanup
 * - Handling async operations that might resolve after the view has already changed (via wrapAsync)
 * - Performing fetch requests with built-in safety and response parsing
 *
 * This class is meant to prevent common SPA issues such as:
 * - Updating the DOM of an old view after navigating away
 * - Memory leaks from forgotten event listeners
 * - Race conditions from delayed async actions (like fetch or timers)
 *
 * Use it in any view or component logic that needs to:
 * - Interact with the DOM
 * - Listen to document/window events
 * - Perform HTTP requests
 * - Handle view-local resources like intervals, animations, sockets
 */
class ViewScope {
    static VIEW_CHANGED = Symbol('view changed'); // special throw type
    
    _generation = 0;
    _onMount = [];
    _onDestroy = [];

    /**
     * Register a function to be called when the view is mounted.
     * Returns an unsubscribe function that removes the callback.
     *
     * @param {() => void} fn - The function to run on mount.
     * @returns {() => void} Unsubscribe function
     */
    onMount(fn) {
        this._onMount.push(fn);
        return () => {
            this._onMount = this._onMount.filter(f => f !== fn);
        };
    }

    /**
     * Register a function to be called when the view is destroyed (unmounted).
     * Returns an unsubscribe function that removes the callback.
     *
     * @param {() => void} fn - The function to run on destroy.
     * @returns {() => void} Unsubscribe function
     */
    onDestroy(fn) {
        this._onDestroy.push(fn);
        return () => {
            this._onDestroy = this._onDestroy.filter(f => f !== fn);
        };
    }

    /**
     * Adds an event listener to a global target (e.g. window or document),
     * and ensures it is removed automatically when the view is destroyed.
     * Also returns a function that can be called to remove the listener manually before that.
     *
     * @param {EventTarget} target - The object to attach the event to (e.g. document, window).
     * @param {string} event - The event name (e.g. 'keydown').
     * @param {Function} handler - The event handler.
     * @param {boolean|AddEventListenerOptions} [options=false] - Options passed to addEventListener.
     * @returns {() => void} Function to remove the listener manually.
     */
    addEventListener(target, event, handler, options = false) {
        target.addEventListener(event, handler, options);
        const off = () => {
            target.removeEventListener(event, handler, options);
        };
        const unsubscribe = this.onDestroy(off);
        return () => {
            off();       // quitar el listener manualmente
            unsubscribe(); // quitar de la lista de onDestroy
        };
    }

    /**
	 * Wraps an async operation so that if the view is destroyed before it finishes,
	 * the result is ignored and a special VIEW_CHANGED error is thrown.
	 * Useful to prevent logic running on stale views.
	 * @template T
	 * @param {Promise<T>} promise - The promise to wrap.
	 * @returns {Promise<T>} The original result, or a rejected promise with VIEW_CHANGED.
	 */
    wrapAsync(promise) {
        const currentGen = this._generation;
        return promise.then((result) => {
            if (currentGen !== this._generation)
                return Promise.reject(this.VIEW_CHANGED);
            return result;
        });
    }

	/**
	 * Performs a fetch request that is automatically aware of the current view lifecycle.
	 * This method is the preferred way to make API calls inside views.
	 *
	 * It automatically:
	 * - Aborts handling if the view changes before the response arrives
	 * - Parses the response according to the Content-Type (JSON, text, blob)
	 * - Provides optional callbacks to handle result and errors cleanly
	 * - Supports using `await` and accessing the result directly if needed
	 *
	 * @param {string} method - HTTP method (GET, POST, PUT, etc.)
	 * @param {string} url - The URL to request
	 * @param {any} data - Optional body. If an object or string is provided, it will be JSON-stringified.
	 * @param {Object} options - Extra config
	 * @param {(res: {status: number, headers: Headers, data: any}) => void} [options.onResolve] - Called with the parsed response (status, headers, body) after a successful request
	 * @param {(err: any) => void} [options.onThrow] - Called if the request throws (network error, invalid JSON, etc.). Not called if the view changed.
	 * @param {boolean} [options.disableCatch=false] - If true, errors are thrown as normal — useful for external `try/catch` or Promise.all
	 * @param {Object} [options.headers={}] - Optional custom headers (default is Content-Type: application/json)
	 * @param {...any} [options] - All other native fetch options (credentials, mode, signal, etc.)
	 * @returns {Promise<{status: number, headers: Headers, data: any} | null>} - Parsed result or `null` if the view changed or an error occurred and was caught
	 *
	 * 🟢 Use `onResolve` to safely handle the result without needing try/catch
	 * 🔴 Use `onThrow` for custom error handling (e.g., showing alerts or retries)
	 * 🟡 If `disableCatch = true`, you must handle errors manually with try/catch
	 */
    async request(method, url, {
        body = null,
        onResolve,
        onThrow = (err) => console.error(err),
        disableCatch = false,
        headers = {},
        ...options
    } = {}) {
        try {
            const finalHeaders = { ...headers };
            let parsedBody = body;
    
            // Auto-handle Content-Type and JSON body
            if (body !== null && !('Content-Type' in finalHeaders)) {
                finalHeaders['Content-Type'] = 'application/json';
                parsedBody = typeof body === 'string' ? body : JSON.stringify(body);
            }

            // Remove the Content-Type header if is set to null
            if (finalHeaders['Content-Type'] === null)
                delete finalHeaders['Content-Type'];

            // Add CSRF token to headers if available
            const csrfToken = getCookie('csrftoken');
            if (csrfToken && !('X-CSRFToken' in finalHeaders))
                finalHeaders['X-CSRFToken'] = csrfToken;

            // Final options: merge fixed defaults + user options
            const fetchOptions = Object.assign({
                method: method.toUpperCase(),
                credentials: 'include',
                headers: finalHeaders,
                body: parsedBody,
            }, options);
    
            // Perform the request
            const res = await this.wrapAsync(fetch(url, fetchOptions));
    
            // Build the response object
            const contentType = res.headers.get('Content-Type') || '';
            const contentLength = res.headers.get('Content-Length');
            
            let responseData = null;
            
            if (contentLength !== '0' && contentLength !== null) {
                if (contentType.includes('application/json')) {
                    responseData = await res.json();
                } else if (contentType.startsWith('text/')) {
                    responseData = await res.text();
                } else {
                    responseData = await res.blob();
                }
            }

            const resData = {
                status: res.status,
                headers: res.headers,
                data: responseData
            };
    
            onResolve?.(resData);
            return resData;
        } catch (err) {
            if (disableCatch) throw err;
            if (err === this.VIEW_CHANGED) return null;
            onThrow?.(err);
            return null;
        }
    }

    /**
	 * Called by the router when the view is mounted.
	 * Executes all `onMount` callbacks and clears the list.
	 */
    mount() {
        this._onMount.forEach(fn => fn());
        this._onMount = [];
    }

    /**
	 * Called by the router when the view is about to be replaced.
	 * Increments the generation (invalidating `wrapAsync` promises),
	 * and executes all registered `onDestroy` callbacks.
	 */
    destroy() {
        this._generation++; // invalida wrapAsync previos
        this._onDestroy.forEach(fn => fn());
        this._onDestroy = [];
    }
}
  
export default new ViewScope();
  