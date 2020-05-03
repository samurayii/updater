const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

let version = '0.0.1';

if (fs.existsSync(path.resolve(__dirname, '../package.json'))) {
    version = require(path.resolve(__dirname, '../package.json')).version;
}

const optionator = require('optionator')({
    prepend: 'Usage: updater --config windows.port 2375',
    append: `Version: ${version}`,
    options: [
        {
            option: 'help',
            type: 'Boolean',
            description: 'displays help',
            example: 'updater --help'
        }, 
        {
            option: 'config',
            type: 'Boolean',
            description: 'Enable config mode',
            example: 'updater --config --windows_port 2375'
        },
        {
            option: 'prepare',
            type: 'Boolean',
            description: 'Enable prepare mode',
            example: 'updater --prepare --package v1'
        },
        {
            option: 'check',
            type: 'Boolean',
            description: 'Enable check mode',
            example: 'updater --check --package v1'
        },
        {
            option: 'unpack',
            type: 'Boolean',
            description: 'Enable unpack mode',
            example: 'updater --unpack --package v1'
        },
        {
            option: 'update',
            type: 'Boolean',
            description: 'Enable update mode',
            example: 'updater --update --package v1'
        },
        {
            option: 'package',
            type: 'String',
            description: '[all mode]: Path to package',
            example: 'updater --prepare --check --package v1'
        },
        {
            option: 'packages',
            type: 'String',
            description: '[config mode]: Path to packages folder',
            example: 'updater --config --packages /packages'
        },
        {
            option: 'env',
            type: 'String',
            description: '[config mode]: Path to env file',
            example: 'updater --config --env /env.json'
        },
        {
            option: 'mode',
            type: 'String',
            description: '[config mode]: Mode for settings docker',
            example: 'updater --config --mode windows'
        },
        {
            option: 'version',
            type: 'String',
            description: '[config mode]: Version for docker',
            example: 'updater --config --version v1.38'
        },
        {
            option: 'show',
            type: 'Boolean',
            description: '[config mode]: Show settings',
            example: 'updater --config --show'
        },
        {
            option: 'wport',
            type: 'String',
            description: '[config mode]: port for windows settings',
            example: 'updater --config --wport 2375'
        },
        {
            option: 'spath',
            type: 'String',
            description: '[config mode]: path to socket',
            example: 'updater --config --spath 2375'
        },
        {
            option: 'tport',
            type: 'String',
            description: '[config mode]: port for tcp settings',
            example: 'updater --config --tport 2375'
        },
        {
            option: 'tprotocol',
            type: 'String',
            description: '[config mode]: protocol for tcp settings',
            example: 'updater --config --tprotocol http'
        },
        {
            option: 'thost',
            type: 'String',
            description: '[config mode]: host for tcp settings',
            example: 'updater --config --thost localhost'
        },
        {
            option: 'tca',
            type: 'String',
            description: '[config mode]: path to CA file for tcp settings',
            example: 'updater --config --tca /ca'
        },
        {
            option: 'tcert',
            type: 'String',
            description: '[config mode]: path to CERT file for tcp settings',
            example: 'updater --config --tcert /cert'
        },
        {
            option: 'tkey',
            type: 'String',
            description: '[config mode]: path to KEY file for tcp settings',
            example: 'updater --config --tkey /key'
        }
    ]
});

let options;

try {
    options = optionator.parseArgv(process.argv);
} catch (error) {
    console.error(error)
    console.log(chalk.red(`[ERROR] ${error.message}`));
    process.exit(1);
}

if (options.help !== undefined) {
    console.log(optionator.generateHelp());
    process.exit();
}

module.exports = options;