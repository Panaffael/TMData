import type { TrophyZone } from "./types";

const ISO_COUNTRY_CODES = `
AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ
BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ
CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ
DE DJ DK DM DO DZ
EC EE EG EH ER ES ET
FI FJ FK FM FO FR
GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY
HK HM HN HR HT HU
ID IE IL IM IN IO IQ IR IS IT
JE JM JO JP
KE KG KH KI KM KN KP KR KW KY KZ
LA LB LC LI LK LR LS LT LU LV LY
MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ
NA NC NE NF NG NI NL NO NP NR NU NZ
OM
PA PE PF PG PH PK PL PM PN PR PS PT PW PY
QA
RE RO RS RU RW
SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ
TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ
UA UG UM US UY UZ
VA VC VE VG VI VN VU
WF WS
YE YT
ZA ZM ZW
`.trim().split(/\s+/);

const COUNTRY_ALIASES: Record<string, string> = {
    "bolivia": "BO",
    "brunei": "BN",
    "cape verde": "CV",
    "congo": "CG",
    "democratic republic of the congo": "CD",
    "czech republic": "CZ",
    "iran": "IR",
    "ivory coast": "CI",
    "laos": "LA",
    "moldova": "MD",
    "north korea": "KP",
    "palestine": "PS",
    "russia": "RU",
    "south korea": "KR",
    "syria": "SY",
    "taiwan": "TW",
    "tanzania": "TZ",
    "turkey": "TR",
    "united kingdom": "GB",
    "united states": "US",
    "united states of america": "US",
    "venezuela": "VE",
    "vietnam": "VN",
};

function normalizeCountryName(value: string): string {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
}

function createCountryNameMap(): Map<string, string> {
    const result = new Map<string, string>();
    const locales = ["en", "de", "fr"];

    for (const locale of locales) {
        const displayNames = new Intl.DisplayNames([locale], {
            type: "region",
        });

        for (const code of ISO_COUNTRY_CODES) {
            const countryName = displayNames.of(code);

            if (countryName) {
                result.set(
                    normalizeCountryName(countryName),
                    code
                );
            }
        }
    }

    for (const [name, code] of Object.entries(COUNTRY_ALIASES)) {
        result.set(normalizeCountryName(name), code);
    }

    return result;
}

const COUNTRY_NAME_TO_CODE = createCountryNameMap();
const ENGLISH_COUNTRY_NAMES = new Intl.DisplayNames(["en"], {
    type: "region",
});

export type PlayerCountry = {
    countryCode: string;
    countryName: string;
};

export function findCountryByName(
    zoneName: string
): PlayerCountry | null {
    const countryCode = COUNTRY_NAME_TO_CODE.get(
        normalizeCountryName(zoneName)
    );

    if (!countryCode) {
        return null;
    }

    return {
        countryCode,
        countryName:
            ENGLISH_COUNTRY_NAMES.of(countryCode) ??
            zoneName,
    };
}

export function findPlayerCountry(
    zones: TrophyZone[] | undefined
): PlayerCountry | null {
    if (!zones) {
        return null;
    }

    for (const zone of zones) {
        const country = findCountryByName(zone.zoneName);

        if (country) {
            return country;
        }
    }

    return null;
}

export function countryCodeToFlag(
    countryCode: string | null | undefined
): string {
    if (!countryCode || !/^[A-Za-z]{2}$/.test(countryCode)) {
        return "🌐";
    }

    return countryCode
        .toUpperCase()
        .split("")
        .map((character) =>
            String.fromCodePoint(
                127397 + character.charCodeAt(0)
            )
        )
        .join("");
}