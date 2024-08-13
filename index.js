/**
 * Has Pnpm.
 *
 * Check if pnpm is used instead of npm
 *
 * @author Awais <https://twitter.com/MrAhmadAwais/>
 */
import {execa} from 'execa';
import fs from 'fs/promises';
import path from 'path';

const cache = new Map();

// Returns true if a file exists.
const exists = path =>
	fs.stat(path).then(
		() => true,
		() => false
	);

function hasGlobalInstallation(pm) {
	const key = `has_global_${pm}`;
	if (cache.has(key)) {
		return Promise.resolve(cache.get(key));
	}

	return execa(pm, ['--version'])
		.then(res => {
			return /^\d+.\d+.\d+$/.test(res.stdout);
		})
		.then(value => {
			cache.set(key, value);
			return value;
		})
		.catch(() => false);
}

async function checkOtherManagers(cwd) {
	const managers = ['yarn', 'npm', 'bun'];
	const results = await Promise.all(
		managers.map(async manager => {
			const lockFile =
				manager === 'npm'
					? 'package-lock.json'
					: `${manager}.lock${manager === 'bun' ? 'b' : ''}`;
			const hasLock = await exists(path.join(cwd, lockFile));
			const hasGlobal = await hasGlobalInstallation(manager);
			return {
				name: manager,
				hasLock,
				hasGlobal
			};
		})
	);

	return results.filter(m => m.hasLock || m.hasGlobal);
}

async function hasPnpm(cwd = process.cwd()) {
	// Check for pnpm lock file
	const pnpmLockExists = await exists(path.join(cwd, 'pnpm-lock.yaml'));
	if (pnpmLockExists) {
		return {hasPnpm: true, reason: 'local lock file'};
	}

	// Check for global pnpm installation
	const hasPnpmGlobal = await hasGlobalInstallation('pnpm');
	if (hasPnpmGlobal) {
		return {hasPnpm: true, reason: 'global installation'};
	}

	// If pnpm is not found, check other managers
	const otherManagers = await checkOtherManagers(cwd);

	return {
		hasPnpm: false,
		otherManagers: otherManagers.map(m => ({
			name: m.name,
			detected: m.hasLock ? 'local lock file' : 'global installation'
		}))
	};
}

export default hasPnpm;

// Example usage
(async () => {
	try {
		const result = await hasPnpm();
		console.log(result);
	} catch (error) {
		console.error('Error:', error);
	}
})();
