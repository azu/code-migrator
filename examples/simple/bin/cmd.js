#!/usr/bin/env node
"use strict";
const { CodeMigrator } = require("code-migration-framework");
const meow = require("meow");

const cli = meow(`
	Usage
	  $ code-migration-example <input>

	Examples
	  $ code-migration-example "src/**/*.js"
`);

const migrator = new CodeMigrator({
    moduleName: "almin",
    migrationList: require("../migrations"),
    binCreator: () => {
        return {
            binPath: require.resolve(".bin/jscodeshift")
        };
    }
});
migrator
    .runInteractive({
        filePatterns: cli.input[0]
    })
    .then(() => {
        console.log("Done");
    })
    .catch(error => {
        console.error(error);
    });
