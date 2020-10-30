const { ChannelClient, RPCClient } = require("./lib/connection");
const { RPCDirectory } = require("./lib/directory");

function openConnection(address, opts) {
    const channel = new ChannelClient(address, opts);
    const client = new RPCClient(channel);

    return new RPCDirectory(client);
}

module.exports = { openConnection };
