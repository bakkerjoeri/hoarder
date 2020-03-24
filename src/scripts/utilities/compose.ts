import { UnaryFunction } from './UnaryFunction.js';

export function compose<ValueType>(...functions: UnaryFunction<ValueType>[]): UnaryFunction<ValueType> {
	return functions.reduce((composedFunction, currentFunction) => {
		return (value: ValueType): ValueType => {
			return composedFunction(currentFunction(value));
		}
	}, (value) => value);
}
