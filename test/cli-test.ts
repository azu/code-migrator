import { CodeMigrator } from "../src/CodeMigrator";
import { MigrationList } from "../src";
import * as path from "path";

describe("cli", () => {
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
        return codeMigrator.runWithScript(migrationList.scripts, [
            path.join(__dirname, "/fixtures/scripts/src/**/*.js")
        ]);
    });
});
