/**
 * @param {number} retry - If the repo fails to load, we count how many times we've tried to load it,
 *                         so we can wait longer between each attempt. (Exponential backoff)
 */
async function startUp(retry = 0) {
	const main = document.querySelector('main');
	/** @type {(typeof import('../generated/repo.json'))} */
	let repo;
	try {
		repo = await (await fetch('./generated/repo.json')).json();
	} catch (e) {
		const backoff = Math.pow(2, retry);
		main.innerHTML = `<p>Failed read package list! Retrying in ${backoff} seconds...</p>`;
		setTimeout(() => startUp(retry + 1), backoff * 1000);
		throw e;
	}
	const template = document.querySelector('#content-pack-template > article');
	for (const pack of repo.packs) {
		const clone = template.cloneNode(true);

		const packNameEle = clone.querySelector('[data-pack-name]');
		if (packNameEle) {
			fillPackName(packNameEle, pack);
		}

		const packPreviewEle = clone.querySelector('[data-pack-preview]');
		if (packPreviewEle) {
			fillPackPreview(packPreviewEle, pack);
		}

		const authorsEle = clone.querySelector('[data-authors]');
		if (authorsEle) {
			fillAuthors(authorsEle, pack, repo.authors);
		}

		const url = new URL(`./packs/${pack.id}/repo.json`, location).toString();
		const input = clone.querySelector('[data-url]');
		if (input) {
			fillUrl(input, url);
		}

		const copyButtonEle = clone.querySelector('.pack-copy-button');
		if (copyButtonEle) {
			copyButtonEle.addEventListener('click', async () => {
				navigator.clipboard.writeText(url);
			});
		}

		const searchEle = clone.querySelector('[data-search]');
		if (searchEle) {
			fillSearchEle(searchEle, pack);
		}

		main.append(clone);
	}

	document.getElementById('search').addEventListener('input', search);
}

/**
 * @param {HTMLElement} packNameEle
 * @param {(typeof import('../generated/repo.json'))['packs'][number]} pack
 */
function fillPackName(packNameEle, pack) {
	packNameEle.textContent = pack.name;
}

/**
 * @param {HTMLElement} packPreviewEle
 * @param {(typeof import('../generated/repo.json'))['packs'][number]} pack
 */
function fillPackPreview(packPreviewEle, pack) {
	packPreviewEle.style.backgroundImage = pack.preview
		.map((url) => {
			return `url(${url})`;
		})
		.join(', ');
}

/**
 * @param {HTMLElement} authorsEle
 * @param {(typeof import('../generated/repo.json'))['packs'][number]} pack
 * @param {(typeof import('../generated/repo.json'))['authors']} authors
 */
function fillAuthors(authorsEle, pack, authors) {
	for (const author of pack.authors) {
		const li = document.createElement('li');
		li.innerText = author;
		authorsEle.append(li);
	}
}

/**
 * @param {HTMLInputElement} input
 * @param {(typeof import('../generated/repo.json'))['packs'][number]} pack
 */
function fillUrl(input, url) {
	input.value = url;
}

/**
 * @param {HTMLElement} searchEle
 * @param {(typeof import('../generated/repo.json'))['packs'][number]} pack
 */
function fillSearchEle(searchEle, pack) {
	searchEle.textContent =
		(pack.searchWords?.join(' ') ?? '') +
		' ' +
		(pack.characters?.join(' ') ?? '');
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
