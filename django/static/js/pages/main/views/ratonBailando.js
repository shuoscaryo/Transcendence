import loadPage from '/static/js/utils/loadPage.js';


export default async function getView(component) {
    // ID del video de YouTube
    const videoId = "qS0HlqjQHnk";

    // Crea el iframe del video con autoplay activado
    const iframe = document.createElement("iframe");
    iframe.width = "560"; // Ancho del video
    iframe.height = "315"; // Alto del video
    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`; // autoplay agregado aquí
    iframe.title = "YouTube video player";
    iframe.frameBorder = "0";
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
    iframe.allowFullscreen = true;
    iframe.allow = "autoplay"; // Asegura que el autoplay esté permitido en algunos navegadores

    // Limpia el contenido del componente y añade el iframe
    component.appendChild(iframe);

    // Crea el botón de regreso
    const button = document.createElement("button");
    button.textContent = "Regresar";
    button.addEventListener("click", () => {
        loadPage("main", "home");
    });
    component.appendChild(button);
}