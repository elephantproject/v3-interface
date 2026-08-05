import { Theme, vars } from "nft/css/sprinkles.css";

export const darkTheme: Theme = {
  colors: {
    accentFailure: vars.color.red300,
    accentFailureSoft: "rgba(253, 118, 107, 0.12)",
    accentAction: "#F6A04F",
    accentActionSoft: "rgba(246,160,79,.24)",
    accentSuccess: "#21B99A",

    explicitWhite: "#FFFFFF",
    green: vars.color.green200,
    gold: vars.color.gold200,
    violet: vars.color.violet200,

    backgroundFloating: "0000000C",
    backgroundInteractive: "#4E3526",
    backgroundModule: "#2A1A12",
    backgroundOutline: "#A96535",
    backgroundSurface: "#17100B",
    backgroundBackdrop: "#080504",

    modalBackdrop:
      "linear-gradient(0deg, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7))",

    searchBackground: `rgba(255,255,255,0.07)`,
    searchOutline: `rgba(255,255,255,0.07)`,
    stateOverlayHover: `rgba(153,161,189,0.08)`,

    textPrimary: "#FFF7E7",
    textSecondary: "#CDBFAE",
    textTertiary: "#6B5A49",

    dropShadow: `0px 4px 16px rgba(185, 74, 33, 0.4)`,
  },
  shadows: {
    menu: "0px 10px 30px rgba(0, 0, 0, 0.1)",
    elevation: "0px 4px 16px rgba(185, 74, 33, 0.32)",
    tooltip: "0px 4px 16px rgba(255, 255, 255, 0.2)",
    deep: "12px 16px 24px rgba(0, 0, 0, 0.24), 12px 8px 12px rgba(0, 0, 0, 0.24), 4px 4px 8px rgba(0, 0, 0, 0.32)",
    shallow:
      "4px 4px 10px rgba(0, 0, 0, 0.24), 2px 2px 4px rgba(0, 0, 0, 0.12), 1px 2px 2px rgba(0, 0, 0, 0.12)",
  },
  opacity: {
    hover: "0.6",
    pressed: "0.4",
  },
};
