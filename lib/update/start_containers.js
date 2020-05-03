module.exports = (docker, services_list) => {
    return new Promise( (resolve, reject) => {

        if (services_list.length <= 0) {
            return resolve();
        }

        let started_containers = 0;

        const startedContainer = () => {

            started_containers += 1;

            if (started_containers >= services_list.length) {
                resolve();
            }

        }

        services_list.forEach( (service) => {

            delete service.tar;

            docker.startContainer(service).then( () => {
                startedContainer();
            }).catch( (error) => {
                reject(error);
            });

        });

    });
}