/**
 * CLUB WAR  (24776) — the club-wars screen (sent at login when the feature is
 * on). Declares the club's war map (single map, LocationID 1 default) with its
 * node-state/timer fields; the trailing empty loop keeps the layout honest.
 */

const { ServerMessage } = require('./serverMessage');

class AllianceWarMessage extends ServerMessage {
  constructor(client, player) {
    super(client, player);
    this.id = 24776;
  }

  encode() {
    this.writeLong(this.player.club_id);
    this.writeVInt(0);

    const clubMaps = [{ LocationID: 1 }];
    this.writeVInt(clubMaps.length);
    for (const map of clubMaps) {
      this.writeVInt(0);
      this.writeVInt(map['Index'] !== undefined ? map['Index'] : 1);
      this.writeVInt(0);
      this.writeVInt(map['SpriteID'] !== undefined ? map['SpriteID'] : 1);
      this.writeDataReference(15, map['LocationID']);
      this.writeVInt(map['NodeState'] !== undefined ? map['NodeState'] : 0);
      this.writeVInt(map['Timer'] !== undefined ? map['Timer'] : 0);
      this.writeVInt(0);

      this.writeArrayVint(map['Modifiers'] !== undefined ? map['Modifiers'] : []);
    }

    this.writeVInt(0);
    for (let x = 0; x < 0; x++) {
      this.writeVInt(x !== 3 ? x + 1 : 1);
      this.writeVInt(x);
    }
  }
}

module.exports = { AllianceWarMessage };