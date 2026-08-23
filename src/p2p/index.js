'use strict'

const Room = require('./room')

let active = null

async function join(topic) {
  if (active !== null) await active.leave()
  active = new Room()
  await active.join(topic)
  return active
}

function send(bytes) {
  if (active === null) throw new Error('not joined to a topic')
  return active.send(bytes)
}

async function flush() {
  if (active === null) return false
  return active.flush()
}

function onMessage(fn) {
  if (active === null) throw new Error('not joined to a topic')
  return active.onMessage(fn)
}

function on(event, fn) {
  if (active === null) throw new Error('not joined to a topic')
  const room = active
  room.on(event, fn)
  return () => room.off(event, fn)
}

async function leave() {
  if (active === null) return
  const room = active
  active = null
  await room.leave()
}

function status() {
  return active !== null
    ? active.status()
    : { joined: false, topic: null, peers: 0, connecting: 0 }
}

function getRoom() {
  return active
}

module.exports = {
  // Hyperswarm never delivers a sender its own writes.
  loopsBack: false,
  join,
  send,
  flush,
  onMessage,
  on,
  leave,
  status,
  getRoom,
  Room
}
