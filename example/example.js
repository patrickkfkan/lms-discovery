const discovery = require('../');

discovery.on('discovered', (server) => {
  console.log('New server discovered:', server);
});

discovery.on('lost', (server) => {
  console.log('Previously-discovered server lost:', server);
});

// Uncomment following block to enable debug messages
/*
discovery.setDebug(true, (msg) => {
    console.log('[lms-discovery::DEBUG] ' + msg);
});
*/

const opts = {
  discoveredTTL: 40000 // Override default 60000
};

discovery.start(opts);

const countTimer = setInterval(() => {
  console.log(`[lms-discovery] Servers discovered so far: ${discovery.getAllDiscovered().length}`);
}, 10000);

process.on('SIGINT', () => {
  clearInterval(countTimer);
  discovery.stop();
  console.log('[lms-discovery] Discovery service stopped');
});
