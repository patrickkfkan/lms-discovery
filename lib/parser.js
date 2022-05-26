const PROP_MAP = {
  'IPAD': 'ip',
  'NAME': 'name',
  'VERS': 'ver',
  'UUID': 'uuid',
  'JSON': 'jsonPort',
  'CLIP': 'cliPort'
};

function parseDiscoveryResponse(data, rinfo) {
  const msgType = String.fromCharCode(data[0]);
  if (msgType !== 'E') { // not a discovery response
    return null;
  }

  const result = {
    ip: rinfo.address
  };

  // https://github.com/Logitech/squeezeplay/blob/49f41e48311ade3a4a879b4b27283036363724b5/src/squeezeplay/share/applets/SlimDiscovery/SlimDiscoveryApplet.lua#L82
  let ptr = 1;
  while (ptr <= data.length - 5) {
    const t = data.subarray(ptr, ptr + 4).toString(); // prop
    const l = data[ptr + 4]; // prop value length
    const v = data.subarray(ptr + 5, ptr + 5 + l).toString(); // prop value
    if (PROP_MAP[t]) {
      result[PROP_MAP[t]] = v;
    }
    ptr = ptr + 5 + l;
  }

  return result;
}

module.exports = {
  parseDiscoveryResponse
};
