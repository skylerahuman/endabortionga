// Run after granting the existing PAT repository Administration: write.
// Uses the token for authentication only; never prints it.
import { readFile } from 'node:fs/promises';

const repository = 'skylerahuman/endabortionga';
const token = (await readFile('/home/sky/.gh-pat', 'utf8')).trim();
async function api(path, method = 'GET', body) {
	const response = await fetch(`https://api.github.com/repos/${repository}${path}`, {
		method,
		headers: {
			Authorization: `Bearer ${token}`,
			Accept: 'application/vnd.github+json',
			'Content-Type': 'application/json'
		},
		body: body ? JSON.stringify(body) : undefined
	});
	const data = response.status === 204 ? {} : await response.json();
	if (!response.ok) throw new Error(`${method} ${path}: HTTP ${response.status}: ${data.message}`);
	return data;
}

const collaborators = await api('/collaborators?per_page=100');
if (collaborators.some((user) => user.permissions?.admin && user.login !== 'skylerahuman')) {
	throw new Error('Another repository administrator exists; owner-only merge policy needs review.');
}
// Separate policies: the admin bypass for update restrictions must NOT bypass PR/check requirements.
await api('/branches/prd/protection', 'PUT', {
	required_status_checks: { strict: true, contexts: ['build'] },
	enforce_admins: true,
	required_pull_request_reviews: {
		dismiss_stale_reviews: true,
		require_code_owner_reviews: false,
		required_approving_review_count: 0
	},
	restrictions: null,
	allow_force_pushes: false,
	allow_deletions: false,
	required_conversation_resolution: true
});
const name = 'Only owner may update production';
const rulesets = await api('/rulesets');
const existing = rulesets.find((rule) => rule.name === name);
const policy = {
	name,
	target: 'branch',
	enforcement: 'active',
	conditions: { ref_name: { include: ['refs/heads/prd'], exclude: [] } },
	// RepositoryRole 5 = administrator. This personal repository has one admin: its owner.
	bypass_actors: [{ actor_id: 5, actor_type: 'RepositoryRole', bypass_mode: 'always' }],
	rules: [{ type: 'update' }, { type: 'deletion' }, { type: 'non_fast_forward' }]
};
await api(`/rulesets${existing ? '/' + existing.id : ''}`, existing ? 'PUT' : 'POST', policy);
await api('', 'PATCH', {
	default_branch: 'prd',
	allow_auto_merge: false,
	delete_branch_on_merge: false
});
const protection = await api('/branches/prd/protection');
if (!protection.enforce_admins.enabled || !protection.required_pull_request_reviews ||
	!protection.required_status_checks.contexts.includes('build')) {
	throw new Error('Protection verification failed');
}
console.log('Production protections configured. Only the owner is currently an administrator.');
console.log('Do not grant other users admin access: administrators bypass the update restriction, not PR checks.');
console.log('Enable production promotion on the VM:');
console.log('  sudo touch /var/lib/eag-deploy-secrets/production-enabled');
console.log('  sudo systemctl start eag-deploy.service');
