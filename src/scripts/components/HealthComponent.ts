export interface HealthComponnent {
	current: number;
	max: number;
}

export function createHealthComponent(max: number, current?: number): HealthComponnent {
	if (typeof current === 'undefined') {
		current = max;
	}

	return {
		max,
		current,
	};
}
