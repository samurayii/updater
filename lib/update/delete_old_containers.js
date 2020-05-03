module.exports = (docker, containers_list) => {
    return new Promise( (resolve, reject) => {

        if (containers_list.length <= 0) {
            return resolve();
        }

        let deleted_containers = 0;

        const deletedContainer = () => {

            deleted_containers += 1;

            if (deleted_containers >= containers_list.length) {
                resolve();
            }

        }

        containers_list.forEach( (container) => {

            let name = container.Names[0].replace(/\//g, '');

            docker.existContainer(name).then( (result) => {

                if (result === false) {
                    return deletedContainer();
                }

                return docker.deleteContainer(name);

            }).then( () => {
                deletedContainer();
            }).catch( (error) => {
                reject(error);
            });

        })

    });
}