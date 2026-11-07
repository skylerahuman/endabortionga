export function displayFlags(values: Record<string, string | undefined>) {
	const production = ['prd', 'production'].includes(values.PUBLIC_SITE_ENV ?? 'production');
	return {
		mapDebug: !production && values.PUBLIC_SHOW_MAP_DEBUG === 'true',
		previewLabels: !production && values.PUBLIC_SHOW_PREVIEW_LABELS === 'true'
	};
}
