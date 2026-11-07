import { getDatabase } from './db';

export type CommunicationCategory =
	| 'giving_needs'
	| 'prayer_needs'
	| 'legislative_action'
	| 'events';

export interface CommunicationAudience {
	user_id: string;
	email: string;
	region_id: string;
	district_id: number;
}

/**
 * Returns only users who explicitly opted into one category. The server never infers consent
 * from registration, donation, or district association.
 */
export function communicationAudience(category: CommunicationCategory): CommunicationAudience[] {
	return getDatabase()
		.prepare(
			`SELECT u.id AS user_id, u.email, d.region_id, d.district_id
			 FROM users u
			 JOIN communication_preferences p ON p.user_id = u.id
			 JOIN district_assignments d ON d.user_id = u.id AND d.is_current = 1
			 LEFT JOIN communication_suppressions s ON s.email = u.email
			 WHERE p.${category} = 1 AND s.email IS NULL AND u.email_verified_at IS NOT NULL
			 ORDER BY d.region_id, u.email`
		)
		.all() as unknown as CommunicationAudience[];
}
