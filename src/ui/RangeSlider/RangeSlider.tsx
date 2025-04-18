import styles from "./RangeSlider.module.css";

interface RangeSliderProps {
  min: number;
  max: number;
  value: number;
  disabled: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  customClasses?: string;
  secondaryBgColor?: string;
}

const RangeSlider = (props: RangeSliderProps) => {
  const percentage = (100 * (props.value - props.min)) / (props.max - props.min);
  const rangerStyle = {
    background: `linear-gradient(90deg, var( - primary-600) 0, var( - orange-500) ${percentage}%, ${props.secondaryBgColor ? props.secondaryBgColor : "var( - defaut-color)"} ${percentage + 0.1}%)`,
  };

  return (
    <div className={styles.rangeSlider}>
      {props.value && <div>{props.value}</div>}
      <input
        className={`${styles.rangeSliderInput} ${props.customClasses ? props.customClasses : ""}`}
        style={rangerStyle}
        type="range"
        value={props.value}
        min={props.min}
        max={props.max}
        onChange={props.onChange}
        disabled={props.disabled}
      />
      {props.max && <div>{props.max}</div>}
    </div>
  );
};

export default RangeSlider;
