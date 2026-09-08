/**
 * Client->server packet registry (4-digit ids, keyed exactly as captured from
 * the original server/APK).
 *
 * Every value here is a *client* message class from messages/client/; dispatch
 * instantiates `new packets[frame.packet_id](client, player, payload)`. Asymmetry:
 * server->client messages do NOT live in this map — each one sets `this.id` on
 * the class itself and is built directly by a handler when replying.
 *
 * Id families seen on the wire:
 *   101xx  login/keepalive     143xx  teams + clubs   105xx  friends
 *   102xx  name/social         144xx  stats/leaders   146xx  name checks
 *   141xx  game session        18686  supported creator
 *
 * To add a packet (rule in AGENTS.md): write the class (decode + process),
 * require it below, register it under its real id. packets-smoke asserts both
 * lifecycle methods exist.
 */

const { LoginMessage } = require('./messages/client/loginMessage');
const { KeepAliveMessage } = require('./messages/client/keepAliveMessage');
const { ClientCapabilitiesMessage } = require('./messages/client/clientCapabilitiesMessage');
const { SetNameMessage } = require('./messages/client/setNameMessage');
const { EndClientTurnMessage } = require('./messages/client/endClientTurnMessage');
const { TeamCreateMessage } = require('./messages/client/teamCreateMessage');
const { TeamLeaveMessage } = require('./messages/client/teamLeaveMessage');
const { TeamChangeMemberSettingsMessage } = require('./messages/client/teamChangeMemberSettingsMessage');
const { TeamToggleSettingsMessage } = require('./messages/client/teamToggleSettingsMessage');
const { TeamSetLocationMessage } = require('./messages/client/teamSetLocationMessage');
const { GoHomeFromOfflinePractiseMessage } = require('./messages/client/goHomeFromOfflinePractiseMessage');
const { StartGameMessage } = require('./messages/client/startGameMessage');
const { GetPlayerProfileMessage } = require('./messages/client/getPlayerProfileMessage');
const { GetLeaderboardMessage } = require('./messages/client/getLeaderboardMessage');
const { SetSupportedCreatorMessage } = require('./messages/client/setSupportedCreatorMessage');
const { AskForBattleEndMessage } = require('./messages/client/askForBattleEndMessage');
const { AvatarNameCheckRequestMessage } = require('./messages/client/avatarNameCheckRequestMessage');
const { CreateAllianceMessage } = require('./messages/client/createAllianceMessage');
const { AskForAllianceDataMessage } = require('./messages/client/askForAllianceDataMessage');
const { ChangeAllianceSettingsMessage } = require('./messages/client/changeAllianceSettingsMessage');
const { JoinAllianceMessage } = require('./messages/client/joinAllianceMessage');
const { AskForJoinableAlliancesListMessage } = require('./messages/client/askForJoinableAlliancesListMessage');
const { LeaveAllianceMessage } = require('./messages/client/leaveAllianceMessage');
const { SearchAlliancesMessage } = require('./messages/client/searchAlliancesMessage');
const { ChatToAllianceStreamMessage } = require('./messages/client/chatToAllianceStreamMessage');
const { PlayerStatusMessage } = require('./messages/client/playerStatusMessage');
const { AcceptFriendMessage } = require('./messages/client/acceptFriendMessage');
const { AddFriendMessage } = require('./messages/client/addFriendMessage');
const { AskForFriendListMessage } = require('./messages/client/askForFriendListMessage');
const { SendClubFriendMessage } = require('./messages/client/sendClubFriendMessage');
const { TeamInviteMessage } = require('./messages/client/teamInviteMessage');
const { TeamInvitationResponseMessage } = require('./messages/client/teamInvitationResponseMessage');

const packets = {
  10101: LoginMessage,
  14103: StartGameMessage,
  10108: KeepAliveMessage,
  10107: ClientCapabilitiesMessage,
  10212: SetNameMessage,
  14102: EndClientTurnMessage,
  14109: GoHomeFromOfflinePractiseMessage,
  14110: AskForBattleEndMessage,
  14113: GetPlayerProfileMessage,
  14301: CreateAllianceMessage,
  14302: AskForAllianceDataMessage,
  14303: AskForJoinableAlliancesListMessage,
  14305: JoinAllianceMessage,
  14308: LeaveAllianceMessage,
  14315: ChatToAllianceStreamMessage,
  14316: ChangeAllianceSettingsMessage,
  14324: SearchAlliancesMessage,
  14350: TeamCreateMessage,
  14353: TeamLeaveMessage,
  14354: TeamChangeMemberSettingsMessage,
  14363: TeamSetLocationMessage,
  14372: TeamToggleSettingsMessage,
  14403: GetLeaderboardMessage,
  14600: AvatarNameCheckRequestMessage,
  18686: SetSupportedCreatorMessage,
  14366: PlayerStatusMessage,
  10501: AcceptFriendMessage,
  10502: AddFriendMessage,
  10504: AskForFriendListMessage,
  14326: SendClubFriendMessage,
  14365: TeamInviteMessage,
  14479: TeamInvitationResponseMessage,
};

module.exports = { packets };