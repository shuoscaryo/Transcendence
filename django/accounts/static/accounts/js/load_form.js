"use strict";

export function getLoginForm()
{
	return fetch('/accounts/login/formulario')
		.then(response => response.text())
		.then(html => {
			const tempContainer = document.createElement('div');
			tempContainer.innerHTML = html;
			document.body.appendChild(tempContainer);
		});
}

export function getRegisterForm()
{
	return fetch('/accounts/register/formulario')
		.then(response => response.text())
		.then(html => {
			const tempContainer = document.createElement('div');
			tempContainer.innerHTML = html;
			document.body.appendChild(tempContainer);
		});
}

export function sendForm(form)
{
	const formData = new FormData(form);
	const url = form.action;
	const method = form.method;
	
	return fetch(url, {
		method: method,
		body: formData
		})
		.then(response => response.text())
		.then(html => {
			const tempContainer = document.createElement('div');
			tempContainer.innerHTML = html;
			document.body.appendChild(tempContainer);
		});
}