const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const version_schema = require('./version_shema.json');
const Ajv = require('ajv');

module.exports = (options) => {
    
    if (options.package === undefined) {
        console.error(chalk.red(`Not set package key`));
        process.exit(1);
    }

    options.package = options.package.replace(/(\\|\/)/ig, '');

    let full_config_path = path.resolve(__dirname, '../current_config.json');

    const config = JSON.parse(fs.readFileSync(full_config_path));

    let full_packages_path = path.resolve(process.cwd(), config.packages);
    let full_version_path = path.resolve(full_packages_path, `${options.package}/version.json`);
    let full_env_path = path.resolve(process.cwd(), config.env);

    if (!fs.existsSync(full_env_path)) {
        console.warn(chalk.yellow(`Env file ${full_env_path} not found`));
    }

    if (!fs.existsSync(full_version_path)) {
        console.error(chalk.red(`Version file ${full_version_path} not found`));
        process.exit(1);
    }

    let version;

    try {
        version = JSON.parse(fs.readFileSync(full_version_path));
    } catch (error) {
        console.error(`Error parsing file ${full_version_path}. ${error}`);
        process.exit(1);
    }

    const validate = (new Ajv()).compile(version_schema);
    const valid = validate(version);

    if (!valid) {
        console.error(chalk.red(`Version configuration does not match scheme.\nErrors:\n${JSON.stringify(validate.errors, null, 2)}`));
        process.exit(1);
    }

    let error_flag = false;

    version.services.forEach( (service) => {

        let full_file_path = path.resolve(full_packages_path, `${options.package}/${service.tar}`);

        console.log(`Checking service ${service.Domainname} ...`);
        
        if (!fs.existsSync(full_file_path)) {
            error_flag = true;
            console.error(chalk.red(`Image tar file ${service.tar} not found in package ${options.package}`));
        } else {
            console.log(`Service ${service.Domainname} checked`);
        }

    });

    if (error_flag) {
        console.error(chalk.red(`Version ${options.package} not correct`));
        process.exit(1);
    }

    console.log(chalk.green(`Version ${options.package} correct`));

}