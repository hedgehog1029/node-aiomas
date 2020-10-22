const { ChannelClient, RPCClient } = require("./lib/connection");
const { RPCDirectory } = require("./lib/directory");

function openConnection(address) {
    const channel = new ChannelClient(address);
    const client = new RPCClient(channel);

    return new RPCDirectory(client);
}

module.exports = { openConnection };
