class RPCDirectory {
    constructor(client) {
        this.client = client;
    }

    get remote() {
        const executor = () => {};
        executor.path = [];

        let proxy = new Proxy(executor, {
            get: (target, name) => {
                target.path.push(name);
                return proxy;
            },
            apply: (target, that, args) => {
                let action = target.path.join("/");

                return this.client.execute(action, args);
            }
        });

        return proxy;
    }
}

module.exports = { RPCDirectory };
