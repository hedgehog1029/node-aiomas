# node-aiomas

A node.js library for interacting with python's `aiomas` library.

Currently only implementing a channel and RPC client.
Quality is alpha-level, this has only been tested a little so far.

### Usage

```js
const { openConnection } = require("aiomas");

// takes the same options as `net.Socket#connect`
// so you can open both TCP and unix sockets ✨
const rpc = openConnection({ port: 5555 });

// you access remote methods at `rpc.remote`, just like in python
// when you call the remote method you get a Promise back
rpc.remote.add(3, 4)
    .then((result) => console.log(`What's 3 + 4? ${result}`))
    .catch((err) => console.error(err));

// following the service tree
rpc.remote.nested.do_something([1, 2, 3]).then(someCallback);
```

### Roadmap

No personal promises on these, but PRs welcome.

- [x] `aiomas.rpc`-compatible client implementation
- [ ] `aiomas.channel` server implementation
- [ ] `aiomas.rpc` server implementation
- [ ] `aiomas.agent` implementation, maybe
