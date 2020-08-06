const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const version_schema = require('./version_shema.json');
const Ajv = require('ajv');
const child_process = require('child_process');

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

    console.log(`Preparing version ${options.package} ...`);

    version.services.forEach( (service) => {

        let file_path = `${service.Image.replace(/\:/ig, '_')}.tar`;
        let dirname = path.dirname(file_path);
        let full_dirname = path.resolve(full_packages_path, `${options.package}/${dirname}`);
        let full_file_path = path.resolve(full_packages_path, `${options.package}/${file_path}`);

        console.log(`Preparing service ${service.Domainname} ...`);
        console.log(`Creating image archive ${service.Image} ...`);

        try {

            if (!fs.existsSync(full_dirname)) {
                fs.mkdirSync(full_dirname, {
                    recursive: true
                });
            }

            child_process.execSync(`docker save -o ${full_file_path} ${service.Image}`, {
                cwd: process.cwd(),
                env: process.env
            });

            console.log(`Image archive ${service.Image} created`);

            service.tar = file_path;

            if (service.Hostname === undefined) {
                service.Hostname = service.Domainname;
            }

            if (service.Name === undefined) {
                service.Name = service.Domainname.replace(/\./, '-');
            }

            console.log(`Preparing service ${service.Domainname} completed`);

        } catch (error) {
            console.error(chalk.red(`Error creating image archive ${service.tar}`));
            console.error(chalk.red(error));
            process.exit(1);
        }

    });

    fs.writeFileSync(full_version_path, JSON.stringify(version, null, 4));

    console.log(`Version saved to ${full_version_path}`);
    console.log(chalk.green(`Vesrsion ${options.package} prepared`));

}