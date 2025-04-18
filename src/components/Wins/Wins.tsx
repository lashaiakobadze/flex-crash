import React from "react";
import styles from "./Wins.module.css";
// import { useColor } from "../../context/ColorContext";
// import { darkenColor, lightenColor } from "../../utils/colorUtils";

interface WinsProps {
  history: { multiplier: number }[];
}

const Wins: React.FC<WinsProps> = ({ history }) => {
  // const { brandColor } = useColor();

  // Dynamic style for brand variant
  // const brandStyle = {
  //   backgroundImage: `linear-gradient(90deg, ${brandColor}, ${lightenColor(brandColor, 20)})`,
  //   boxShadow: `rgba(35, 238, 136, 0.3) 0px 0px 12px, ${darkenColor(brandColor, 20)} 0px -2px inset`,
  //   border: `1px solid ${brandColor}`,
  // };

  return (
    <div className={styles.sliderContainer}>
      {!history?.length ? (
        <h2>Game result will be displayed</h2>
      ) : (
        <div className={styles.slider}>
          {history.map((item: { multiplier: number }, index) => (
            <div
              key={item.multiplier + index + Math.random()}
              className={`${styles.item} ${item.multiplier > 1 ? styles.won : styles.lost}`}
              // style={item.multiplier > 1 ? brandStyle : styles.lost}
            >
              {Number(item.multiplier.toFixed(2))}x
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Wins;
