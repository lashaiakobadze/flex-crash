import React, { useState } from "react";
import styles from "./GameOptionsTab.module.css";

export enum GameOptions {
  MANUAL = "MANUAL",
  AUTO = "AUTO",
}

interface GameOptionsTabProps {
  onTabChange: (option: GameOptions) => void;
}

const GameOptionsTab: React.FC<GameOptionsTabProps> = ({ onTabChange }) => {
  const [selectedOption, setSelectedOption] = useState(GameOptions.MANUAL);

  const handleTabChange = (option: GameOptions) => {
    setSelectedOption(option);
    onTabChange(option);
  };

  return (
    <div role="tablist" aria-orientation="horizontal" className={styles.tabList}>
      <button
        role="tab"
        aria-selected={selectedOption === GameOptions.MANUAL}
        onClick={() => handleTabChange(GameOptions.MANUAL)}
        className={`${styles.tab} ${selectedOption === GameOptions.MANUAL ? `${styles.selected}` : ``}`}
      >
        Manual
      </button>
      <button
        role="tab"
        aria-selected={selectedOption === GameOptions.AUTO}
        onClick={() => handleTabChange(GameOptions.AUTO)}
        className={`${styles.tab} ${selectedOption === GameOptions.AUTO ? `${styles.selected}` : ``}`}
      >
        Auto
      </button>
    </div>
  );
};

export default GameOptionsTab;
