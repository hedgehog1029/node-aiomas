const net = require("net");

class Payload {
    constructor(targetLength) {
        this.buf = Buffer.alloc(targetLength);
        this.len = targetLength;
        this.pointer = 0;
    }

    done() {
        return this.pointer >= this.len;
    }

    readFrom(target) {
        let copied = target.copy(this.buf, this.pointer, 0, this.len - this.pointer);
        this.pointer += copied;
        return copied;
    }
}

class ChannelClient {
    constructor(address, opts) {
        opts = opts || {};

        this.payloadType = opts.payloadType || 'json';
        this.shouldReconnect = opts.shouldReconnect != false; // defaults to true

        this.handlers = new Map();
        this.lastMsgId = 0;

        this.sock = null;
        let backoff = 1;
        const createSock = () => {
            let sock = new net.Socket();
            sock.connect(address);
            this.sock = sock;

            let payload;
            sock.on('data', (buf) => {
                payload = this._onRawData(buf, payload);
            });
            sock.on('connect', () => backoff = 1);

            let timer = null;
            const reconnect = () => {
                if (timer) return;

                // Backoff & reconnect
                backoff = Math.min(Math.ceil(backoff * 1.25), 30);

                clearTimeout(timer);
                timer = setTimeout(createSock, backoff * 1000);
            };

            sock.on('close', reconnect);
            sock.on('error', (err) => {
                for (let key of this.handlers.keys()) {
                    this._fire(key, err);
                }

                reconnect();
            });
        };

        createSock();
    }

    _onRawData(buf, currentPayload) {
        let payload = currentPayload || null;

        while (buf.length > 0) {
            if (payload == null) {
                let len = buf.readUInt32BE();
                payload = new Payload(len);
                buf = buf.slice(4);
            }

            let nread = payload.readFrom(buf);
            buf = buf.slice(nread);

            if (payload.done()) {
                this._onData(payload);
                payload = null;
            }
        }

        return payload;
    }

    _onData(payload) {
        let buf = payload.buf;
        if (this.payloadType === 'json') {
            const text = buf.toString('utf8');

            let [msgType, msgId, payload] = JSON.parse(text);
            this.lastMsgId = msgId;

            this._fire(msgId, null, msgType, payload);
        } else {
            throw new Error("Invalid payloadType");
        }
    }

    _fire(msgId, err, msgType, payload) {
        let handler = this.handlers.get(msgId);
        if (handler) {
            handler(err, msgType, payload);
            this.handlers.delete(msgId);
        }
    }

    once(msgId, callback) {
        this.handlers.set(msgId, callback);
    }

    send(msgType, payload) {
        this.lastMsgId++;
        let msgId = this.lastMsgId;
        // TODO other codecs
        let data = JSON.stringify([msgType, msgId, payload]);
        let payloadBuf = Buffer.from(data, 'utf8');
        let headerBuf = Buffer.alloc(4);
        headerBuf.writeUInt32BE(payloadBuf.length);

        return new Promise((resolve, reject) => {
            this.once(msgId, (err, msgType, payload) => {
                if (err) return reject(err);

                if (msgType <= 1) {
                    resolve(payload);
                } else {
                    reject(payload);
                }
            });

            this.sock.write(Buffer.concat([headerBuf, payloadBuf]));
        });
    }
}

class RPCClient {
    constructor(channel) {
        this.channel = channel;
    }

    execute(action, args, kwargs) {
        return this.channel.send(0, [action, args || [], kwargs || {}]);
    }
}

module.exports = { ChannelClient, RPCClient };
