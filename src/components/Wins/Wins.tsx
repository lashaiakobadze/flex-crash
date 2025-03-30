import React from "react";
import styles from "./Wins.module.css";

interface WinsProps {
  history: { multiplier: number }[];
}

const Wins: React.FC<WinsProps> = ({ history }) => {
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
