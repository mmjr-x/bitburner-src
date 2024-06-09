# Myrian

Myrian is the name of the OS that the BitNodes run on. Eventually you'll unlock the mechanic by going to the glitch in Ishima and "breaking partially free" of the BN.

By gaining access to the OS directly you can start to break it apart by generating vulnerabilities (vulns).
You do so by interracting with the various devices in the OS, represented by a grid.

## Devices

### Bus

The most important device is the Bus. Here's a few of the things it can do:

- move, only 1 tile at a time and that tile must be empty. No diagonal.
- transfer content, most entity can store items called components, bus are the only device that can transfer components to and from other devices
- use other devices, certain devices can be used.

Performing any action makes all devices involved "busy". If a Bus is transfering content between itself and a cache (chest), they both become busy until the operation finishes.

Contrary to every other mechanic in the game. Async functions using myrian functions CAN run simultenaously.

### ISocket

These devices produce basic components that can be used for other devices, [r0, y0, b0]. They must be picked up by busses and will eventually produce another one after a certain cooldown has passed.

### OSocket

These devices request components and produce vulns in return, a bus simply needs to transfer a component into a OSocket content in order to fulfill the request

### Reducer

These devices can be used by a bus, when being used they will first check their content, if the content matches one of the recipe they will take some time to consume their content in order to produce a new, upgraded, more valuable component, e.g. r0 + r0 => r1

### Cache

These devices act as storage for components.

### Lock

These devices cannot be installed. They appear after various conditions are fulfilled in order to block certain tiles.

## Installing

Bus can install new devices, when they do so a lock will appear over the tile that will eventually become the device. The cost of any device depends on the number of that type of device currently in the OS.

### Uninstalling

A bus can remove a device, there is no refund.

## Tiers

Currently 2 devices have tiers, reducers and OSockets.

Upgrading a reducer allows it to reduce components of a higher tier and ONLY that higher tier. A tier 2 reducer can only tier 2 components like r1 + r1 => r2 and loses access to r0 + r0 => r1

Upgrading a OSocket allows it to request higher tier components (as well as more components at a time).