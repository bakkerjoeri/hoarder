import { UnaryFunction } from './UnaryFunction.js';

export function pipe<ValueType>(...functions: UnaryFunction<ValueType>[]): UnaryFunction<ValueType> {
	return functions.reduce((pipedFunction, currentFunction) => {
		return (value: ValueType): ValueType => {
			return currentFunction(pipedFunction(value));
		}
	}, (value) => value);
}
