function add_friend_request(reader_message, db, low_id) {
  const { Helpers } = require('../../../utils/helpers');
  const { FriendListMessage } = require('../server/friendListMessage');
  const { FriendListUpdateMessage } = require('../server/friendListUpdateMessage');

  const player = reader_message.player;
  const client = reader_message.client;

  if (low_id === player.ID || !low_id) {
    new FriendListMessage(client, player, db).send();
    return;
  }

  if (player.friends.some((f) => f['id'] === low_id)) {
    new FriendListMessage(client, player, db).send();
    return;
  }

  player.friends.push({ id: low_id, state: 2 });
  db.update_player_account(player.token, 'Friends', player.friends);

  const target = db.load_player_account_by_id(low_id);
  if (target) {
    const target_friends = target['Friends'];
    if (!target_friends.some((f) => f['id'] === player.ID)) {
      target_friends.push({ id: player.ID, state: 3 });
      db.update_player_account(target['Token'], 'Friends', target_friends);
    }

    const entry = Helpers.connected_clients['Clients'][String(low_id)];
    if (entry) {
      try {
        new FriendListUpdateMessage(entry['SocketInfo'], entry['Player'], db, player.ID, 3).send();
      } catch (e) {
        // pass
      }
    }
  }

  new FriendListMessage(client, player, db).send();
}

module.exports = { add_friend_request };