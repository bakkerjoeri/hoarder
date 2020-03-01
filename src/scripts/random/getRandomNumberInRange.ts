export function getRandomNumberInRange(
    lowerBound: number,
    upperBound: number
): number {
	return Math.floor(Math.random() * (upperBound + 1 + lowerBound))
}
