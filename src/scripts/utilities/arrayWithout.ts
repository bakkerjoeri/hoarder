export function arrayWithout(array: any[], ...valuesToExclude: any[]): any[] {
    return array.filter((value): boolean => {
        return !valuesToExclude.includes(value);
    });
}
