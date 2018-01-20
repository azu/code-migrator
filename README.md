# code-migration-framework

This framework help to create code migration tool.

If you have own library/framework/tool, this framework help to create migration tool for your library/framework/tool.

- This framework aim to provide command line interface for running migration scripts by codemod.
- This framework does not provide migration scripts
    - You have to write migration script

## codemod tools

You have to write migration scripts using following codemod tools.

- [facebook/jscodeshift: A JavaScript codemod toolkit.](https://github.com/facebook/jscodeshift)
- [square/babel-codemod: babel-codemod rewrites JavaScript using babel plugins.](https://github.com/square/babel-codemod)
- [KnisterPeter/tscodeshift: tscodeshift is a toolkit for running codemods over multiple TS files](https://github.com/KnisterPeter/tscodeshift)

`code-migration-framework` is a launcher library for the above tools.

## Install

Install with [npm](https://www.npmjs.com/):

    npm install code-migration-framework

## Usage

### Define `MigrationList`

```js
module.exports = {
    scripts: [
        {
            name: "use-strict",
            // absolute path for codemod scripts
            filePath: require.resolve("./scripts/use-strict")
        }
    ],
    versions: [
        // 0.x.x -> 1.0.0 apply "use-strict"
        {
            version: "1.0.0",
            scripts: ["use-strict"]
        },
        // 1.0.0 -> 2.0.0 does not apply anything
        {
            version: "2.0.0",
            scripts: []
        },
        {
            version: "3.0.0",
            scripts: []
        }
    ]
};
```

Example:

```js
const { CodeMigrator } = require("code-migration-framework");
const meow = require("meow");

const cli = meow(
    `
    Usage
      $ code-migration-example <input>

    Options:
      --dry-run Enable dry run mode

    Examples
      $ code-migration-example "src/**/*.js"
`,
    {
        flags: {
            dryRun: {
                type: "boolean"
            }
        }
    }
);

const migrator = new CodeMigrator({
    moduleName: "test-module", // <= target npm module name if needed
    migrationList: require("../migrations"), // load migration list
    binCreator: () => {
        // migration script is executed by jscodeshift
        const binArgs = cli.flags.dryRun ? ["--dry"] : [];
        return {
            binPath: require.resolve(".bin/jscodeshift"),
            binArgs
        };
    }
});
migrator
    .runInteractive({
        filePatterns: cli.input
    })
    .then(() => {
        console.log("Done");
    })
    .catch(error => {
        console.error(error);
    });
```

For more details, see [examples/](./examples/)

## Changelog

See [Releases page](https://github.com/azu/code-migration-framework/releases).

## Running tests

Install devDependencies and Run `npm test`:

    npm i -d && npm test

## Contributing

Pull requests and stars are always welcome.

For bugs and feature requests, [please create an issue](https://github.com/azu/code-migration-framework/issues).

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

## Author

- [github/azu](https://github.com/azu)
- [twitter/azu_re](https://twitter.com/azu_re)

## License

MIT © azu
