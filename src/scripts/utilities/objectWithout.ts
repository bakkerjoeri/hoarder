export function objectWithout<
	ObjectType extends object,
	KeysToRemove extends [...(keyof ObjectType)[]]
>(
	object: ObjectType,
	...keysToRemove: KeysToRemove
): {
	[RemainingKey in Exclude<keyof ObjectType, KeysToRemove[number]>]: ObjectType[RemainingKey];
} {
	const entries = Object.entries(object) as [keyof ObjectType, any][];

	return entries.reduce((newObject, [currentKey, currentValue]) => {
		if (keysToRemove.includes(currentKey)) {
			return newObject;
		}

		return {
			...object,
			[currentKey]: currentValue,
		};
	}, {} as any);
}
