// src/styled.d.ts or any global types declaration file
import "styled-components";

declare module "styled-components" {
  export interface DefaultTheme {
    colors: {
      blue: string;
      seasalt: string;
      gray700: string;
      ashgray: string;
      dodgerBlue: string;
      emerald: string;
      red: string;
      violet: string;
      yellow: string;
      pink: string;
      salmon: string;
      cadet: string;
      malachite: string;
      floralWhite: string;
      orange: string;
      orangesuff:string;
      white: string;
      black: string;
      columbiaBlue: string;
      latte: string;
      nyanza: string;
      palePurple: string;
      mistyRose: string;
      sunset: string;
      mauve: string;
      aquamarine: string;
      aliceBlue: string;
      frenchGray: string;
    };
    typography: {
      fontFamily: string;
    };
    breakpoints: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
      xxl: string;
      xxxl: string;
    };
  }
}
