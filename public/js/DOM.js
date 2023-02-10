const messageContainer = document.getElementById("msg-container");

function appendMessage(message, alignment=0) {
    //0-> System Notifications; 1-> Sender; 2-> User
    const alignmentOptions = ['center', 'flex-start', 'flex-end'];
    const borderRadiusOptions = ['1.5em', '0 1.5em 1.5em 0', '1.5em 0 0 1.5em'];
	const messageElement = document.createElement('div');
    messageElement.classList.add('messageElement');
	messageElement.style.alignSelf = alignmentOptions[alignment];
	messageElement.style.borderRadius = borderRadiusOptions[alignment];
	messageElement.innerText = message;
	messageContainer.append(messageElement);
}