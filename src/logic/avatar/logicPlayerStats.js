/**
 * PlayerProfileStats payload for GetPlayerProfile — the summary card another
 * player sees (trophy count, unlocked brawlers, best records). Most fields are
 * zero/fixed here; the profile icon is derived from the account's ProfileIcon
 * via the 28000000+ id family the client maps to its icon table.
 */

function getPlayerStats(accountData) {
  return {
    '3v3Victories': 0,
    ExperiencePoints: accountData['ExperiencePoints'],
    Trophies: accountData['Trophies'],
    HighestTrophies: accountData['HighestTrophies'],
    UnlockedBrawlersCount: accountData['UnlockedBrawlers'].length,
    Unknown2: 0,
    ProfileIconID: 28000000 + accountData['ProfileIcon'],
    SoloVictories: 0,
    BestRoboRumbleTime: 9999,
    BestTimeAsBigBrawler: 99999,
    DuoVictories: 0,
    HighestBossFightLvlPassed: 21,
    Unknown4: 0,
    PowerPlayRank: 1,
    MostChallengeWins: 0,
  };
}

module.exports = { getPlayerStats };