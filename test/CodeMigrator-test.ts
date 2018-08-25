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
                binCreator: ({ script, filePathList }) => {
                    isCalledBinCreator = true;
                    return {
                        binPath: require.resolve(".bin/jscodeshift"),
                        binArgs: ["--dry", "-t", script.filePath].concat(filePathList)
                    };
                }
            });
            return codeMigrator
                .run({
                    force: true,
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
                binCreator: ({ script, filePathList }) => {
                    isCalledBinCreator = true;
                    return {
                        binPath: require.resolve(".bin/jscodeshift"),
                        binArgs: ["--dry", "-t", script.filePath].concat(filePathList)
                    };
                }
            });
            return codeMigrator
                .run({
                    force: true,
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
            let isCalled = false;
            const migrationList: MigrationList = require("./fixtures/scripts/migrations.js");
            const codeMigrator = new CodeMigrator({
                migrationList: migrationList,
                moduleName: "test",
                binCreator: ({ script, filePathList }) => {
                    isCalled = true;
                    return {
                        binPath: require.resolve(".bin/jscodeshift"),
                        binArgs: ["--dry", "-t", script.filePath].concat(filePathList)
                    };
                }
            });
            return codeMigrator
                .runScripts({
                    force: true,
                    scripts: migrationList.scripts,
                    files: [path.join(__dirname, "/fixtures/scripts/src/**/*.js")]
                })
                .then(() => {
                    assert.ok(isCalled);
                });
        });
        it("should accept plain script name", () => {
            let isCalled = false;
            const migrationList: MigrationList = require("./fixtures/scripts/migrations.js");
            const codeMigrator = new CodeMigrator({
                migrationList: migrationList,
                moduleName: "test",
                binCreator: ({ script, filePathList }) => {
                    isCalled = true;
                    return {
                        binPath: require.resolve(".bin/jscodeshift"),
                        binArgs: ["--dry", "-t", script.filePath].concat(filePathList)
                    };
                }
            });
            return codeMigrator
                .runScripts({
                    force: true,
                    scripts: ["use-strict"],
                    files: [path.join(__dirname, "/fixtures/scripts/src/**/*.js")]
                })
                .then(() => {
                    assert.ok(isCalled);
                });
        });
    });
});
