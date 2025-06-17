import React, { createContext, useContext, useState, ReactNode, ChangeEvent } from 'react';

// กำหนด type ของ initialState
interface InitialState {
  chat: boolean;
  cart: boolean;
  userProfile: boolean;
  notification: boolean;
}

// กำหนด type สำหรับ context value
interface StateContextType {
  screenSize: number | undefined;
  setScreenSize: React.Dispatch<React.SetStateAction<number | undefined>>;
  currentColor: string;
  setCurrentColor: React.Dispatch<React.SetStateAction<string>>;
  currentMode: string;
  setCurrentMode: React.Dispatch<React.SetStateAction<string>>;
  themeSettings: boolean;
  setThemeSettings: React.Dispatch<React.SetStateAction<boolean>>;
  activeMenu: boolean;
  setActiveMenu: React.Dispatch<React.SetStateAction<boolean>>;
  isClicked: InitialState;
  setIsClicked: React.Dispatch<React.SetStateAction<InitialState>>;
  initialState: InitialState;
  setMode: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  setColor: (color: string) => void;
  handleClick: (clicked: keyof InitialState) => void;
}

// กำหนดค่าเริ่มต้นของ initialState
const initialState: InitialState = {
  chat: false,
  cart: false,
  userProfile: false,
  notification: false,
};

const StateContext = createContext<StateContextType | undefined>(undefined);

interface ContextProviderProps {
  children: ReactNode;
}

export const ContextProvider: React.FC<ContextProviderProps> = ({ children }) => {
  const [screenSize, setScreenSize] = useState<number | undefined>(undefined);
  const [currentColor, setCurrentColor] = useState<string>('#FB9678');
  const [currentMode, setCurrentMode] = useState<string>('Light');
  const [themeSettings, setThemeSettings] = useState<boolean>(false);
  const [activeMenu, setActiveMenu] = useState<boolean>(true);
  const [isClicked, setIsClicked] = useState<InitialState>(initialState);

  const setMode = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setCurrentMode(e.target.value);
    localStorage.setItem('themeMode', e.target.value);
  };

  const setColor = (color: string) => {
    setCurrentColor(color);
    localStorage.setItem('colorMode', color);
  };

  const handleClick = (clicked: keyof InitialState) =>
    setIsClicked({ ...initialState, [clicked]: true });

  return (
    <StateContext.Provider
      value={{
        currentColor,
        currentMode,
        activeMenu,
        screenSize,
        setScreenSize,
        handleClick,
        isClicked,
        initialState,
        setIsClicked,
        setActiveMenu,
        setCurrentColor,
        setCurrentMode,
        setMode,
        setColor,
        themeSettings,
        setThemeSettings,
      }}
    >
      {children}
    </StateContext.Provider>
  );
};

export const useStateContext = (): StateContextType => {
  const context = useContext(StateContext);
  if (!context) {
    throw new Error('useStateContext must be used within a ContextProvider');
  }
  return context;
};
