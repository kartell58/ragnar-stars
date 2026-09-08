/**
 * Event feed blob appended to OwnHomeData (the rotating game modes row). The
 * client first gets a list of +1..24 slot ids, then each configured event from
 * config/events.json with its location, token reward and modifiers. Field
 * order is byte-for-byte stable — edit config/events.json, never this layout.
 */

const fs = require('node:fs');
const { rootPath } = require('../../utils/paths');

class LogicEventData {
  static encode(byteStream) {
    const events = JSON.parse(fs.readFileSync(rootPath('config/events.json'), 'utf-8'));

    byteStream.writeVInt(24);
    for (let i = 0; i < 24; i++) byteStream.writeVInt(i + 1);

    byteStream.writeVInt(events.length);
    for (const event of events) {
      byteStream.writeVInt(0);
      byteStream.writeVInt(event['Index'] !== undefined ? event['Index'] : 1);
      byteStream.writeVInt(event['NewEventTimer'] !== undefined ? event['NewEventTimer'] : 0);
      byteStream.writeVInt(event['Timer'] !== undefined ? event['Timer'] : 0);
      byteStream.writeVInt(event['TokenReward'] !== undefined ? event['TokenReward'] : 0);
      byteStream.writeDataReference(15, event['LocationID'] !== undefined ? event['LocationID'] : 0);
      byteStream.writeVInt(event['Status'] !== undefined ? event['Status'] : 2);
      byteStream.writeString(event['TextEntry'] !== undefined ? event['TextEntry'] : null);
      byteStream.writeVInt(0);
      byteStream.writeVInt(0);
      byteStream.writeVInt(0);
      byteStream.writeArrayVint(event['Modifiers'] !== undefined ? event['Modifiers'] : []);
      byteStream.writeVInt(0);
      byteStream.writeVInt(event['ChallengeType'] !== undefined ? event['ChallengeType'] : 0);
    }

    byteStream.writeVInt(0);
  }
}

module.exports = { LogicEventData };