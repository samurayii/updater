const Docker = require('dockerode');
const fs = require('fs');
const path = require('path');

module.exports = class DockerClientClass {

    constructor (config) {

        if (config.ca !== '' && typeof config.ca === 'string') {

            let ca_full_path = path.resolve(process.cwd(), config.ca);
        
            if (!fs.existsSync(ca_full_path)) {
                throw new Error(`CA file ${ca_full_path} not found`);
            }
        
            config.ca = fs.readFileSync(ca_full_path);
        } else {
            delete config.ca;
        }
        
        if (config.cert !== '' && typeof config.cert === 'string') {
        
            let cert_full_path = path.resolve(process.cwd(), config.cert);
        
            if (!fs.existsSync(cert_full_path)) {
                throw new Error(`CERT file ${cert_full_path} not found`);
            }
        
            config.cert = fs.readFileSync(cert_full_path);
        
        } else {
            delete config.cert;
        }
        
        if (config.key !== '' && typeof config.key === 'string') {
        
            let key_full_path = path.resolve(process.cwd(), config.key);
        
            if (!fs.existsSync(key_full_path)) {
                throw new Error(`KEY file ${key_full_path} not found`);
            }
        
            config.key = fs.readFileSync(key_full_path);
            
        } else {
            delete config.key;
        }

        this._config = config;

        if (this._config.socket !== undefined) {
            this._docker = new Docker({ 
                socketPath: this._config.socket,
                version: this._config.version
            });
        } else {
            this._docker = new Docker(this._config);
        }

    }

    ping () {
        return new Promise( (resolve, reject) => {
            
            let docker = this._docker;

            docker.ping().then( (result) => {

                if (result.toString() !== 'OK') {
                    return resolve(false);
                }

                resolve(true);

            }).catch( (error) => {
                return reject(new Error(error.message));
            });

        });
    }

    listImages () {
        return new Promise( (resolve, reject) => {

            let docker = this._docker;

            docker.ping().then( (result) => {

                if (result.toString() !== 'OK') {
                    return reject(new Error('Docker is unavailable'));
                }

                return docker.listImages();

            }).then( (images_list) => {

                let result = [];

                images_list.forEach( (image) => {

                    if (image.RepoTags) {
        
                        image.RepoTags.forEach( (image_name) => {
        
                            if (!result.includes(image_name)) {
                                result.push(image_name);
                            }
            
                        });
        
                    }
        
                });

                resolve(result);

            }).catch( (error) => {
                return reject(new Error(error.message));
            });

        });
    }

    pullImages (list_images = []) {

        return new Promise( (resolve, reject) => {

            if (typeof list_images === 'string') {
                list_images = [list_images];
            }

            if (!Array.isArray(list_images)) {
                return reject(new Error('Argument to pull method must be of type string or array.'));
            }

            if (list_images.length === 0) {
                return resolve();
            }

            let docker = this._docker;
            let config = this._config;

            let pulled_images = 0;
            let pulled_error = false;

            const checkPulled = () => {

                pulled_images += 1;

                console.log(`Uploaded images ${pulled_images}/${list_images.length}`);

                if (pulled_error) {
                    reject(pulled_error);
                } else {
                    if (pulled_images >= list_images.length) {
                        resolve();
                    } else {
                        pull(list_images[pulled_images]);
                    }
                }

            }

            const pull = (image_name) => {

                let options = false;

                config.auth.forEach( (server) => {

                    let registry = server.registry.match(/(http|https)\:\/\/([-a-zA-Z0-9._]{1,256}(\:[0-9]{1,5}|))\/(v2|v1)/);

                    if (registry) {

                        registry = registry[2];

                        if (!options) {

                            if (image_name.includes(registry)) {
                                
                                options = {
                                    authconfig: {
                                        username: server.login,
                                        password: server.password,
                                        auth: '',
                                        serveraddress: server.registry
                                    }
                                }

                            }

                        }
                    }

                });

                if (!options) {

                    config.auth.forEach( (server) => {
                        if (!options) {
                            if (server.registry.includes(`docker.io`)) {
                                options = {
                                    authconfig: {
                                        username: server.login,
                                        password: server.password,
                                        auth: '',
                                        serveraddress: server.registry
                                    }
                                }
                            }
                        }
                    });

                    if (!options) {
                        options = {};
                    }
                    
                }

                docker.ping().then( (result) => {

                    if (result.toString() !== 'OK') {
                        pulled_error = new Error('Docker is unavailable');
                        return checkPulled();
                    }
    
                    return docker.pull(image_name, options);

                }).then( (stream) => {

                    console.log(`Image ${image_name} uploading`);

                    const onFinished = (error) => {
                        if (error) {
                            pulled_error = new Error(error.message);
                        } else {
                            console.log(`Image ${image_name} pulled`);
                        }
                        checkPulled();
                    }

                    const onProgress = (event) => {

                        if (event.status === 'Extracting') {
                            return console.log(`Extracting: ${event.progress}`);
                        }

                        if (event.status === 'Download complete') {
                            return console.log(`Download complete: ${event.id}`);
                        }

                        if (event.status === 'Downloading') {
                            return console.log(`Downloading: ${event.progress}`);
                        }

                        if (event.status === 'Pull complete') {
                            return console.log(`Pull complete: ${event.id}`);
                        }

                        if (event.status === 'Verifying Checksum') {
                            return console.log(`Verifying Checksum: ${event.id}`);
                        }

                        if (event.status === 'Pulling fs layer') {
                            return console.log(`Pulling fs layer: ${event.id}`);
                        }

                        if (event.status === 'Waiting') {
                            return console.log(`Waiting: ${event.id}`);
                        }

                        if (event.status === 'Downloading') {
                            return console.log(`Downloading: ${event.progress}`);
                        }
                         
                        console.log(`${Object.values(event).join('')}`);
                    }

                    docker.modem.followProgress(stream, onFinished, onProgress);                   

                }).catch( (error) => {
                    pulled_error = new Error(error.message);
                    checkPulled();
                });

            }

            console.log(`Pulling ${list_images.length} images`);

            pull(list_images[0]);

        });

    }

    createContainer (options) {
        return new Promise( (resolve, reject) => {

            if (typeof options !== 'object') {
                return reject(new Error('Options must be object.'));
            }

            if (options.name === undefined || typeof options.name !== 'string') {
                return reject(new Error('Options.name must be string.'));
            }

            let docker = this._docker;

            console.log(`Creating container ${options.name} ...`);

            docker.ping().then( (result) => {

                if (result.toString() !== 'OK') {
                    return reject(new Error('Docker is unavailable'));
                }

                return docker.createContainer(options);

            }).then( () => {
                console.log(`Container ${options.name} created`);
                resolve();
            }).catch( (error) => {
                reject(new Error(error.message));
            });

        });
    }

    startContainer (options) {

        return new Promise( (resolve, reject) => {

            if (typeof options !== 'object') {
                return reject(new Error('Options must be object.'));
            }

            if (options.name === undefined || typeof options.name !== 'string') {
                return reject(new Error('Options.name must be string.'));
            }

            let docker = this._docker;

            console.log(`Starting container ${options.name} ...`);

            docker.ping().then( (result) => {

                if (result.toString() !== 'OK') {
                    return reject(new Error('Docker is unavailable'));
                }

                return docker.listContainers({
                    all: true,
                    filters: {
                        name: [options.name]
                    }
                });

            }).then( (result) => {
              
                if (result.length <= 0) {
                    return docker.createContainer(options);
                }
                
                return docker.getContainer(options.name);

            }).then( (container) => {

                return container.start();
            }).then( () => {
                console.log(`Container ${options.name} started`);
                resolve();
            }).catch( (error) => {
                reject(new Error(error.message));
            });

        });
    }

    deleteContainer (name) {
        return new Promise( (resolve, reject) => {

            if (typeof name !== 'string') {
                return reject(new Error('Name must be string.'));
            }

            let docker = this._docker;

            console.log(`Deleting container ${name} ...`);

            docker.ping().then( (result) => {

                if (result.toString() !== 'OK') {
                    return reject(new Error('Docker is unavailable'));
                }

                return docker.listContainers({
                    all: true,
                    filters: {
                        name: [name]
                    }
                });

            }).then( (result) => {
              
                if (result.length <= 0) {
                    return resolve();
                }                

                return docker.getContainer(name);

            }).then( (container) => {

                return container.remove({
                    force: true
                });
            }).then( () => {
                console.log(`Container ${name} deleted`);
                resolve();
            }).catch( (error) => {
                reject(new Error(error.message));
            });

        });
    }

    stopContainer (name) {
        return new Promise( (resolve, reject) => {

            if (typeof name !== 'string') {
                return reject(new Error('Name must be string.'));
            }

            let docker = this._docker;

            console.log(`Stopping container ${name} ...`);

            docker.ping().then( (result) => {

                if (result.toString() !== 'OK') {
                    return reject(new Error('Docker is unavailable'));
                }

                return docker.listContainers({
                    all: true,
                    filters: {
                        name: [name]
                    }
                });

            }).then( (result) => {
                
                if (result.length <= 0 || !(/running/i.test(result[0].State))) {
                    console.log(`Container ${name} stopped`);
                    return resolve();
                }           

                return docker.getContainer(name);

            }).then( (container) => {
                return container.stop({
                    t: 1
                });
            }).then( () => {
                console.log(`Container ${name} stopped`);
                resolve();
            }).catch( (error) => {
                reject(new Error(error.message));
            });

        });
    }

    logsContainer (name) {

        return new Promise( (resolve, reject) => {

            if (typeof name !== 'string') {
                return reject(new Error('Name must be string.'));
            }

            let docker = this._docker;

            docker.ping().then( (result) => {

                if (result.toString() !== 'OK') {
                    return reject(new Error('Docker is unavailable'));
                }

                return docker.listContainers({
                    all: true,
                    filters: {
                        name: [name]
                    }
                });

            }).then( (result) => {
                
                if (result.length <= 0) {
                    return resolve('');
                }                

                return docker.getContainer(name);

            }).then( (container) => {
                return container.logs({
                    follow: false,
                    stdout: true,
                    stderr: true
                });
            }).then( (result) => {
                resolve(result.toString().trim());
            }).catch( (error) => {
                reject(new Error(error.message));
            });

        });

    }

    existContainer (name) {
        return new Promise( (resolve, reject) => {

            if (typeof name !== 'string') {
                return reject(new Error('Name must be string.'));
            }

            let docker = this._docker;

            console.log(`Сhecking for existence container ${name}`);

            docker.ping().then( (result) => {

                if (result.toString() !== 'OK') {
                    return reject(new Error('Docker is unavailable'));
                }

                return docker.listContainers({
                    all: true,
                    filters: {
                        name: [name]
                    }
                });

            }).then( (result) => {

                resolve(result.length > 0);

            }).catch( (error) => {
                reject(new Error(error.message));
            });

        });
    }

    statusContainer (name) {
        return new Promise( (resolve, reject) => {

            if (typeof name !== 'string') {
                return reject(new Error('Name must be string.'));
            }

            let docker = this._docker;

            console.log(`Get status container ${name}`);

            docker.ping().then( (result) => {

                if (result.toString() !== 'OK') {
                    return reject(new Error('Docker is unavailable'));
                }

                return docker.listContainers({
                    all: true,
                    filters: {
                        name: [name]
                    }
                });

            }).then( (result) => {

                let status = {
                    status: 'unknow',
                    state: 'unknow',
                    labels: {}
                };

                for (let index in result) {
                    status.status = result[index].Status;
                    status.state = result[index].State;
                    status.labels = result[index].Labels
                }

                resolve(status);

            }).catch( (error) => {
                reject(new Error(error.message));
            });

        });
    }

    listContainers (filters = {}, all = true) {
        return new Promise( (resolve, reject) => {

            let docker = this._docker;

            console.log(`Get list containers`);

            docker.ping().then( (result) => {

                if (result.toString() !== 'OK') {
                    return reject(new Error('Docker is unavailable'));
                }

                return docker.listContainers({
                    all: all,
                    filters: filters
                });

            }).then( (result) => {

                resolve(result);

            }).catch( (error) => {
                reject(new Error(error.message));
            });

        });
    }
}