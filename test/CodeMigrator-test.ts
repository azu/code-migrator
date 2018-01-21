import { MigrationList, CodeMigrator } from "../src";
import * as path from "path";
import * as assert from "assert";

describe("CodeMigrator", () => {
    describe("#run", () => {
        it("should run scripts between versions without interactive mode", () => {
            const migrationList: MigrationList = require("./fixtures/scripts/migrations.js");
            let isCalledBinCreator = false;
            const codeMigrator = new CodeMigrator({
                migrationList: migrationList,
                moduleName: "test",
                binCreator: () => {
                    isCalledBinCreator = true;
                    return {
                        binPath: require.resolve(".bin/jscodeshift"),
                        binArgs: ["--dry"]
                    };
                }
            });
            return codeMigrator
                .run({
                    defaultValue: {
                        currentVersion: "0.1.0",
                        nextVersion: "3.0.0",
                        files: [path.join(__dirname, "fixtures/scripts/src/**/*.js")]
                    }
                })
                .then(() => {
                    assert.ok(isCalledBinCreator);
                });
        });
        it("should not run any scripts when no match the versions", () => {
            const migrationList: MigrationList = require("./fixtures/scripts/migrations.js");
            let isCalledBinCreator = false;
            const codeMigrator = new CodeMigrator({
                migrationList: migrationList,
                moduleName: "test",
                binCreator: () => {
                    isCalledBinCreator = true;
                    return {
                        binPath: require.resolve(".bin/jscodeshift"),
                        binArgs: ["--dry"]
                    };
                }
            });
            return codeMigrator
                .run({
                    defaultValue: {
                        // no match range
                        currentVersion: "2.1.0",
                        nextVersion: "2.2.0",
                        files: [path.join(__dirname, "fixtures/scripts/src/**/*.js")]
                    }
                })
                .then(() => {
                    assert.ok(isCalledBinCreator === false, "should not called");
                });
        });
    });
    describe("#runScripts", () => {
        it("should work without error", () => {
            const migrationList: MigrationList = require("./fixtures/scripts/migrations.js");
            const codeMigrator = new CodeMigrator({
                migrationList: migrationList,
                moduleName: "test",
                binCreator: () => {
                    return {
                        binPath: require.resolve(".bin/jscodeshift"),
                        binArgs: ["--dry"]
                    };
                }
            });
            return codeMigrator.runScripts(migrationList.scripts, [
                path.join(__dirname, "/fixtures/scripts/src/**/*.js")
            ]);
        });
    });
});
