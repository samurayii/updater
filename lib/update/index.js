const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const version_schema = require('./version_shema.json');
const Ajv = require('ajv');
const DockerClientClass = require('./docker-client');
const StopOldContainers = require('./stop_old_containers');
const DeleteOldContainers = require('./delete_old_containers');
const StartContainers = require('./start_containers');

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

    try {

        if (fs.existsSync(full_env_path)) {

            let env = JSON.parse(fs.readFileSync(full_env_path));
            let txt_version = JSON.stringify(version, null, 4);

            for (let key in env) {

                if (env[key] === false) {
                    env[key] = 'false';
                }

                if (env[key] === true) {
                    env[key] = 'true';
                }

                if (typeof env[key] === 'number') {
                    env[key] = `${env[key]}`;
                }

                if (typeof env[key] === 'object') {
                    env[key] = JSON.stringify(env[key]);
                    env[key] = env[key].replace(/\'/gi, "\\'");
                    env[key] = env[key].replace(/\"/gi, '\\"');
                }

                let reg = new RegExp(`{{${key}}}`, 'ig');

                txt_version = txt_version.replace(reg, env[key]);

            }

            version = JSON.parse(txt_version);

        } else {
            console.warn(chalk.yellow(`Env file ${full_env_path} not found`));
        }

    } catch (error) {
        console.error(`Error parsing file ${full_env_path}. ${error}`);
        process.exit(1);
    }

    const validate = (new Ajv()).compile(version_schema);
    const valid = validate(version);

    let old_containers_list;

    if (!valid) {
        console.error(chalk.red(`Version configuration does not match scheme.\nErrors:\n${JSON.stringify(validate.errors, null, 2)}`));
        process.exit(1);
    }

    version.services.forEach( (service) => {

        if (service.Name !== undefined) {
            let name = service.Name;
            delete service.Name;
            service.name = name;
        }

        if (service.Labels === undefined) {
            service.Labels = {};
        }

        service.Labels['updater.package'] = options.package;

    });

    let docker = new DockerClientClass(config[config.mode]);

    docker.ping().then( (result) => {

        if (result === false) {
            console.error(chalk.red(`Docker is unavailable`));
            process.exit(1);
        }

        return docker.listImages();

    }).then( (images_list) => {

        console.log(`Checking docker images ...`);

        let list_correct_flag = true;

        version.services.forEach( (service) => {

            if (!images_list.includes(service.Image)) {
                console.log(`Image ${service.Image} not found`);
                list_correct_flag = true;
            } else {
                console.log(`Image ${service.Image} found`);
            }

        });

        if (!list_correct_flag) {
            console.error(chalk.red(`Updating is not possible`));
            process.exit(1);
        }

        console.log(`Checking docker images complete`);

        return docker.listContainers({
            label: ["updater.package"]
        });

    }).then( (result) => {

        old_containers_list = result;

        console.log(`Stopping old containers`);

        return StopOldContainers(docker, old_containers_list);

    }).then( () => {

        console.log(`Deleting old containers`);
        
        return DeleteOldContainers(docker, old_containers_list);

    }).then( () => {

        console.log(`Starting new containers`);
        
        return StartContainers(docker, version.services);
    
    }).then( () => {

        console.log(chalk.green(`Services package ${options.package} started`));

        process.exit();

    }).catch( (error) => {
        console.error(chalk.red(`Error docker client. ${error.message}`));
        process.exit(1);
    });

}