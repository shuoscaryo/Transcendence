import Path from '/static/js/utils/Path.js';

export default async function getView(isLogged, path) {
    const css = [
        Path.css("main/chat.css"),  // Optional: Add a CSS file for styling
    ];

    const component = document.createElement('div');
    component.innerHTML = `
        <h2>Chat Room</h2>
        <div id="chat-box" style="border: 1px solid #ccc; padding: 10px; height: 300px; overflow-y: auto;"></div>
        <input type="text" id="message-input" placeholder="Type a message..." style="width: 80%;">
        <button id="send-button">Send</button>
    `;

    const protocol = window.location.protocol === "https:" ? "wss://" : "ws://";
	const socket = new WebSocket(protocol + window.location.host + "/ws/chat/");

    socket.onopen = function() {
        console.log("✅ Connected to WebSocket");
    };

    socket.onmessage = function(event) {
        const data = JSON.parse(event.data);
        console.log("📩 Message received:", data.message);

        const chatBox = component.querySelector("#chat-box");
        const messageElement = document.createElement("p");
        messageElement.textContent = data.message;
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight; // Auto-scroll to the latest message
    };

    socket.onclose = function() {
        console.log("⚠️ WebSocket closed");
    };

    function sendMessage() {
        const messageInput = component.querySelector("#message-input");
        const message = messageInput.value.trim();

        if (message !== "") {
            console.log("📤 Sending message:", message);
            socket.send(JSON.stringify({ "message": message }));
            messageInput.value = "";
        }
    }

    // Attach event listener to button
    component.querySelector("#send-button").addEventListener("click", sendMessage);

    // Handle "Enter" key to send messages
    component.querySelector("#message-input").addEventListener("keypress", function(event) {
        if (event.key === "Enter") {
            sendMessage();
        }
    });

    const onDestroy = () => {
        socket.close(); // Ensure the WebSocket connection is closed when the component is removed
    };

    return { status: 200, component, css, onDestroy };
}
