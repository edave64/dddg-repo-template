/**
 * Generates the repo.json file.
 * This file is expected to run in the root of the repo. Use the `npm run update`.
 */

import fs from 'fs';
import path from 'path';

const alreadyWarned = new Set();
const packFolderEntries = await fs.promises.readdir('./packs');
const allPacksContent = (
	await Promise.allSettled(
		packFolderEntries.map(async (packFolderEntry) => {
			const file = `./packs/${packFolderEntry}/repo.json`;
			return {
				data: await fs.promises.readFile(file, 'utf8'),
				basedOnFile: file,
			};
		})
	)
)
	.filter((pack) => pack.status === 'fulfilled')
	.map((pack) => {
		try {
			console.log(`Reading ${pack.value.basedOnFile}`);
			const ret = JSON.parse(pack.value.data);
			ret.basedOnFile = pack.value.basedOnFile;
			return ret;
		} catch (e) {
			console.error(`Failed to parse ${pack.basedOnFile}`);
			throw e;
		}
	});

// Collect all authors
const authors = {};
const authorSource = {};

for (const pack of allPacksContent) {
	for (const author in pack.authors) {
		if (!authors[author]) {
			authors[author] = pack.authors[author];
			authorSource[author] = pack.basedOnFile;
		} else if (!objectEquals(authors[author], pack.authors[author])) {
			console.warn(
				`Author ${author} has different definitions in different packs.`
			);
			console.warn(`Author in ${authorSource[author]}:`);
			console.warn(JSON.stringify(authors[author], null, 2));
			console.warn(`Author in ${pack.basedOnFile}:`);
			console.warn(JSON.stringify(pack.authors[author], null, 2));
		}
	}
}

const packs = [];
const knownPacks = new Map();

for (const pack of allPacksContent) {
	if (knownPacks.has(pack.pack.id)) {
		console.warn(
			`Pack ${pack.pack.id} exists multiple times (Originally found in ${knownPacks.get(pack.pack.id)}, now found in ${pack.basedOnFile})`
		);
		continue;
	}
	knownPacks.set(pack.pack.id, pack.basedOnFile);
	normalizeUrls(pack.pack, pack.basedOnFile);
	packs.push(pack.pack);
}

fs.writeFileSync(
	'./generated/repo.json',
	JSON.stringify({ authors, packs }, null, '\t')
);

function normalizeUrls(pack, basedOnFile) {
	const baseUrl = path.dirname(basedOnFile);
	for (let i = 0; i < pack.preview.length; i++) {
		pack.preview[i] = normalizeUrl(pack.preview[i], baseUrl);
	}
	if (pack.dddgPath) {
		pack.dddgPath = normalizeUrl(pack.dddgPath, baseUrl);
	}
	if (pack.dddg2Path) {
		pack.dddg2Path = normalizeUrl(pack.dddg2Path, baseUrl);
	}
}

function normalizeUrl(nonNormalUrl, base) {
	if (
		nonNormalUrl.startsWith('http://localhost') ||
		nonNormalUrl.startsWith('https://localhost')
	) {
		if (!alreadyWarned.has(base)) {
			console.warn(
				`The pack in ${base} contains a localhost path '${nonNormalUrl}'. These only work in your` +
					' local version and will not work for anyone else, since "localhost" refers to' +
					' your own computer.'
			);
			alreadyWarned.add(base);
		}
		if (nonNormalUrl.startsWith('http://localhost:4716/repo/')) {
			console.warn(
				`Consider replacing '${nonNormalUrl}' with just '${nonNormalUrl.replace(/^http:\/\/localhost:4716\/repo\/[^\/]+/, '.')}'`
			);
		}
		return nonNormalUrl;
	}
	return '../' + path.join(base, nonNormalUrl);
}

function objectEquals(a, b) {
	// Check if the two objects are strictly equal, and if their properties are equal.
	if (Object.keys(a).length !== Object.keys(b).length) {
		return false;
	}
	for (const key in a) {
		if (a[key] !== b[key]) {
			return false;
		}
	}
	return true;
}
