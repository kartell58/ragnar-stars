/**
 * Device dashboard for the player being served. Populated at login with the
 * fingerprint the client reports (Android ID, model, OpenUDID, OS version,
 * language); SendData() just writes raw bytes straight to the underlying
 * socket (used before a full message wrapper exists).
 */

class Device {
  constructor(socket) {
    this.AndroidID = null;
    this.DeviveModel = null;
    this.OpenUDID = null;
    this.OSVersion = null;
    this.isAndroid = false;
    this.Language = null;
    this.socket = socket;
  }

  SendData(data) {
    this.socket.send(data);
  }
}

module.exports = { Device };