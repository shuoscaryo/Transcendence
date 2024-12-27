import { getSidebar } from './components/sidebar.js';
import KeyStates from './KeyStates.js';
import { PongGame } from './components/PongGame.js';
import { Storage } from './Storage.js';
import { DemoAI, PongAI, PlayerController } from './Controller.js';

// General function to delete CSS files
function deleteDynamicStyles() {
    // Selecciona todos los elementos con la clase 'dynamic-style'
    const dynamicStyles = document.querySelectorAll('link.dynamic-style, style.dynamic-style');
    // Elimina cada elemento del DOM
    dynamicStyles.forEach(style => style.remove());
}

// General function to load CSS files
function loadCSS(filePaths) {
    filePaths.forEach(filePath => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.className = 'dynamic-styles';
        link.href = filePath;
        document.head.appendChild(link);
    });
}

function getSection1() {
    const section = document.createElement('section');

    const canvas = document.createElement('canvas');
    canvas.id = 'demo-gameplay';
    section.appendChild(canvas);

    const pong = new PongGame(canvas);
    Storage.add("pong",pong);

    const startButton = document.createElement('button');
    startButton.textContent = 'Start';
    startButton.addEventListener('click', () => {
        Storage.get("pong").start();
    });
    section.appendChild(startButton);
    pong.controller1 = new DemoAI(pong.leftPaddle, pong.getState.bind(pong));
    pong.controller2 = new PongAI(pong.rightPaddle, pong.getState.bind(pong));


    const stopButton = document.createElement('button');
    stopButton.textContent = 'Stop';
    stopButton.addEventListener('click', () => {
        Storage.get("pong").stop();
    });
    section.appendChild(stopButton);

    const resetButton = document.createElement('button');
    resetButton.textContent = 'Reset';
    resetButton.addEventListener('click', () => {
        Storage.get("pong").reset();
    });
    section.appendChild(resetButton);

    const h2 = document.createElement('h2');
    h2.textContent = 'Section 1';
    section.appendChild(h2);

    const p = document.createElement('p');
    p.textContent = 'hola buenos dias';
    section.appendChild(p);

    return section;
}

function getContent() {
    const main = document.createElement('main');
    main.id = 'main';

    main.appendChild(getSection1());
    
    const h1 = document.createElement('h1');
    h1.textContent = 'Welcome to Online Pong';
    main.appendChild(h1);
    
    const button = document.createElement('button');
    button.textContent = 'Versus Mode';
    button.id = 'versusButton';
    button.addEventListener('click', () => {
        console.log('Versus Mode');
    });
    main.appendChild(button);
    
    const button2 = document.createElement('button');
    button2.textContent = 'Tournament Mode';
    button2.id = 'tournamentButton';
    button2.addEventListener('click', () => {
        console.log('Tournament Mode');
    });
    main.appendChild(button2);
    
    const button3 = document.createElement('button');
    button3.textContent = 'oscar mode';
    button3.id = 'singleButton';
    button3.addEventListener('click', () => {
        console.log('oscar mode');
    });
    main.appendChild(button3);

    const button4 = document.createElement('button');
    button4.textContent = 'Login';
    button4.id = 'loginButton';
    button4.addEventListener('click', () => {
        console.log('Login');
    });
    main.appendChild(button4);

    return main;
}

// Loads the page content and styles
function main() {
    deleteDynamicStyles();
    loadCSS([
        '/static/css/main/main.css',
        '/static/css/main/sidebar.css',
        '/static/css/main/mainView.css'
    ]);

    const app = document.getElementById('app');

    const page = document.createElement('div');
    page.className = 'page';
    app.appendChild(page);
    
    page.appendChild(getSidebar());

    const content = document.createElement('div');
    content.className = 'content';
    page.appendChild(content);
    
    content.appendChild(getContent());

    const footer = document.createElement('footer');
    footer.textContent = 'Footer';
    content.appendChild(footer);

}

main();