import { MigrationList } from "./MigrationList";
import * as assert from "assert";
import * as path from "path";

export const checkMigrationList = (migrationList: MigrationList) => {
    const versions = migrationList.versions;
    const scripts = migrationList.scripts;
    assert.ok(Array.isArray(versions), ".versions should be array");
    assert.ok(Array.isArray(scripts), ".scripts should be array");

    versions.forEach(version => {
        assert.ok(version.version.length > 0, ".versions[].version should not be empty");
        version.scripts.forEach(scriptName => {
            const isDefinedScriptName = scripts.some(definedScript => {
                return scriptName === definedScript.name;
            });
            assert(isDefinedScriptName, `.versions[].scripts[].name(${scriptName}) should be defined in "scripts"`);
        });
    });

    scripts.forEach(script => {
        assert.ok(script.name.length > 0, `.scripts[].name(${script.name}) should not be empty`);
        assert.ok(path.isAbsolute(script.filePath), `.scripts[].filePath(${script.filePath}) should be absolute path`);
    });
};
