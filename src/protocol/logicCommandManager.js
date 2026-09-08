/**
 * Turn commands — the "moves" a client streams inside EndClientTurn (14102)
 * and the state effects the server pushes back.
 *
 * Id ranges, mirroring the original server:
 *   [200, 500)  server -> client commands (state pushes, unlocks, offers)
 *   [500, ~600) client -> server commands (purchases, level-ups, cosmetics)
 *   1000        debug command
 *
 * A value that is a String is a command the original sends but we have not
 * implemented (we only resolve its name / forward it); a value that is a class
 * is one we actually run on this server. isServerToClient() encodes the range
 * rule used when recording turns. packets-smoke asserts every known id in
 * [200, 600) resolves to a non-empty name.
 */

const { LogicSelectCharacterCommand } = require('./commands/client/logicSelectCharacterCommand');
const { LogicSelectSkinCommand } = require('./commands/client/logicSelectSkinCommand');
const { LogicSetPlayerThumbnailCommand } = require('./commands/client/logicSetPlayerThumbnailCommand');
const { LogicSetPlayerNameColorCommand } = require('./commands/client/logicSetPlayerNameColorCommand');
const { LogicPurchaseDoubleCoinsCommand } = require('./commands/client/logicPurchaseDoubleCoinsCommand');
const { LogicPurchaseHeroLvlUpMaterialCommand } = require('./commands/client/logicPurchaseHeroLvlUpMaterialCommand');
const { LogicPurchaseOfferCommand } = require('./commands/client/logicPurchaseOfferCommand');
const { LogicPurchaseGemsCommand } = require('./commands/client/logicPurchaseGemsCommand');
const { LogicGatchaCommand } = require('./commands/client/logicGatchaCommand');
const { LogicLevelUpCommand } = require('./commands/client/logicLevelUpCommand');
const { LogicClaimRankUpRewardCommand } = require('./commands/client/logicClaimRankUpRewardCommand');

const commands = {
  217: 'LogicProLeagueSeasonChangedCommand',
  504: 'LogicSendAllianceMailCommand',
  221: 'LogicTeamChatMuteStateChangedCommand',
  215: 'LogicSetSupportedCreatorCommand',
  519: LogicPurchaseOfferCommand,
  539: 'LogicBrawlPassAutoCollectWarningSeenCommand',
  541: 'LogicClearESportsHubNotificationCommand',
  211: 'LogicOffersChangedCommand',
  209: 'LogicKeyPoolChangedCommand',
  202: 'LogicDiamondsAddedCommand',
  527: LogicSetPlayerNameColorCommand,
  517: LogicClaimRankUpRewardCommand,
  218: 'LogicBrawlPassSeasonChangedCommand',
  528: 'LogicViewInboxNotificationCommand',
  536: 'LogicPurchaseBrawlPassProgressCommand',
  205: 'LogicDecreaseHeroScoreCommand',
  507: 'LogicUnlockSkinCommand',
  542: 'LogicSelectGroupSkinCommand',
  204: 'LogicDayChangedCommand',
  526: 'LogicUnlockFreeSkinsCommand',
  525: LogicSelectCharacterCommand,
  531: 'LogicCancelPurchaseOfferCommand',
  524: 'LogicVideoStartedCommand',
  522: LogicPurchaseGemsCommand,
  214: 'LogicGemNameChangeStateChangedCommand',
  206: 'LogicAddNotificationCommand',
  515: 'LogicClearShopTickersCommand',
  535: 'LogicClaimTailRewardCommand',
  512: 'LogicToggleInGameHintsCommand',
  203: 'LogicGiveDeliveryItemsCommand',
  523: 'LogicClaimAdRewardCommand',
  505: LogicSetPlayerThumbnailCommand,
  210: 'LogicIAPChangedCommand',
  208: 'LogicTransactionsRevokedCommand',
  201: 'LogicChangeAvatarNameCommand',
  511: 'LogicHelpOpenedCommand',
  521: LogicPurchaseHeroLvlUpMaterialCommand,
  506: LogicSelectSkinCommand,
  520: LogicLevelUpCommand,
  508: 'LogicChangeControlModeCommand',
  514: 'LogicDeleteNotificationCommand',
  212: 'LogicPlayerDataChangedCommand',
  216: 'LogicCooldownExpiredCommand',
  540: 'LogicPurchaseChallengeLivesCommand',
  213: 'LogicInviteBlockingChangedCommand',
  529: 'LogicSelectStarPowerCommand',
  503: 'LogicClaimDailyRewardCommand',
  509: LogicPurchaseDoubleCoinsCommand,
  537: 'LogicVanityItemSeenCommand',
  532: 'LogicItemSeenCommand',
  530: 'LogicSetPlayerAgeCommand',
  207: 'LogicChangeResourcesCommand',
  1000: 'LogicDebugCommand',
  500: LogicGatchaCommand,
  222: 'LogicRankedSeasonChangedCommand',
  223: 'LogicCooldownAddedCommand',
};

function commandExists(commandID) {
  return commandID in commands;
}

function getCommandName(commandID) {
  if (commandExists(commandID)) {
    let command = commands[commandID];
    if (typeof command !== 'string') return command.name;
    return command;
  }
  return '';
}

function createCommandByType(commandID) {
  if (commandExists(commandID)) {
    const command = commands[commandID];
    if (typeof command !== 'string') return command;
  }
  return undefined;
}

function isServerToClient(commandID) {
  if (commandID >= 200 && commandID < 500) return true;
  else if (commandID >= 500) return false;
}

const LogicCommandManager = { commandExists, getCommandName, createCommandByType, isServerToClient };

module.exports = { LogicCommandManager };