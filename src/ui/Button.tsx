import React from "react";
import styles from "./button.module.css";

interface ButtonProps {
  onClick?: () => void;
  label: string;

  amount?: string;
}

const Button: React.FC<ButtonProps> = ({ onClick, label, amount }) => {
  return (
    <button
      onClick={onClick}
      className={`${styles.button} ${styles.buttonBrand}`}
      type="button"
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
