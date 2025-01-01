import Path from '/static/js/utils/Path.js';
import getSidebar from './sidebar.js';
import getContent from './homeContent.js';
import getFooter from './footer.js';

// General function to delete CSS files
function deleteDynamicStyles() {
    // Selecciona todos los elementos con la clase 'dynamic-style'
    const dynamicStyles = document.querySelectorAll('link.dynamic-style, style.dynamic-style');
    // Elimina cada elemento del DOM
    dynamicStyles.forEach(style => style.remove());
}

// General function to load CSS files
function loadCSS(filePaths) {
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

// Loads the page content and styles
export default async function mainPage() {
    deleteDynamicStyles();
    await loadCSS([
        Path.css('main/main.css'),
        Path.css('main/sidebar.css'),
        Path.css('main/mainView.css')
    ]);

    const app = document.getElementById('app');

    const page = document.createElement('div');
    page.id = 'page';
    app.appendChild(page);
    
    page.appendChild(getSidebar());

    const content = document.createElement('div');
    content.id = 'content';
    page.appendChild(content);
    
    content.appendChild(getContent());

    const footer = getFooter();
    content.appendChild(footer);
}
