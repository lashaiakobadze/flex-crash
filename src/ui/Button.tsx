import React from "react";
import styles from "./button.module.css";
import { useColor } from "../context/ColorContext";

interface ButtonProps {
  onClick?: () => void;
  label: string;
  amount?: string;
  disabled?: boolean;
  variant?: "primary" | "brand";
}

const Button: React.FC<ButtonProps> = ({ onClick, label, amount, disabled, variant = "brand" }) => {
  const { brandColor } = useColor();

  // Helper functions to lighten/darken colors
  const hexToRgb = (hex: string) => {
    hex = hex.replace("#", "");
    if (hex.length === 3) {
      hex = hex
        .split("")
        .map((char) => char + char)
        .join("");
    }
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return { r, g, b };
  };

  const rgbToHex = (r: number, g: number, b: number) => {
    const toHex = (c: number) => {
      const hex = Math.round(c).toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  const lightenColor = (hex: string, percent: number) => {
    const { r, g, b } = hexToRgb(hex);
    const newR = r + (255 - r) * (percent / 100);
    const newG = g + (255 - g) * (percent / 100);
    const newB = b + (255 - b) * (percent / 100);
    return rgbToHex(newR, newG, newB);
  };

  const darkenColor = (hex: string, percent: number) => {
    const { r, g, b } = hexToRgb(hex);
    const newR = r * (1 - percent / 100);
    const newG = g * (1 - percent / 100);
    const newB = b * (1 - percent / 100);
    return rgbToHex(newR, newG, newB);
  };

  // Dynamic style for brand variant
  const brandStyle = {
    backgroundImage: `linear-gradient(90deg, ${brandColor}, ${lightenColor(brandColor, 20)})`,
    boxShadow: `rgba(35, 238, 136, 0.3) 0px 0px 12px, ${darkenColor(brandColor, 20)} 0px -2px inset`,
    border: `1px solid ${brandColor}`,
  };

  return (
    <button
      onClick={onClick}
      className={`${styles.button} ${variant === "brand" ? styles.buttonBrand : ""}`}
      type="button"
      disabled={disabled}
      style={variant === "brand" ? brandStyle : {}}
    >
      <span
        className={`${styles.buttonContent} inline-flex items-center gap-2 text-lg font-extrabold sm:text-sm sm:font-normal`}
      >
        {label}
        <span className="text-sm font-normal">{amount ? amount : ""}</span>
      </span>
    </button>
  );
};

export default Button;
