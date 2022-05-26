const dgram = require('dgram');
const EventEmitter = require('eventemitter3');
const deepEqual = require('deep-equal');
const { parseDiscoveryResponse } = require('./parser');

const DISCOVER_MSG = 'eIPAD\0NAME\0VERS\0\UUID\0JSON\0CLIP\0';
const BROADCAST_PORT = 3483;
const DEFAULT_OPTS = {
  broadcastAddress: '255.255.255.255',
  discoveredTTL: 60000,
  discoverInterval: 30000
};

let discovered = {}; // key: server IP; value: server info
let discoveredTTLTimers = {};
let discoverIntervalTimer = null;
let socket = null;
let debug = {
  enabled: false,
  callback: null
};
const eventEmitter = new EventEmitter();

function initSocket(opts) {
  debugLog(`Initializing socket...`);
  socket = dgram.createSocket({type: "udp4", reuseAddr: true});

  socket.on("listening", () => {
    const addr = socket.address();
    debugLog(`Socket listening on ${addr.address}:${addr.port}`);
    socket.setBroadcast(true);
  });
  
  socket.on('error', (err) => {
    debugLog(`Socket error: ${err.message || err}`);
    eventEmitter.emit('error', err);
  });

  socket.on('close', () => {
    debugLog(`Socket closed`);
    socket = null;
  });
  
  socket.on("message", (data, rinfo) => {
    debugLog(`Message received from ${rinfo.address}`);
    const server = parseDiscoveryResponse(data, rinfo);
    if (!server) {
      debugLog(`Message ignored since it is not a discovery response`);
      return;
    }
    debugLog(`Discovery response parsed: ${JSON.stringify(server)}`);
    const existing = findDiscoveredByIP(server.ip) || findDiscoveredByUUID(server.uuid);
  
    if (discoveredTTLTimers[server.ip]) {
      clearTimeout(discoveredTTLTimers[server.ip]);
      delete discoveredTTLTimers[server.ip];
    }
  
    discovered[server.ip] = server;
  
    discoveredTTLTimers[server.ip] = setTimeout(() => {
      delete discovered[server.ip];
      delete discoveredTTLTimers[server.ip];
      debugLog(`Detected lost server: ${JSON.stringify(server)}. Emitting 'lost' event...`);
      eventEmitter.emit('lost', server);
    }, opts.discoveredTTL);
  
    if (!existing) { // newly-discovered
      debugLog(`This is a newly-discovered server. Emitting 'discovered' event...`);
      eventEmitter.emit('discovered', server);
    }
    else if (!deepEqual(existing, server)) {
      // A server with same IP or UUID already discovered, but its info has changed
      debugLog(`A server with the same IP or UUID already discovered, but its info has changed. Emitting 'lost' + 'discovered' events...`);
      eventEmitter.emit('lost', existing);
      eventEmitter.emit('discovered', server);
    }
    else {
      debugLog(`Server already discovered - not going to emit event`);
    }
  });
}

function findDiscoveredByIP(ip) {
  return discovered[ip] || null;
}

function findDiscoveredByUUID(uuid) {
  return Object.entries(discovered).find(d => d.uuid === uuid) || null;
}

function sendDiscoveryRequest(opts) {
  debugLog(`Sending discovery request to ${opts.broadcastAddress}:${BROADCAST_PORT}...`);
  socket.send(Buffer.from(DISCOVER_MSG),
    0,
    DISCOVER_MSG.length,
    BROADCAST_PORT,
    opts.broadcastAddress,
    (err) => {
      if (err) {
        debugLog(`Error in sending discovery request: ${err.message || err}`);
        eventEmitter.emit('error', err);
      }
    }
  );
}

function start(options = {}) {
  if (getStatus() === 'running') {
    debugLog(`Error: cannot call start() on service that is already running`);
    throw new Error('Discovery service is already running');
  }
  const opts = {...DEFAULT_OPTS, ...options};
  if (opts.discoveredTTL <= opts.discoverInterval) {
    debugLog(`Error: discoveredTTL must be larger than discoverInterval`);
    throw new Error(`Invalid option values: discoveredTTL (${opts.discoveredTTL}) <= discoverInterval (${opts.discoverInterval})`);
  }
  debugLog(`Starting discovery service with options ${JSON.stringify(opts)}...`);
  initSocket(opts);
  debugLog(`Service started`);
  sendDiscoveryRequest(opts);
  debugLog(`Going to send discovery requests at intervals of ${opts.discoverInterval}ms`);
  discoverIntervalTimer = setInterval(() => sendDiscoveryRequest(opts), opts.discoverInterval);
}

function stop() {
  if (getStatus() !== 'running') {
    debugLog(`stop(): service already stopped`);
    return;
  }
  debugLog(`Stopping discovery service...`);
  if (discoverIntervalTimer) {
    clearInterval(discoverIntervalTimer);
    discoverIntervalTimer = null;
  }
  Object.values(discoveredTTLTimers).forEach((timer) => {
    clearTimeout(timer);
  });
  discoveredTTLTimers = {};
  discovered = {};
  socket.close(() => {
    debugLog(`Service stopped`);
  });
}

function getStatus() {
  return socket !== null ? 'running' : 'stop';
}

function getAllDiscovered() {
  return Object.values(discovered);
}

function setDebug(enabled, callback = null) {
  debug = {
    enabled: enabled ? true : false,
    callback
  };
}

function on(event, listener) {
  eventEmitter.on(event, listener);
}

function off(event, listener) {
  eventEmitter.off(event, listener);
}

function once(event, listener) {
  eventEmitter.once(event, listener);
}

function debugLog(msg) {
  if (debug.enabled) {
    if (debug.callback && typeof debug.callback === 'function') {
      debug.callback(msg);
    }
    else {
      console.log(msg);
    }
  }
}

module.exports = {
  start,
  stop,
  getStatus,
  getAllDiscovered,
  setDebug,
  on,
  off,
  once
};
