/**
 * In-memory room registry (teams/parties). A room holds a set of player ids
 * plus arbitrary meta (map/mode). Rooms are created lazily on join() (or
 * auto-named), searched linearly to find a player, and deleted when the last
 * member leaves. Exposed to handlers through ctx.rooms by the router.
 */

class RoomRegistry {
  constructor() {
    this.rooms = new Map();
    this.nextId = 1;
  }

  _ensure(roomId) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, { id: roomId, players: new Map(), meta: {} });
    }
    return this.rooms.get(roomId);
  }

  join(playerId, roomId, meta = {}) {
    if (!playerId) return null;
    if (!roomId) roomId = `room-${this.nextId++}`;
    const room = this._ensure(roomId);
    room.players.set(String(playerId), { id: playerId, joinedAt: Date.now() });
    room.meta = { ...room.meta, ...meta };
    return room;
  }

  find(playerId) {
    for (const room of this.rooms.values()) {
      if (room.players.has(String(playerId))) return room;
    }
    return null;
  }

  leave(playerId) {
    const room = this.find(playerId);
    if (!room) return null;
    room.players.delete(String(playerId));
    if (room.players.size === 0) {
      this.rooms.delete(room.id);
      return null;
    }
    return room;
  }

  forEach(fn) {
    for (const room of this.rooms.values()) fn(room);
  }

  list() {
    return [...this.rooms.values()].map((r) => ({
      id: r.id,
      members: [...r.players.keys()].map(Number),
      meta: r.meta,
    }));
  }
}

module.exports = { RoomRegistry };