module.exports = {
    presets: [
        [
            '@babel/preset-env',
            {
                // modules: 'commonjs', // you dont want this module with later versions of babel
                corejs: '3.0.0',
                useBuiltIns: 'entry',
                targets: {
                    chrome: '58',
                    firefox: '54',
                    ie: '11',
                    safari: '10',
                    opera: '44',
                    edge: '16'
                }
            }
        ],
        [
            '@babel/preset-react'
        ]
    ],
    plugins: [
        '@babel/plugin-syntax-dynamic-import',
        '@babel/plugin-proposal-class-properties'
    ]
};
