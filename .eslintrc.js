module.exports = {
    "parser": "@typescript-eslint/parser",
    "plugins": [
        "@typescript-eslint",
        "import",
    ],
    "env": {
        "browser": true,
        "es6": true,
    },
    "extends": [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
    ],
    "parserOptions": {
        "ecmaVersion": 2018,
        "sourceType": "module",
    },
    "rules": {
        "quotes": [
            "warn",
            "single",
        ],
        "no-var": "warn",
        "prefer-template": "warn",
        "eqeqeq": "error",
        "no-console": "off",
        'no-prototype-builtins': "off",
        "@typescript-eslint/no-use-before-define": ["error", { "functions": false, "classes": true }],
        "@typescript-eslint/no-explicit-any": "off",
		"@typescript-eslint/no-object-literal-type-assertion": "off",
		"@typescript-eslint/no-non-null-assertion": "off",
    }
}
