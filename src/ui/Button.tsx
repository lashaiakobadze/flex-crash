import React from "react";
import styles from "./button.module.css";
import { useColor } from "../context/ColorContext";
import { darkenColor, lightenColor } from "../utils/colorUtils";

interface ButtonProps {
  onClick?: () => void;
  label: string;
  amount?: string;
  disabled?: boolean;
  variant?: "primary" | "brand";
}

const Button: React.FC<ButtonProps> = ({ onClick, label, amount, disabled, variant = "brand" }) => {
  const { brandColor } = useColor();

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
