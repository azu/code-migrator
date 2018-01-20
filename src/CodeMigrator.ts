import {
    checkGitStatus,
    getPackageVersion,
    createPromptVersionParameters,
    selectScripts,
    sortByVersion
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
    // specify target file glob patterns
    filePatterns: string[];
    // default file glob placeholder for prompt
    filePatternsPlaceholder?: string;
    // prompt messages
    message?: {
        currentVersion?: string;
        nextVersion?: string;
        files?: string;
    };
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
    runInteractive(options: CodeMigratorRunOption) {
        const { ok, errorMessage } = checkGitStatus(options.force);
        if (ok && errorMessage) {
            console.warn(errorMessage);
            // continue
        } else if (!ok) {
            return Promise.reject(new Error(errorMessage));
        }
        const sortedVersions = sortByVersion(this.migrationList.versions);
        const versions = createPromptVersionParameters(sortedVersions);
        const defaultFiles = options.filePatternsPlaceholder || "src/**/*.js";
        let moduleName = this.moduleName;
        const targetModuleVersion = getPackageVersion(moduleName);
        const questions: Question[] = [
            {
                type: "list",
                name: "currentVersion",
                default: (options.message && options.message.currentVersion) || targetModuleVersion,
                message: `What version of ${moduleName} are you currently using?`,
                choices: versions.slice(0, -1)
            },
            {
                type: "list",
                name: "nextVersion",
                message:
                    (options.message && options.message.nextVersion) ||
                    `What version of ${moduleName} are you moving to?`,
                choices: versions.slice(1)
            },
            {
                type: "input",
                name: "files",
                message:
                    (options.message && options.message.files) ||
                    "On which files should the migration scripts be applied?",
                default: defaultFiles,
                when: !options.filePatterns.length,
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
            const files = answers.files || options.filePatterns;
            if (!files.length) {
                return Promise.reject(new Error("No input glob patterns."));
            }

            const scripts = selectScripts({
                migrationList: this.migrationList,
                currentVersion: answers.currentVersion,
                nextVersion: answers.nextVersion
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
    runWithScript(scripts: MigrationScript[], filePatterns: string[]) {
        if (!filePatterns.length) {
            return Promise.reject(new Error("No input glob patterns."));
        }

        const filePathList = globby.sync(filePatterns);
        if (filePathList.length === 0) {
            return Promise.reject(new Error(`No files that match the glob patterns: ${filePatterns}`));
        }

        return executeWithBin({
            binCreator: this.binCreator,
            scripts: scripts,
            filePathList
        });
    }
}
