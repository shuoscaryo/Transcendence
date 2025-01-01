function loadCSS(filePaths, className) {
    return Promise.all(
        filePaths.map(filePath => {
            return new Promise((resolve, reject) => {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.className = className;
                link.href = filePath;

                // Resolver cuando el archivo CSS haya terminado de cargarse
                link.onload = () => resolve();
                link.onerror = () => reject(`Error loading CSS file: ${filePath}`);

                document.head.appendChild(link);
            });
        })
    );
}

export function loadViewCss(viewNames) {
    return loadCSS(viewNames, 'view-style');
}

export function loadPageCss(pageNames) {
    return loadCSS(pageNames, 'page-style');
}

export function deleteViewCss() {
    const viewStyles = document.getElementsByClassName('view-style');
    while (viewStyles.length > 0) {
        viewStyles[0].remove();
    }
}

export function deletePageCss() {
    const pageStyles = document.getElementsByClassName('page-style');
    while (pageStyles.length > 0) {
        pageStyles[0].remove();
    }
}

export function deleteCss() {
    deleteViewCss();
    deletePageCss();
}