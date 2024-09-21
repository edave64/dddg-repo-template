async function startUp(retry = 0) {
	const main = document.querySelector('main');
	let repo;
	try {
		repo = await (await fetch('./generated/repo.json')).json();
	} catch (e) {
		const backoff = Math.pow(2, retry);
		main.innerHTML = `<p>Failed read package list! Retrying in ${backoff} seconds...</p>`;
		setTimeout(() => startUp(retry + 1), backoff * 1000);
		throw e;
	}
	console.log(repo);
	const template = document.querySelector('#content-pack-template > article');
	console.log(template);
	for (const pack of repo.packs) {
		const clone = template.cloneNode(true);

		const packName = clone.querySelector('[data-pack-name]');
		if (packName) {
			packName.textContent = pack.name;
		}

		const packPreview = clone.querySelector('[data-pack-preview]');
		if (packPreview) {
			packPreview.style.backgroundImage = pack.preview
				.map((url) => {
					return `url(${url})`;
				})
				.join(', ');
		}

		const authors = clone.querySelector('[data-authors]');
		if (authors) {
			for (const author of pack.authors) {
				const li = document.createElement('li');
				li.innerText = author;
				authors.append(li);
			}
		}

		const url = new URL(`./packs/${pack.id}/repo.json`, location).toString();
		const input = clone.querySelector('[data-url]');
		if (input) {
			input.value = url;
		}

		const copyButton = clone.querySelector('.pack-copy-button');
		if (copyButton) {
			copyButton.addEventListener('click', async () => {
				navigator.clipboard.writeText(url);
			});
		}

		const search = clone.querySelector('[data-search]');
		if (search) {
			search.textContent =
				(pack.searchWords?.join(' ') ?? '') +
				' ' +
				(pack.characters?.join(' ') ?? '');
		}

		main.append(clone);
	}

	document.getElementById('search').addEventListener('input', search);
}

function search() {
	const value = document.getElementById('search').value.toLowerCase();
	for (const element of document.querySelectorAll('article')) {
		element.classList.toggle(
			'hidden',

			!element.textContent.toLowerCase().includes(value)
		);
	}
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', startUp);
} else {
	startUp();
}
