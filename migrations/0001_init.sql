CREATE TABLE IF NOT EXISTS players (
  "ID" INTEGER PRIMARY KEY,
  "Token" TEXT,
  "Name" TEXT,
  "NameSet" TEXT,
  "Gems" TEXT,
  "Trophies" TEXT,
  "Tickets" TEXT,
  "Resources" TEXT,
  "TokenDoubler" TEXT,
  "HighestTrophies" TEXT,
  "HomeBrawler" TEXT,
  "TrophyRoadReward" TEXT,
  "ExperiencePoints" TEXT,
  "ProfileIcon" TEXT,
  "NameColor" TEXT,
  "UnlockedBrawlers" TEXT,
  "BrawlersTrophies" TEXT,
  "BrawlersHighestTrophies" TEXT,
  "BrawlersLevel" TEXT,
  "BrawlersPowerPoints" TEXT,
  "UnlockedSkins" TEXT,
  "SelectedSkins" TEXT,
  "SelectedBrawler" TEXT,
  "HomeSkin" TEXT,
  "Region" TEXT,
  "SupportedContentCreator" TEXT,
  "StarPower" TEXT,
  "Gadget" TEXT,
  "BrawlPassActivated" TEXT,
  "WelcomeMessageViewed" TEXT,
  "ClubID" TEXT,
  "ClubRole" TEXT,
  "Friends" TEXT,
  "TimeStamp" TEXT
);

CREATE TABLE IF NOT EXISTS clubs (
  "ID" INTEGER PRIMARY KEY,
  "Name" TEXT,
  "Description" TEXT,
  "Region" TEXT,
  "BadgeID" TEXT,
  "Type" TEXT,
  "Trophies" TEXT,
  "RequiredTrophies" TEXT,
  "FamilyFriendly" TEXT,
  "Members" TEXT,
  "Messages" TEXT
);

CREATE TABLE IF NOT EXISTS admin_bans (
  "player_id" INTEGER PRIMARY KEY,
  "reason" TEXT NOT NULL DEFAULT '',
  "banned_by" TEXT NOT NULL DEFAULT 'console',
  "created_at" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_audit (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "created_at" TEXT NOT NULL,
  "actor" TEXT NOT NULL DEFAULT 'console',
  "action" TEXT NOT NULL,
  "target_type" TEXT,
  "target_id" TEXT,
  "reason" TEXT
);