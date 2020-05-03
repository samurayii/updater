const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const config_compiler = require('config-compiler');
const config_schema = require('./config_schema.json');
const Ajv = require('ajv');

module.exports = (options) => {

    let config = {};
    let full_config_path = path.resolve(__dirname, '../current_config.json');

    config = JSON.parse(fs.readFileSync(full_config_path));

    config = config_compiler.parse(config, config_schema);

    if (options.show) {

        console.log('settings:');
        
        console.log(`  packages: ${config.packages}`);
        console.log(`  env: ${config.env}`);
        console.log(`  mode: ${config.mode}`);
        console.log(`  docker:`);
        console.log(`    version: ${config.version}`);

        if (config.mode === 'windows') {
            console.log(`    port: ${config.windows.port}`);
        }

        if (config.mode === 'socket') {
            console.log(`    path: ${config.socket.path}`);
        }

        if (config.mode === 'tcp') {
            console.log(`    protocol: ${config.tcp.protocol}`);
            console.log(`    host: ${config.tcp.host}`);
            console.log(`    port: ${config.tcp.port}`);
            console.log(`    ca: ${config.tcp.ca}`);
            console.log(`    cert: ${config.tcp.cert}`);
            console.log(`    key: ${config.tcp.key}`);
        }

        process.exit();
    }

    if (options.packages) {
        config.packages = options.packages;
        console.log(`setting packages set ${config.packages}`);
    }
    if (options.env) {
        config.env = options.env;
        console.log(`setting env set ${config.env}`);
    }
    if (options.mode) {
        config.mode = options.mode;
        console.log(`setting mode set ${config.mode}`);
    }
    if (options.version) {
        config.version = options.version;
        console.log(`setting version set ${config.version}`);
    }

    if (options.wport) {
        config.windows.port = parseInt(options.wport);
        console.log(`setting wport set ${config.wport}`);
    }
    if (options.spath) {
        config.socket.path = options.spath;
        console.log(`setting spath set ${config.spath}`);
    }

    if (options.tport) {
        config.tcp.port = parseInt(options.tport);
        console.log(`setting tport set ${config.tport}`);
    }
    if (options.tprotocol) {
        config.tcp.protocol = options.tprotocol;
        console.log(`setting tprotocol set ${config.tprotocol}`);
    }
    if (options.thost) {
        config.tcp.host = options.thost;
        console.log(`setting thost set ${config.thost}`);
    }
    if (options.tca) {
        config.tcp.ca = options.tca;
        console.log(`setting tca set ${config.tca}`);
    }
    if (options.tcert) {
        config.tcp.cert = options.cert;
        console.log(`setting tcert set ${config.tcert}`);
    }
    if (options.tkey) {
        config.tcp.key = options.tkey;
        console.log(`setting tkey set ${config.tkey}`);
    }

    const validate = (new Ajv()).compile(config_schema);
    const valid = validate(config);

    if (!valid) {
        console.error(chalk.red(`Configuration does not match scheme.\nErrors:\n${JSON.stringify(validate.errors, null, 2)}`));
        process.exit(1);
    }

    fs.writeFileSync(full_config_path, JSON.stringify(config, null, 4));
    console.log(chalk.green(`Config updated`));

}