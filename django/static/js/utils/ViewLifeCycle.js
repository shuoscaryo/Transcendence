class ViewLifeCycle {
    _generation = 0;
    _onMount = [];
    _onDestroy = [];
  
    onMount(fn) {
      this._onMount.push(fn);
    }
  
    onDestroy(fn) {
      this._onDestroy.push(fn);
    }
  
    addEventListener(target, event, handler, options = false) {
      target.addEventListener(event, handler, options);
      this.onDestroy(() => {
        target.removeEventListener(event, handler, options);
      });
    }
  
    wrapAsync(promise) {
      const currentGen = this._generation;
      return promise.then((result) => {
        if (currentGen !== this._generation)
          return Promise.reject("view changed");
        return result;
      });
    }
  
    async request(method, url, data = null) {
      return this.wrapAsync(
        (async () => {
          const options = {
            method: method.toUpperCase(),
            credentials: 'include'
          };
  
          if (data) {
            options.headers = { 'Content-Type': 'application/json' };
            options.body = JSON.stringify(data);
          }
  
          const response = await fetch(url, options);
          const contentLength = response.headers.get('Content-Length');
          let responseData = null;
  
          if (contentLength && response.headers.get('Content-Type')?.includes('application/json'))
            responseData = await response.json();
  
          if (!response.ok) {
            return {
              status: response.status,
              data: null,
              error: responseData?.error ?? `Request ${method} ${url} failed`
            };
          }
  
          return {
            status: response.status,
            data: responseData,
            error: null
          };
        })()
      );
    }
  
    mount() {
      this._onMount.forEach(fn => fn());
      this._onMount = [];
    }
  
    destroy() {
      this._generation++; // invalida wrapAsync previos
      this._onDestroy.forEach(fn => fn());
      this._onDestroy = [];
    }
  }
  
  export default new ViewLifeCycle();
  