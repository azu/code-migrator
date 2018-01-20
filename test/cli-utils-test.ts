"use strict";
import { getPackageVersion, selectScripts, sortByVersion } from "../src/cli-utils";
import * as assert from "assert";
import { MigrationList } from "../src/MigrationList";

describe("cli-util", () => {
    describe("getPackageVersion", () => {
        it("should get version from devDependencies", () => {
            const version = getPackageVersion("debug", {
                name: "code-migration-framework",
                version: "1.0.0",
                dependencies: {
                    debug: "^3.1.0",
                    "lodash.uniq": "^4.5.0"
                }
            });
            assert.strictEqual(version, "^3.1.0");
        });
        it("should get version from dependencies", () => {
            const version = getPackageVersion("lodash", {
                name: "code-migration-framework",
                version: "1.0.0",
                dependencies: {},
                devDependencies: {
                    lodash: "^4.5.0"
                }
            });
            assert.strictEqual(version, "^4.5.0");
        });
        it("should return undefined if it is not found", () => {
            const version = getPackageVersion("not_found", {
                name: "code-migration-framework",
                version: "1.0.0",
                dependencies: {},
                devDependencies: {
                    lodash: "^4.5.0"
                }
            });
            assert.strictEqual(version, undefined);
        });
    });
    describe("sortByVersion", () => {
        const sortedVersions = sortByVersion([
            {
                version: "2.0.0",
                scripts: []
            },
            {
                version: "1.0.0",
                scripts: []
            },
            {
                version: "1.2.0",
                scripts: []
            }
        ]);
        assert.deepStrictEqual(sortedVersions, [
            {
                version: "1.0.0",
                scripts: []
            },
            {
                version: "1.2.0",
                scripts: []
            },
            {
                version: "2.0.0",
                scripts: []
            }
        ]);
    });
    describe("selectScripts", () => {
        const scriptA = {
            name: "a",
            filePath: "/path/to/a.js"
        };
        const scriptB = {
            name: "b",
            filePath: "/path/to/b.js"
        };
        const scriptC = {
            name: "c",
            filePath: "/path/to/c.js"
        };
        const migrationList: MigrationList = {
            scripts: [scriptA, scriptB, scriptC],
            versions: [
                {
                    version: "1.0.0",
                    scripts: ["a"]
                },
                {
                    version: "2.0.0",
                    scripts: []
                },
                {
                    version: "3.0.0",
                    scripts: ["b"]
                },
                {
                    version: "3.1.0",
                    scripts: ["b", "c"]
                }
            ]
        };
        it("0.1.0 => 0.2.0", () => {
            const scripts_0_1_0_to_0_2_0 = selectScripts({
                migrationList,
                currentVersion: "0.1.0",
                nextVersion: "0.2.0"
            });
            assert.deepStrictEqual(scripts_0_1_0_to_0_2_0, []);
        });
        it("0.1.0 => 1.0.0", () => {
            const scripts_0_1_0_to_1_0_0 = selectScripts({
                migrationList,
                currentVersion: "0.1.0",
                nextVersion: "1.0.0"
            });
            assert.deepStrictEqual(scripts_0_1_0_to_1_0_0, [scriptA]);
        });
        it("1.0.0 => 2.0.0", () => {
            const scripts_1_0_0_to_2_0_0 = selectScripts({
                migrationList,
                currentVersion: "1.0.0",
                nextVersion: "2.0.0"
            });
            assert.deepStrictEqual(scripts_1_0_0_to_2_0_0, []);
        });
        it("2.0.0 => 3.1.0", () => {
            // unique
            const scripts_2_0_0_to_3_1_0 = selectScripts({
                migrationList,
                currentVersion: "2.0.0",
                nextVersion: "3.1.0"
            });
            assert.deepStrictEqual(scripts_2_0_0_to_3_1_0, [scriptB, scriptC]);
        });
    });
});
