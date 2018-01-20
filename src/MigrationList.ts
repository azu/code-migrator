export interface MigrationScript {
    // script name
    name: string;
    // script absolute file path
    filePath: string;

    [index: string]: any;
}

export interface MigrationVersion {
    // target version
    // Example: "1.0.0"
    version: string;
    // apply migration scripts name list
    scripts: MigrationScript["name"][];

    [index: string]: any;
}

export interface MigrationList {
    scripts: MigrationScript[];
    versions: MigrationVersion[];
}
