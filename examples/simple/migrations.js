// MIT © 2018 azu
"use strict";
module.exports = {
    scripts: [
        {
            name: "use-strict",
            filePath: require.resolve("./scripts/use-strict")
        }
    ],
    versions: [
        {
            version: "1.0.0",
            scripts: []
        },
        {
            version: "2.0.0",
            scripts: ["use-strict"]
        },
        {
            version: "3.0.0",
            scripts: []
        }
    ]
};
