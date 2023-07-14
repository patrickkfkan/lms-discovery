[lms-discovery](../README.md) / LMSDiscovery

# Class: LMSDiscovery

## Hierarchy

- `EventEmitter`

  ↳ **`LMSDiscovery`**

## Table of contents

### Constructors

- [constructor](LMSDiscovery.md#constructor)

### Methods

- [getAllDiscovered](LMSDiscovery.md#getalldiscovered)
- [getStatus](LMSDiscovery.md#getstatus)
- [setDebug](LMSDiscovery.md#setdebug)
- [start](LMSDiscovery.md#start)
- [stop](LMSDiscovery.md#stop)

### Events

- [on](LMSDiscovery.md#on)

## Constructors

### constructor

• **new LMSDiscovery**()

#### Overrides

EventEmitter.constructor

#### Defined in

[index.ts:69](https://github.com/patrickkfkan/lms-discovery/blob/f60a407/src/index.ts#L69)

## Methods

### getAllDiscovered

▸ **getAllDiscovered**(): [`ServerInfo`](../interfaces/ServerInfo.md)[]

Returns all servers discovered so far.

#### Returns

[`ServerInfo`](../interfaces/ServerInfo.md)[]

#### Defined in

[index.ts:140](https://github.com/patrickkfkan/lms-discovery/blob/f60a407/src/index.ts#L140)

___

### getStatus

▸ **getStatus**(): ``"stop"`` \| ``"running"``

Returns status of the discovery service.

#### Returns

``"stop"`` \| ``"running"``

#### Defined in

[index.ts:148](https://github.com/patrickkfkan/lms-discovery/blob/f60a407/src/index.ts#L148)

___

### setDebug

▸ **setDebug**(`enabled?`, `callback?`): `void`

Whether to enable debug messages.

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `enabled?` | `boolean` | `undefined` |  |
| `callback` | ``null`` \| (`msg`: `string`) => `void` | `null` | If specified, passes debug messages to `callback`; otherwise, output to console. |

#### Returns

`void`

#### Defined in

[index.ts:157](https://github.com/patrickkfkan/lms-discovery/blob/f60a407/src/index.ts#L157)

___

### start

▸ **start**(`opts?`): `void`

Starts the discovery service.

#### Parameters

| Name | Type |
| :------ | :------ |
| `opts?` | [`DiscoveryOptions`](../interfaces/DiscoveryOptions.md) |

#### Returns

`void`

#### Defined in

[index.ts:84](https://github.com/patrickkfkan/lms-discovery/blob/f60a407/src/index.ts#L84)

___

### stop

▸ **stop**(): `void`

#### Returns

`void`

Stops the discovery service.

#### Defined in

[index.ts:109](https://github.com/patrickkfkan/lms-discovery/blob/f60a407/src/index.ts#L109)

## Events

### on

▸ **on**(`event`, `listener`): [`LMSDiscovery`](LMSDiscovery.md)

Server discovered.

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"discovered"`` |
| `listener` | (`server`: [`ServerInfo`](../interfaces/ServerInfo.md)) => `void` |

#### Returns

[`LMSDiscovery`](LMSDiscovery.md)

#### Overrides

EventEmitter.on

#### Defined in

[index.ts:352](https://github.com/patrickkfkan/lms-discovery/blob/f60a407/src/index.ts#L352)

▸ **on**(`event`, `listener`): [`LMSDiscovery`](LMSDiscovery.md)

Server lost.

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"lost"`` |
| `listener` | (`server`: [`ServerInfo`](../interfaces/ServerInfo.md)) => `void` |

#### Returns

[`LMSDiscovery`](LMSDiscovery.md)

#### Overrides

EventEmitter.on

#### Defined in

[index.ts:359](https://github.com/patrickkfkan/lms-discovery/blob/f60a407/src/index.ts#L359)

▸ **on**(`event`, `listener`): [`LMSDiscovery`](LMSDiscovery.md)

An error occurred.

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"error"`` |
| `listener` | (`error`: `any`) => `void` |

#### Returns

[`LMSDiscovery`](LMSDiscovery.md)

#### Overrides

EventEmitter.on

#### Defined in

[index.ts:366](https://github.com/patrickkfkan/lms-discovery/blob/f60a407/src/index.ts#L366)
