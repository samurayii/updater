module.exports = (docker, containers_list) => {
    return new Promise( (resolve, reject) => {

        if (containers_list.length <= 0) {
            return resolve();
        }

        let stopped_containers = 0;

        const stoppedContainer = () => {

            stopped_containers += 1;

            if (stopped_containers >= containers_list.length) {
                resolve();
            }

        }

        containers_list.forEach( (container) => {

            let name = container.Names[0].replace(/\//g, '');

            docker.stopContainer(name).then( () => {
                stoppedContainer();
            }).catch( (error) => {
                reject(error);
            });

        })

    });
}