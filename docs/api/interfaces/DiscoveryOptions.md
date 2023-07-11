[lms-discovery](../README.md) / DiscoveryOptions

# Interface: DiscoveryOptions

## Table of contents

### Properties

- [broadcastAddress](DiscoveryOptions.md#broadcastaddress)
- [discoverInterval](DiscoveryOptions.md#discoverinterval)
- [discoveredTTL](DiscoveryOptions.md#discoveredttl)

## Properties

### broadcastAddress

• `Optional` **broadcastAddress**: `string`

Network address used to transmit discovery requests.

**`Default`**

```ts
'255.255.255.255'
```

#### Defined in

index.ts:22

___

### discoverInterval

• `Optional` **discoverInterval**: `number`

How often in milliseconds to broadcast discovery requests.

**`Default`**

```ts
30000 (30 seconds)
```

#### Defined in

index.ts:33

___

### discoveredTTL

• `Optional` **discoveredTTL**: `number`

How long in milliseconds to wait for a discovered server to respond to a
subsqeuent discovery request before it is presumed lost.

**`Default`**

```ts
60000 (60 seconds)
```

#### Defined in

index.ts:28
