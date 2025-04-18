import React from "react";
import styles from "./Wins.module.css";
import { useColor } from "../../context/ColorContext";
import { darkenColor, lightenColor } from "../../utils/colorUtils";

interface WinsProps {
  history: { multiplier: number }[];
}

const Wins: React.FC<WinsProps> = ({ history }) => {
  const { brandColor, primaryColor } = useColor();

  const getItemStyle = (multiplier: number) => {
    if (multiplier > 1) {
      return {
        backgroundImage: `linear-gradient(90deg, ${brandColor}, ${lightenColor(brandColor, 20)})`,
        boxShadow: `rgba(35, 238, 136, 0.3) 0px 0px 12px, ${darkenColor(brandColor, 20)} 0px -2px inset`,
        color: primaryColor,
      };
    } else {
      return { backgroundColor: `rgb(var(--layer5))`, color: `rgb(${primaryColor})` };
    }
  };

  return (
    <div className={styles.sliderContainer}>
      {!history?.length ? (
        <h2>Game result will be displayed</h2>
      ) : (
        <div className={styles.slider}>
          {history.map((item, index) => (
            <div
              key={`${item.multiplier}-${index}-${Date.now()}`}
              className={styles.item}
              style={getItemStyle(item.multiplier)}
            >
              {item.multiplier.toFixed(2)}x
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Wins;
