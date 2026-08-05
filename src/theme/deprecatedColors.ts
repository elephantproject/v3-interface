import { colors } from "./colors";
import { opacify } from "./utils";

function getDeprecatedTheme(darkMode: boolean) {
  return {
    // text
    deprecated_text4: darkMode ? "#6B5A49" : "#D8CBBE",

    // backgrounds / grays

    // we could move this to `background`, but gray50 is a bit different from #FAFAFA
    deprecated_bg1: darkMode ? "#17100B" : "#FFF9F0",

    deprecated_bg3: darkMode ? "#2A1A12" : "#EFE0CE",
    deprecated_bg4: darkMode ? "#A96535" : "#D6A56F",
    deprecated_bg5: darkMode ? "#4E3526" : "#C69762",

    //specialty colors
    deprecated_advancedBG: darkMode
      ? opacify(10, colors.black)
      : opacify(60, colors.white),

    //primary colors
    deprecated_primary2: darkMode ? "#C83A32" : "#B7322C",
    deprecated_primary3: darkMode ? "#21B99A" : "#159F86",
    deprecated_primary4: darkMode ? "#D8A25B" : "#B9793C",
    deprecated_primary5: darkMode ? "#4B2013" : "#F4E8D9",

    // secondary colors
    deprecated_secondary2: darkMode ? "#1B2F27" : "#DDF1EA",
    deprecated_secondary3: darkMode ? "#4B2013" : "#F4E8D9",

    // other
    deprecated_yellow1: colors.yellow400,
    deprecated_yellow2: colors.yellow500,
    deprecated_yellow3: colors.yellow600,

    // dont wanna forget these blue yet
    deprecated_blue4: darkMode ? "#153d6f70" : "#C4D9F8",
  };
}

export const lightDeprecatedTheme = getDeprecatedTheme(false);
export const darkDeprecatedTheme = getDeprecatedTheme(true);
