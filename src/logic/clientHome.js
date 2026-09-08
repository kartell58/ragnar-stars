const { LogicDailyData } = require('./home/logicDailyData');
const { LogicConfData } = require('./home/logicConfData');

class LogicClientHome {
  static encode(writer) {
    LogicDailyData.encode(writer);
    LogicConfData.encode(writer);

    writer.writeLong(writer.player.ID);

    writer.writeVInt(0); // Unknown Array
    for (let x = 0; x < 0; x++) {
      // pass
    }

    writer.writeVInt(0); // Unknown

    writer.writeUInt8(0); // Unknown
  }
}

module.exports = { LogicClientHome };