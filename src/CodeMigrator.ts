import {
    checkGitStatus,
    getPackageVersion,
    createPromptVersionParameters,
    selectScripts,
    sortByVersion,
    getScriptByName
} from "./cli-utils";
import { MigrationList, MigrationScript } from "./MigrationList";
import * as inquirer from "inquirer";
import { Question } from "inquirer";
import { BinCreator, executeWithBin } from "./run-scripts";
import globby = require("globby");
import { checkMigrationList } from "./check-migration-list";

const debug = require("debug")("code-shifter");

export interface CodeMigratorArgs {
    moduleName: string;
    binCreator: BinCreator;
    migrationList: MigrationList;
}

export interface CodeMigratorRunOption {
    // if `force` is `true`, ignore git clean status
    force?: boolean;
    // prompt placeholder value
    placeHolder?: {
        currentVersion?: string;
        nextVersion?: string;
        files?: string;
    };
    // prompt default value
    // Note: if all `defaultValue` is set, run without interactive mode.
    // You can use it for unit testing.
    defaultValue?: {
        currentVersion?: string;
        nextVersion?: string;
        // glob patterns
        files?: string[];
    };
    // prompt messages
    message?: {
        currentVersion?: string;
        nextVersion?: string;
        files?: string;
    };
}

export interface RunScriptsOptions {
    // if `force` is `true`, ignore git clean status
    force?: boolean;
    // script object or script name list
    scripts: Array<MigrationScript | string>;
    // glob patterns
    files: string[];
}

export class CodeMigrator {
    private moduleName: string;
    private migrationList: MigrationList;
    private binCreator: BinCreator;

    constructor(args: CodeMigratorArgs) {
        this.moduleName = args.moduleName;
        this.binCreator = args.binCreator;
        this.migrationList = args.migrationList;
        checkMigrationList(this.migrationList);
    }

    /**
     * Run with interactive mode
     */
    run(options: CodeMigratorRunOption) {
        const { ok, errorMessage } = checkGitStatus(options.force);
        if (ok && errorMessage) {
            console.warn(errorMessage);
            // continue
        } else if (!ok) {
            return Promise.reject(new Error(errorMessage));
        }
        const sortedVersions = sortByVersion(this.migrationList.versions);
        const versions = createPromptVersionParameters(sortedVersions);
        const moduleName = this.moduleName;
        const targetModuleVersion = getPackageVersion(moduleName);
        // options
        const message = options.message;
        const defaultValue = options.defaultValue;
        const placeHolder = options.placeHolder;
        const placeHolderFiles = (placeHolder && placeHolder.files) || "src/**/*.js";
        const questions: Question[] = [
            {
                type: "list",
                name: "currentVersion",
                default: (placeHolder && placeHolder.currentVersion) || targetModuleVersion,
                when: !(defaultValue && defaultValue.currentVersion),
                message:
                    (message && message.currentVersion) || `What version of ${moduleName} are you currently using?`,
                choices: versions.slice(0, -1)
            },
            {
                type: "list",
                name: "nextVersion",
                default: placeHolder && placeHolder.nextVersion,
                when: !(defaultValue && defaultValue.nextVersion),
                message: (message && message.nextVersion) || `What version of ${moduleName} are you moving to?`,
                choices: versions.slice(1)
            },
            {
                type: "input",
                name: "files",
                message: (message && message.files) || "On which files should the migration scripts be applied?",
                default: placeHolderFiles,
                when: !(defaultValue && defaultValue.files),
                filter: (files: string) => {
                    return files.trim();
                }
            }
        ];
        type Answers = {
            currentVersion: string;
            nextVersion: string;
            files: string;
            [index: string]: any;
        };
        return inquirer.prompt(questions).then((results: any) => {
            const answers = results as Answers;
            debug("Answers: %O", answers);
            const files = (defaultValue && defaultValue.files) || answers.files;
            const currentVersion = (defaultValue && defaultValue.currentVersion) || answers.currentVersion;
            const nextVersion = (defaultValue && defaultValue.nextVersion) || answers.currentVersion;
            debug("%s(currentVersion) → %s(nextVersion), files: %o", currentVersion, nextVersion, files);
            if (!files.length) {
                return Promise.reject(new Error("No input glob patterns."));
            }

            const scripts = selectScripts({
                migrationList: this.migrationList,
                currentVersion: currentVersion,
                nextVersion: nextVersion
            });

            const filePathList = globby.sync(files);
            if (filePathList.length === 0) {
                return Promise.reject(new Error(`No files that match the glob patterns: ${files}`));
            }
            return executeWithBin({
                binCreator: this.binCreator,
                scripts: scripts,
                filePathList
            });
        });
    }

    /**
     * Run with specified `scripts`.
     */
    runScripts(options: RunScriptsOptions) {
        const { ok, errorMessage } = checkGitStatus(options.force);
        if (ok && errorMessage) {
            console.warn(errorMessage);
            // continue
        } else if (!ok) {
            return Promise.reject(new Error(errorMessage));
        }

        if (!options.files.length) {
            return Promise.reject(new Error("No input glob patterns."));
        }

        const filePathList = globby.sync(options.files);
        if (filePathList.length === 0) {
            return Promise.reject(new Error(`No files that match the glob patterns: ${options.files}`));
        }
        // Map to MigrationScript[]
        const scripts = options.scripts.map(script => {
            if (typeof script === "string") {
                return getScriptByName(this.migrationList, script);
            }
            return script;
        });
        return executeWithBin({
            binCreator: this.binCreator,
            scripts: scripts,
            filePathList
        });
    }
}
