import execa = require("execa");
import pAll = require("p-all");
import { MigrationScript } from "./MigrationList";

const debug = require("debug")("code-migrator");
export type BinCreator = (
    args: { script: MigrationScript; filePathList: string[] }
) => {
    binPath: string;
    binArgs?: string[];
};

export interface runWithBinOptions {
    binCreator: BinCreator;
    // migration scripts
    scripts: MigrationScript[];
    // target file list
    filePathList: string[];
}

export const executeWithBin = (args: runWithBinOptions): Promise<void> => {
    const scripts = args.scripts;
    const filePathList = args.filePathList;
    const binCreator = args.binCreator;
    const functions = scripts.map(script => {
        return () => {
            // get `binPath`
            const binResult = binCreator({
                script,
                filePathList
            });
            const binPath = binResult.binPath;
            const binArgs = binResult.binArgs || [];
            const args = binArgs.concat(["-t", script.filePath]).concat(filePathList);
            debug(`${binPath} %o`, args);
            return execa(binPath, args, {
                stdio: "inherit",
                stripEof: false
            });
        };
    });
    // sequential
    return pAll(functions, { concurrency: 1 }).then(() => {
        debug("Success all functions");
    });
};
