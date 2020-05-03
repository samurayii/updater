const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const child_process = require('child_process');
const check = require('../check');

module.exports = (options) => {
    
    check(options);

    options.package = options.package.replace(/(\\|\/)/ig, '');

    let full_config_path = path.resolve(__dirname, '../current_config.json');

    const config = JSON.parse(fs.readFileSync(full_config_path));

    let full_packages_path = path.resolve(process.cwd(), config.packages);
    let full_version_path = path.resolve(full_packages_path, `${options.package}/version.json`);

    const version = JSON.parse(fs.readFileSync(full_version_path));

    console.log(`Unpaking version ${options.package} ...`);
    
    version.services.forEach( (service) => {

        let full_file_path = path.resolve(full_packages_path, `${options.package}/${service.tar}`);

        console.log(`Unpacking service ${service.Domainname} ...`);
        console.log(`Load image ${service.Image} ...`);

        try {

            let stdout = child_process.execSync(`docker load -i ${full_file_path}`, {
                cwd: process.cwd(),
                env: process.env
            });

            console.log(`Image ${service.Image} loaded`);
            console.log(`Unpacking service ${service.Domainname} completed`);

        } catch (error) {
            console.error(chalk.red(`Error loading image ${service.Image}`));
            console.error(chalk.red(error));
            process.exit(1);
        }

    });

    console.log(chalk.green(`Vesrsion ${options.package} unpacked`));

}