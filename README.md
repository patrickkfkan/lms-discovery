# lms-discovery

Logitech Media Server discovery for Node.js

## Install

```
npm install --save lms-discovery
```

## Usage

```
const discovery = require('lms-discovery');

discovery.on('discovered', (server) => {
    // Do something with discovered server
});

discovery.on('lost', (server) => {
    // Do something with lost server
});

discovery.start();

...

discovery.stop();
```

## API

### Event functions

`on(event, listener)`<br>
`once(event, listener)`<br>
`off(event[, listener])`<br>

- `event` \<string\>
- `listener` \<Function\>

|Function                  |Description                                     |
|--------------------------|------------------------------------------------|
|`on(event, listener)`     |Adds `listener` function for `event`.           |
|`once(event, listener)`   |Adds one-time `listener` function for `event`.  |
|`off(event[, listener])`  |Removes `listener` function for `event`. If `listener` is not specified, removes all listeners for the event.|

Events:

|Event          |    Description                                            |
|---------------|-----------------------------------------------------------|
|`discovered`   |Emitted when a new server is discovered.                   |
|`lost`         |Emitted when a previously-discovered server is lost. A server is considered lost when it no longer responds to discovery requests within a stipulated period.|

Data passed to `listener`:

|Event          |Data                                                       |
|---------------|-----------------------------------------------------------|
|`discovered`   |\<Object\> Server info of discovered server                  |
|`lost`         |\<Object\> Server info of lost server                        |

Example server info:
```
{
    ip: '192.168.1.85',     // Server's IP address
    name: 'my-lms-server',  // Server name
    ver: '8.2.1',           // Server version
    uuid: '187fa185-d108-408b-a8bd-8f5a4bb855bd',
    jsonPort: '9000',       // Port for JSON-RPC requests
    cliPort: '9090'         // Port for CLI commands and queries   
}
```

### `start([options])`

- `options` \<Object\>
    - `broadcastAddress`: the broadcast address to which discovery requests are to be sent. Default: `255.255.255.255`.
    - `discoveredTTL`: period in milliseconds. If a previously-discovered server does not respond to subsequent discovery requests made within this period, it is considered lost. Default: `60000` (60 seconds).
    - `discoverInterval`: the interval in milliseconds at which discovery requests are sent. Default: `30000` (30 seconds).

Starts the discovery service.

After discovery has started, you must stop it before calling `start()` again. If you don't do this, an error will be thrown.

Normally, you would register listeners for the `discover` and `lost` events before calling `start()`.

> If you specify `discoveredTTL` and / or `discoverInterval` in `options`, make sure the former is larger than the latter, otherwise an error will be thrown. Also ensure that `discoveredTTL` is reasonably larger than `discoverInterval`, so as to avoid the situation where a discovered server actually responds but appears momentarily lost because a discovery request is not made in time.

### `stop()`

Stops the discovery service.

### `getStatus()`

- Returns: \<string\>

Returns the status of the discovery service: `running` or `stop`.

### `getAllDiscovered()`

- Returns: \<Array\>

Returns an array listing all servers discovered so far. The values in the array are Objects:

```
[
    {
        ip: '192.168.1.85',
        name: 'my-lms-server',
        ver: '8.2.1',
        uuid: '187fa185-d108-408b-a8bd-8f5a4bb855bd',
        jsonPort: '9000',
        cliPort: '9090'
    },
    {
        ip: '192.168.1.132',
        name: 'my-lms-server2',
        ...
    },
    ...
]
```

### `setDebug(enabled[, callback])`

- `enabled` \<boolean\>
- `callback` \<Function\>
    - If not specified, output debug messages to console.
    - If specified, pass debug messages to `callback` function instead of outputting to console.

Specifies whether to enable debug messages.

## Changelog

0.1.0:
- Initial release

## License
MIT
