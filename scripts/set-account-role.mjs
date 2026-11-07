import Database from 'better-sqlite3';

// Operator-only local bootstrap. Never expose this operation as an unauthenticated web endpoint.
const [userId, role] = process.argv.slice(2);
if (!process.env.DATABASE_PATH || !/^[a-f0-9-]{36}$/i.test(userId ?? '') ||
	!['member', 'campaign_editor', 'finance', 'admin'].includes(role)) {
	throw new Error('Usage: DATABASE_PATH=/private/persistent.sqlite node scripts/set-account-role.mjs USER_UUID ROLE');
}
const db = new Database(process.env.DATABASE_PATH, { fileMustExist: true });
try {
	db.transaction(() => {
		if (!db.prepare('SELECT id FROM users WHERE id = ?').get(userId)) throw new Error('Unknown account');
		db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, userId);
		db.prepare('INSERT INTO audit_events (action, entity_type, entity_id, details_json) VALUES (?, ?, ?, ?)')
			.run('account.role_bootstrapped', 'user', userId, JSON.stringify({ role, source: 'local-operator' }));
	})();
	console.log('Role updated and audited.');
} finally { db.close(); }
