    module.exports = [
    {
        languageOptions: {
        ecmaVersion: "latest",
        },
        linterOptions: {
        reportUnusedDisableDirectives: true,
        },
        plugins: {},
        rules: {
        "no-unused-vars": [
            "warn",
            { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
        ],
        "no-console": "off",
        },
    },
    ];
