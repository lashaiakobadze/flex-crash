import React from "react";
import "./ColorPicker.css";
import { useColor } from "../../context/ColorContext";

export const ColorPicker: React.FC = () => {
  const {
    brandColor,
    primaryColor,
    primaryBgColor,
    setBrandColor,
    setPrimaryColor,
    setPrimaryBgColor,
  } = useColor();

  return (
    <div
      className="color-picker-container"
      style={{ backgroundColor: "rgb(var(--layer2))", padding: "12px", borderRadius: "8px" }}
    >
      {/* Brand Color Picker */}
      <div className="color-picker-group">
        <label htmlFor="brand-color-picker" style={{ color: "rgb(var(--brand-color))" }}>
          Brand Color:
        </label>
        <div className="color-picker-input">
          <input
            id="brand-color-picker"
            type="color"
            value={brandColor}
            onChange={(e) => setBrandColor(e.target.value)}
          />
          <span style={{ color: "rgb(var(--brand-color))" }}>{brandColor}</span>
        </div>
      </div>

      {/* Primary Color Picker */}
      <div className="color-picker-group" style={{ marginTop: "12px" }}>
        <label htmlFor="primary-color-picker" style={{ color: "rgb(var(--primary))" }}>
          Primary Color:
        </label>
        <div className="color-picker-input">
          <input
            id="primary-color-picker"
            type="color"
            value={primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
          />
          <span style={{ color: "rgb(var(--primary))" }}>{primaryColor}</span>
        </div>
      </div>

      {/* Primary Background Color Picker */}
      <div className="color-picker-group" style={{ marginTop: "12px" }}>
        <label htmlFor="primary-bg-color-picker" style={{ color: "rgb(var(--primary-bg))" }}>
          Primary Background Color:
        </label>
        <div className="color-picker-input">
          <input
            id="primary-bg-color-picker"
            type="color"
            value={primaryBgColor}
            onChange={(e) => setPrimaryBgColor(e.target.value)}
          />
          <span style={{ color: "rgb(var(--primary-bg))" }}>{primaryBgColor}</span>
        </div>
      </div>
    </div>
  );
};
