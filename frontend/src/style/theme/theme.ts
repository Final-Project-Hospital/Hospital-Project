import { css } from "styled-components";

// Theme definition
export const theme = {
  colors: {
    blue: "#5D5FEF",
    seasalt: "#FAFBFC",
    gray700: "#737791",
    ashgray: "#a5aea3",
    dodgerBlue: "#0095FF",
    emerald: "#00E096",
    red: "#EF4444",
    violet: "#A700FF",
    yellow: "#FFCF00",
    pink: "#FA5A7D",
    salmon: "#FF947A",
    cadet: "#151D48",
    malachite: "#3CD856",
    floralWhite: "#FFFAF1",
    orange: "#f58d13",
    orangesuff: "#f7ece4",
    white: "#ffffff",
    black: "#000000",
    columbiaBlue: "#ceeafd",
    latte: "#FFF4DE",
    nyanza: "#DCFCE7",
    palePurple: "#F3E8FF",
    mistyRose: "#FFE2E5",
    sunset: "#FFD5A4",
    mauve: "#C5A8FF",
    aquamarine: "#8CFAC7",
    aliceBlue: "#F0F9FF",
    frenchGray: "#bdc9d3",
  },

  typography: {
    fontFamily: "'Public Sans', sans-serif",
  },

  breakpoints: {
    xs: "480px",
    sm: "576px",
    md: "768px",
    lg: "992px",
    xl: "1200px",
    xxl: "1440px",
    xxxl: "1600px",
  },
} as const;

// Type helpers
type Breakpoints = keyof typeof theme.breakpoints;
type MediaFunction = (...args: Parameters<typeof css>) => ReturnType<typeof css>;
type Media = Record<Breakpoints, MediaFunction>;

// Media query functions
export const media: Media = Object.keys(theme.breakpoints).reduce((acc, key) => {
  const label = key as Breakpoints;
  acc[label] = (...args) => css`
    @media (max-width: ${theme.breakpoints[label]}) {
      ${css(...args)}
    }
  `;
  return acc;
}, {} as Media);
