// src/lib/trackmania/types.ts

export type TrophyRanking = {
    accountId: string;
    countPoint: number;
    echelon: number;
    zones?: TrophyZone[];
};

export type TrophyZone = {
    zoneName: string;
    ranking: {
        position: number;
        length: number;
    };
};

export type PlayerResult = {
    playerName: string;
    accountId: string;
    trophies: TrophyRanking | null;
};

export type PlayerSearchResult = {
    accountId: string;
    displayName: string;
    countryCode: string | null;
    countryName: string | null;
};

export type PlayerZoneResponse = {
    accountId: string;
    timestamp: string;
    zoneId: string;
};

export type TrackmaniaZone = {
    icon: string;
    name: string;
    parentId: string | null;
    timestamp: string;
    zoneId: string;
};

export type UbisoftSessionResponse = {
    ticket?: string;
};

export type TotdDay = {
    campaignId: number;
    mapUid: string;
    monthDay: number;
    startTimestamp: number;
};

export type MapInfo = {
    uid: string;
    name: string;
    author: string;
    authorTime: number;
};

export type TrackWithMapInfo = TotdDay & {
    mapInfo: MapInfo;
    mapperName: string;
};

export type TotdMonth = {
    year: number;
    month: number;
    days: TrackWithMapInfo[];
};

export type TotdApiMonth = {
    year: number;
    month: number;
    days: TotdDay[];
};

export type TotdApiResponse = {
    monthList: TotdApiMonth[];
};

export type NadeoTokenResponse = {
    accessToken: string;
    refreshToken?: string;
};

export type TrackmaniaOAuthResponse = {
    access_token: string;
    token_type?: string;
    expires_in?: number;
};

export type TrophyRankingResponse = {
    rankings?: TrophyRanking[];
};