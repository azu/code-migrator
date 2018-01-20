"use strict";
import { MigrationList, MigrationScript, MigrationVersion } from "./MigrationList";
import semver = require("semver");
import uniq = require("lodash.uniq");
import flatten = require("lodash.flatten");
import uniqby = require("lodash.uniqby");
import readPkg = require("read-pkg");

const isGitClean = require("is-git-clean");

/**
 * Get `packageName` version from package.json's dependencies or devDependencies
 * @param {string} packageName
 * @param pkg
 * @returns {string | undefined}
 */
export const getPackageVersion = (packageName: string, pkg: any = readPkg.sync()): string | undefined => {
    if (!pkg) {
        return undefined;
    }
    const dependencies = pkg["dependencies"];
    const devDependencies = pkg["devDependencies"];
    if (dependencies && dependencies[packageName]) {
        return dependencies[packageName];
    }
    if (devDependencies && devDependencies[packageName]) {
        return devDependencies[packageName];
    }
    return undefined;
};

export const sortByVersion = function sortByVersion(versions: MigrationVersion[]) {
    const copiedVersion = versions.slice();
    copiedVersion.sort(predicateVersion);
    return copiedVersion;
};

export const predicateVersion = function sortByVersion(a: MigrationVersion, b: MigrationVersion) {
    if (a.version === b.version) {
        return 0;
    }

    return semver.lt(String(a.version), String(b.version)) ? -1 : 1;
};

export const findScript = (scripts: MigrationScript[], scriptName: MigrationScript["name"]) => {
    return scripts.find(script => script.name === scriptName);
};

// create for inquirer
export const createPromptVersionParameters = function getVersions(versions: MigrationVersion[]) {
    const versionsFromCodemods = versions.sort(exports.sortByVersion).map(version => {
        return {
            name: version.version,
            value: version.version
        };
    });
    const uniqueVersions = uniq(versionsFromCodemods);
    const firstVersion = {
        name: `older than ${uniqueVersions.sort(exports.sortByVersion)[0]}`,
        value: "0.0.0"
    };
    const lastVersion = {
        name: "latest",
        value: "9999.9999.9999"
    };

    return [firstVersion].concat(versionsFromCodemods).concat(lastVersion);
};

export interface SelectScriptArgs {
    migrationList: MigrationList;
    currentVersion: string;
    nextVersion: string;
}

export const selectScripts = function selectScripts({ migrationList, currentVersion, nextVersion }: SelectScriptArgs) {
    const semverToRespect = `>${currentVersion} <=${nextVersion}`;

    const scriptNames = migrationList.versions
        .filter(codemod => semver.satisfies(codemod.version, semverToRespect))
        .map(codemod => codemod.scripts);

    const versions = flatten(scriptNames).map(scriptName => {
        const script = findScript(migrationList.scripts, scriptName);
        if (!script) {
            throw new Error(`Not found script: ${scriptName}. You should define the "script" to "scripts".`);
        }
        return script;
    });
    return uniqby(versions, "name");
};

export const checkGitStatus = function checkGitStatus(force?: boolean): { errorMessage?: string; ok: boolean } {
    let clean = false;
    let errorMessage = "Unable to determine if git directory is clean";
    try {
        clean = isGitClean.sync(process.cwd(), { files: ["!package.json"] });
        errorMessage = "Git directory is not clean";
    } catch (err) {}

    const ENSURE_BACKUP_MESSAGE =
        "Ensure you have a backup of your tests or commit the latest changes before continuing.";

    if (!clean) {
        if (force) {
            return {
                errorMessage: [`WARNING: ${errorMessage}. Forcibly continuing.`, ENSURE_BACKUP_MESSAGE].join("\n"),
                ok: true
            };
        } else {
            return {
                errorMessage: [
                    `ERROR: ${errorMessage}. Refusing to continue.`,
                    ENSURE_BACKUP_MESSAGE,
                    "You may use the --force flag to override this safety check."
                ].join("\n"),
                ok: false
            };
        }
    }

    return {
        errorMessage: undefined,
        ok: true
    };
};
