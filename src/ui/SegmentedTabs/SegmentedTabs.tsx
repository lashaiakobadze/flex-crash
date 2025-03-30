import React from "react";
import styles from "./SegmentedTabs.module.css";
import { SegmentedEnum } from "./SegmentedTabs.enum";

interface SegmentedTabsProps {
  options?: SegmentedEnum[]; // Array of tab labels (e.g., ["Low", "Medium", "High"])
  selected: SegmentedEnum; // The currently selected tab
  onSelect: (option: SegmentedEnum) => void; // Callback for tab selection
}

const SegmentedTabs: React.FC<SegmentedTabsProps> = ({
  options = [SegmentedEnum.Low, SegmentedEnum.Medium, SegmentedEnum.High],
  selected,
  onSelect,
}) => {
  return (
    <div className={styles.segmentedTabs}>
      {options.map((option) => (
        <button
          key={option}
          className={`${styles.tab} ${selected === option ? styles.active : ""}`}
          onClick={() => onSelect(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
};

export default SegmentedTabs;
