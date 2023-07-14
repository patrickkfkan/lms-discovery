# lms-discovery

Logitech Media Server discovery for Node.js

## Install

```
npm install --save lms-discovery
```

## Usage

```
// ESM
import discovery from 'lms-discovery';
// CJS
const discovery = require('lms-discovery');

discovery.on('discovered', (server) => {
    console.log('Server discovered:', server);
});

discovery.on('lost', (server) => {
    // Do something with lost server
});

discovery.start();

...

discovery.stop();


// Output
Server discovered: {
    ip: '192.168.1.85',     // Server's IP address
    name: 'my-lms-server',  // Server name
    ver: '8.2.1',           // Server version
    uuid: '187fa185-d108-408b-a8bd-8f5a4bb855bd',  // Unique identifier
    jsonPort: '9000',       // Port for JSON-RPC requests
    cliPort: '9090'         // Port for CLI commands and queries   
}

```

Run [example](example/index.ts):
```
npm run example
```

## API

<details>
<summary><code>start([options])</code></summary>
<br />

<p>Starts the discovery service.</p>

**Params**

- `options`: (*optional* and *all properties optional*)
    - `broadcastAddress`: (string) network address used to transmit discovery requests. Default: `255.255.255.255`.
    - `discoveredTTL`: (number) how long in milliseconds to wait for a discovered server to respond to a subsqeuent discovery request before it is presumed lost. *Only applicable for servers that do not advertise `cliPort`.* Default: `60000` (60 seconds).
    - `discoverInterval`: (number) how often in milliseconds to broadcast discovery requests. Default: `30000` (30 seconds).

> `discoveredTTL` must be larger than `discoverInterval`.

---
</details>

<details>
<summary><code>stop()</code></summary>
<br />

<p>Stops the discovery service.</p>

---
</details>

<details>
<summary><code>getStatus()</code></summary>
<br />

<p>Gets the status of the discovery service.</p>

**Returns**

`running` or `stop`

---
</details>

<details>
<summary><code>getAllDiscovered()</code></summary>
<br />

<p>Gets all servers discovered so far.</p>

**Returns**

Array<[ServerInfo](docs/api/interfaces/ServerInfo.md)>

---
</details>

<details>
<summary><code>setDebug(enabled[, callback])</code></summary>
<br />

<p>Whether to enable debug messages.</p>

**Params**
- `enabled`: (boolean)
- `callback`: (function)
    - If specified, debug messages will be passed to `callback`.
    - If not specified, debug messages will be printed to console.

---
</details>

### Events

<details>
<summary><code>on('discovered', (server) => ...)</code></summary>
<br />

<p>Emitted when a server is discovered.</p>

**Listener Params**
- `server`: [ServerInfo](docs/api/interfaces/ServerInfo.md)

---
</details>

<details>
<summary><code>on('lost', (server) => ...)</code></summary>
<br />

Emitted when a server is lost.

**Listener Params**
- `server`: [ServerInfo](docs/api/interfaces/ServerInfo.md)

---
</details>

<details>
<summary><code>on('error', (error) => ...)</code></summary>
<br />

<p>Emitted when an error has occurred.</p>

**Listener Params**
- `error`: (any)

---
</details>


## Changelog

1.0.0:
- Migrate to TypeScript and package as ESM / CJS hybrid module

0.1.0:
- Initial release

## License
MIT
