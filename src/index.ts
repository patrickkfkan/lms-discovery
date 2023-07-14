import dgram from 'dgram';
import deepEqual from 'deep-equal';
import EventEmitter from 'events';
import { Telnet } from 'telnet-client';

const DISCOVER_MSG = 'eIPAD\0NAME\0VERS\0UUID\0JSON\0CLIP\0';
const BROADCAST_PORT = 3483;

const DISCOVERY_RESPONSE_PARAM_MAP: Record<string, keyof ServerInfo> = {
  'IPAD': 'ip',
  'NAME': 'name',
  'VERS': 'ver',
  'UUID': 'uuid',
  'JSON': 'jsonPort',
  'CLIP': 'cliPort'
};

export interface DiscoveryOptions {
  /**
   * Network address used to transmit discovery requests.
   * @default '255.255.255.255'
   */
  broadcastAddress?: string;
  /**
   * How long in milliseconds to wait for a discovered server to respond to a
   * subsqeuent discovery request before it is presumed lost. Only applicable
   * for servers that do not advertise `cliPort`.
   * @default 60000 (60 seconds)
   */
  discoveredTTL?: number;
  /**
   * How often in milliseconds to broadcast discovery requests.
   * @default 30000 (30 seconds)
   */
  discoverInterval?: number;
}

/**
 * Server information
 */
export interface ServerInfo {
  ip: string,
  name: string,
  ver: string | undefined,
  uuid: string,
  jsonPort: string,
  cliPort: string | undefined;
}

const DEFAULT_OPTS: Required<DiscoveryOptions> = {
  broadcastAddress: '255.255.255.255',
  discoveredTTL: 60000,
  discoverInterval: 30000
};

export class LMSDiscovery extends EventEmitter {

  #opts: Required<DiscoveryOptions>;
  #discovered: Record<ServerInfo['ip'], ServerInfo>;
  #discoveredTTLTimers: Record<ServerInfo['ip'], NodeJS.Timeout>;
  #cliConnections: Record<ServerInfo['ip'], Telnet>;
  #discoverIntervalTimer: NodeJS.Timeout | null;
  #socket: dgram.Socket | null;
  #debug: {
    enabled: boolean;
    callback: ((msg: string) => void) | null;
  };

  constructor() {
    super();
    this.#debug = {
      enabled: false,
      callback: null
    };
    this.#discovered = {};
    this.#discoveredTTLTimers = {};
    this.#cliConnections = {};
  }

  /**
   * Starts the discovery service.
   * @param opts
   */
  start(opts?: DiscoveryOptions) {
    if (this.getStatus() === 'running') {
      this.#debugLog('Error: cannot call start() on service that is already running');
      throw Error('Discovery service is already running');
    }
    this.#opts = {
      ...DEFAULT_OPTS,
      ...(opts || {})
    };
    if (this.#opts.discoveredTTL <= this.#opts.discoverInterval) {
      this.#debugLog('Error: discoveredTTL must be larger than discoverInterval');
      throw Error(`Invalid option values: discoveredTTL (${this.#opts.discoveredTTL}) <= discoverInterval (${this.#opts.discoverInterval})`);
    }
    this.#debugLog(`Starting discovery service with options ${JSON.stringify(this.#opts)}...`);
    this.#initSocket();
    this.#debugLog('Service started');
    this.#sendDiscoveryRequest();
    this.#debugLog(`Going to send discovery requests at intervals of ${this.#opts.discoverInterval}ms`);
    this.#discoverIntervalTimer = setInterval(() => this.#sendDiscoveryRequest(), this.#opts.discoverInterval);
  }

  /**
   *
   * @returns Stops the discovery service.
   */
  stop() {
    if (this.getStatus() !== 'running') {
      this.#debugLog('stop(): service already stopped');
      return;
    }
    this.#debugLog('Stopping discovery service...');
    if (this.#discoverIntervalTimer) {
      clearInterval(this.#discoverIntervalTimer);
      this.#discoverIntervalTimer = null;
    }
    Object.values(this.#discoveredTTLTimers).forEach((timer) => {
      clearTimeout(timer);
    });
    this.#discoveredTTLTimers = {};
    Object.values(this.#cliConnections).forEach((connection) => {
      connection.removeAllListeners('close');
      connection.end();
    });
    this.#cliConnections = {};
    this.#discovered = {};
    if (this.#socket) {
      this.#socket.close(() => {
        this.#debugLog('Service stopped');
      });
    }
  }

  /**
   * Returns all servers discovered so far.
   * @returns
   */
  getAllDiscovered() {
    return Object.values(this.#discovered);
  }

  /**
   * Returns status of the discovery service.
   * @returns
   */
  getStatus() {
    return this.#socket ? 'running' : 'stop';
  }

  /**
   * Whether to enable debug messages.
   * @param enabled
   * @param callback If specified, passes debug messages to `callback`; otherwise, output to console.
   */
  setDebug(enabled?: boolean, callback: ((msg: string) => void) | null = null) {
    this.#debug = {
      enabled: !!enabled,
      callback
    };
  }

  #initSocket() {
    this.#debugLog('Initializing socket...');
    const socket = this.#socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });

    socket.on('listening', () => {
      const addr = socket.address();
      this.#debugLog(`Socket listening on ${addr.address}:${addr.port}`);
      socket.setBroadcast(true);
    });

    socket.on('error', (err) => {
      this.#debugLog(`Socket error: ${err.message || err}`);
      this.emit('error', err);
    });

    socket.on('close', () => {
      this.#debugLog('Socket closed');
      this.#socket = null;
    });

    socket.on('message', async (data, rinfo) => {
      this.#debugLog(`Message received from ${rinfo.address}`);
      const server = this.#parseDiscoveryResponse(data, rinfo);
      if (!server) {
        return;
      }
      this.#debugLog(`Discovery response parsed: ${JSON.stringify(server)}`);
      const existing = this.#findDiscoveredByIP(server.ip) || this.#findDiscoveredByUUID(server.uuid);

      if (this.#discoveredTTLTimers[server.ip]) {
        clearTimeout(this.#discoveredTTLTimers[server.ip]);
        delete this.#discoveredTTLTimers[server.ip];
      }

      this.#discovered[server.ip] = server;

      /**
       * Establish telnet connection with servers that advertise cliPort,
       * so we can emit server lost event immediately on disconnect.
       */
      let cliConnected = !!this.#cliConnections[server.ip];
      if (!cliConnected && server.cliPort) {
        const cliConnection = new Telnet();
        cliConnection.on('close', this.#handleCLIDisconnected.bind(this, server));
        const connectParams = {
          host: server.ip,
          port: server.cliPort,
          negotiationMandatory: false,
          timeout: 1500,
          irs: '\n'
        };
        try {
          await cliConnection.connect(connectParams);
          this.#cliConnections[server.ip] = cliConnection;
          this.#debugLog(`Established connection to ${server.ip}:${server.cliPort}`);
          cliConnected = true;
        }
        catch (error) {
          this.#debugLog(`Failed to connect to ${server.ip}:${server.cliPort}: ${error}`);
        }
      }
      /**
       * For servers that do not advertise cliPort, or if connection to cliPort failed,
       * we would have to rely on TTL timers.
       */
      if (!cliConnected) {
        this.#discoveredTTLTimers[server.ip] = setTimeout(() => {
          delete this.#discovered[server.ip];
          delete this.#discoveredTTLTimers[server.ip];
          this.#debugLog(`Detected lost server: ${JSON.stringify(server)}. Emitting 'lost' event...`);
          this.emit('lost', server);
        }, this.#opts.discoveredTTL);
      }

      if (!existing) { // Newly-discovered
        this.#debugLog('This is a newly-discovered server. Emitting \'discovered\' event...');
        this.emit('discovered', server);
      }
      else if (!deepEqual(existing, server)) {
        // A server with same IP or UUID already discovered, but its info has changed
        this.#debugLog('A server with the same IP or UUID already discovered, but its info has changed. Emitting \'lost\' + \'discovered\' events...');
        this.emit('lost', existing);
        this.emit('discovered', server);
      }
      else {
        this.#debugLog('Server already discovered - not going to emit event');
      }
    });
  }

  #handleCLIDisconnected(server: ServerInfo) {
    const cliConnection = this.#cliConnections[server.ip];
    if (cliConnection) {
      cliConnection.removeAllListeners('close');
    }
    delete this.#cliConnections[server.ip];
    delete this.#discovered[server.ip];
    this.#debugLog(`Disconnected from server: ${JSON.stringify(server)}. Emitting 'lost' event...`);
    this.emit('lost', server);
  }

  #findDiscoveredByIP(ip: string) {
    return this.#discovered[ip] || null;
  }

  #findDiscoveredByUUID(uuid: string) {
    return Object.values(this.#discovered).find((server) => server.uuid === uuid) || null;
  }

  #sendDiscoveryRequest() {
    if (!this.#socket) {
      return;
    }
    this.#debugLog(`Sending discovery request to ${this.#opts.broadcastAddress}:${BROADCAST_PORT}...`);
    this.#socket.send(Buffer.from(DISCOVER_MSG),
      0,
      DISCOVER_MSG.length,
      BROADCAST_PORT,
      this.#opts.broadcastAddress,
      (err) => {
        if (err) {
          this.#debugLog(`Error in sending discovery request: ${err.message}`);
          this.emit('error', err);
        }
      }
    );
  }

  #parseDiscoveryResponse(data: Buffer, rinfo: dgram.RemoteInfo): ServerInfo | null {
    const msgType = String.fromCharCode(data[0]);
    if (msgType !== 'E') { // Not a discovery response
      this.#debugLog('Message is not a discovery response');
      return null;
    }

    const parsed: Partial<Record<keyof ServerInfo, string>> = {
      ip: rinfo.address
    };

    // https://github.com/Logitech/squeezeplay/blob/49f41e48311ade3a4a879b4b27283036363724b5/src/squeezeplay/share/applets/SlimDiscovery/SlimDiscoveryApplet.lua#L82
    let ptr = 1;
    while (ptr <= data.length - 5) {
      const t = data.subarray(ptr, ptr + 4).toString(); // Param name
      const l = Number(data[ptr + 4]); // Param value length
      const v = data.subarray(ptr + 5, ptr + 5 + l).toString(); // Param value
      if (DISCOVERY_RESPONSE_PARAM_MAP[t]) {
        parsed[DISCOVERY_RESPONSE_PARAM_MAP[t]] = v;
      }
      ptr += 5 + l;
    }

    if (parsed.ip && parsed.name && parsed.jsonPort) {
      return {
        ip: parsed.ip,
        name: parsed.name,
        ver: parsed.ver,
        uuid: parsed.uuid || parsed.name,
        jsonPort: parsed.jsonPort,
        cliPort: parsed.cliPort
      };
    }

    const missing = [];
    if (!parsed.ip) missing.push('ip');
    if (!parsed.name) missing.push('name');
    if (!parsed.jsonPort) missing.push('jsonPort');
    this.#debugLog(`Message is discovery response but missing required info: ${missing.join(', ')}`);

    return null;
  }

  #debugLog(msg: string) {
    if (this.#debug.enabled) {
      if (this.#debug.callback) {
        this.#debug.callback(msg);
      }
      else {
        console.log(msg);
      }
    }
  }

  /**
   * @event
   * Server discovered.
   * @param event
   * @param listener
   */
  on(event: 'discovered', listener: (server: ServerInfo) => void): this;
  /**
   * @event
   * Server lost.
   * @param event
   * @param listener
   */
  on(event: 'lost', listener: (server: ServerInfo) => void): this;
  /**
   * @event
   * An error occurred.
   * @param event
   * @param listener
   */
  on(event: 'error', listener: (error: any) => void): this;
  on(event: string | symbol, listener: (...args: any[]) => void): this {
    return super.on(event, listener);
  }
}

export default new LMSDiscovery();
