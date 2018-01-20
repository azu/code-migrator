#!/usr/bin/env node
"use strict";
const { CodeMigrator } = require("code-migration-framework");
const meow = require("meow");

const cli = meow(
    `
    Usage
      $ code-migration-example <input>

    Options:
      --dry-run Enable dry run mode

    Examples
      $ code-migration-example "src/**/*.js"
`,
    {
        flags: {
            dryRun: {
                type: "boolean"
            }
        }
    }
);

const migrator = new CodeMigrator({
    moduleName: "test-module",
    migrationList: require("../migrations"),
    binCreator: () => {
        const binArgs = cli.flags.dryRun ? ["--dry"] : [];
        return {
            binPath: require.resolve(".bin/jscodeshift"),
            binArgs
        };
    }
});
migrator
    .runInteractive({
        filePatterns: cli.input
    })
    .then(() => {
        console.log("Done");
    })
    .catch(error => {
        console.error(error);
    });
