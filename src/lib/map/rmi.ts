export type EngagementBand = 'unengaged' | 'low' | 'medium' | 'high' | 'highest';

export function bandFor(rmi: number, engaged: boolean): EngagementBand {
	if (!engaged || rmi <= 0) return 'unengaged';
	if (rmi < 10) return 'low';
	if (rmi < 25) return 'medium';
	if (rmi < 50) return 'high';
	return 'highest';
}
