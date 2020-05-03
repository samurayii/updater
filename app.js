#!/usr/bin/env node

const options = require('./lib/cli-arg');
const chalk = require('chalk');
const default_config = require('./lib/default_config.json');
const path = require('path');
const fs = require('fs');

const configuration = require('./lib/config');
const prepare = require('./lib/prepare');
const check = require('./lib/check');
const unpack = require('./lib/unpack');
const update = require('./lib/update');

let full_current_config_path = path.resolve(__dirname, './lib/current_config.json');

if (!fs.existsSync(full_current_config_path)) {
    fs.writeFileSync(full_current_config_path, JSON.stringify(default_config, null, 4));
}

let exist_mode_flag = true;

if (options.config === true) {
    exist_mode_flag = false;
    configuration(options);
}

if (options.check === true) {
    exist_mode_flag = false;
    check(options);
}

if (options.prepare === true) {
    exist_mode_flag = false;
    prepare(options);
}

if (options.unpack === true) {
    exist_mode_flag = false;
    unpack(options);
}

if (options.update === true) {
    exist_mode_flag = false;
    update(options);
}

if (exist_mode_flag === true) {
    console.error(chalk.red(`[ERROR] Not set mode.`));
    process.exit(1);
}

process.on(`SIGTERM`, () => {
    console.log(`💀 TERMINATION SIGNAL RECEIVED (SIGTERM) 💀.`);
    process.exit();
});