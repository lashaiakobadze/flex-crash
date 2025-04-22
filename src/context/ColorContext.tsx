import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";

interface ColorContextType {
  brandColor: string;
  primaryColor: string;
  primaryBgColor: string;
  setBrandColor: (color: string) => void;
  setPrimaryColor: (color: string) => void;
  setPrimaryBgColor: (color: string) => void;
}

const ColorContext = createContext<ColorContextType | undefined>(undefined);

export const ColorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize with default colors
  const [brandColor, setBrandColor] = useState("#11e311"); // Your current brand color  // #0fffff"  #f635bf
  const [primaryColor, setPrimaryColor] = useState("#ffffff"); // Default primary color (white)
  const [primaryBgColor, setPrimaryBgColor] = useState("#000000"); // Default primary background color (black)

  // Update CSS variables when colors change
  useEffect(() => {
    const brandRgb = hexToRgbSpaces(brandColor);
    const primaryRgb = hexToRgbSpaces(primaryColor);
    const primaryBgRgb = hexToRgbSpaces(primaryBgColor);

    document.documentElement.style.setProperty("--brand-color", brandRgb);
    document.documentElement.style.setProperty("--primary", primaryRgb);
    document.documentElement.style.setProperty("--primary-bg", primaryBgRgb);
  }, [brandColor, primaryColor, primaryBgColor]);

  // Helper function to convert hex to RGB with spaces (255 255 255)
  const hexToRgbSpaces = (hex: string) => {
    hex = hex.replace("#", "");
    // Handle shorthand hex (like #ffffff)
    if (hex.length === 3) {
      hex = hex
        .split("")
        .map((c) => c + c)
        .join("");
    }
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `${r} ${g} ${b}`;
  };

  return (
    <ColorContext.Provider
      value={{
        brandColor,
        primaryColor,
        primaryBgColor,
        setBrandColor,
        setPrimaryColor,
        setPrimaryBgColor,
      }}
    >
      {children}
    </ColorContext.Provider>
  );
};

export const useColor = () => {
  const context = useContext(ColorContext);
  if (!context) {
    throw new Error("useColor must be used within a ColorProvider");
  }
  return context;
};
