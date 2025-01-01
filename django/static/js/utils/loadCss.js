export default function loadCSS(filePaths, deleteDynamicStyles = true) {
    if (deleteDynamicStyles) {
        const dynamicStyles = document.querySelectorAll('link.dynamic-style, style.dynamic-style');
        dynamicStyles.forEach(style => style.remove());
    }

    return Promise.all(
        filePaths.map(filePath => {
            return new Promise((resolve, reject) => {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.className = 'dynamic-style';
                link.href = filePath;

                // Resolver cuando el archivo CSS haya terminado de cargarse
                link.onload = () => resolve();
                link.onerror = () => reject(`Error loading CSS file: ${filePath}`);

                document.head.appendChild(link);
            });
        })
    );
}