// components/Icon.tsx
import React from "react";
import { useColor } from "../context/ColorContext";

type IconType = "user" | "settings";

interface IconProps {
  type: IconType;
  size?: number;
}

export const Icon: React.FC<IconProps> = ({ type, size = 16 }) => {
  const { brandColor } = useColor();

  const iconData = {
    user: {
      path: "M512 320c94.34 0 170.67-76.33 170.67-170.67S606.34-21.33 512-21.33 341.33 55 341.33 149.33 417.66 320 512 320zm-170.67 85.33c-117.82 0-213.33 95.51-213.33 213.33v128c0 23.57 19.1 42.67 42.67 42.67h682.66c23.57 0 42.67-19.1 42.67-42.67v-128c0-117.82-95.51-213.33-213.33-213.33H341.33z",
      viewBox: "0 0 1024 1024",
      noStroke: true,
    },
    settings: {
      path: "M12 15.5A3.5 3.5 0 0 1 8.5 12 3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5zm7.43-2.53c.04-.32.07-.64.07-.97 0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1 0 .33.03.65.07.97l-2.11 1.66c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64L19.43 13z",
      viewBox: "0 0 24 24",
      noStroke: true, // Settings icon typically doesn't need stroke
    },
  };

  const { path, viewBox, noStroke } = iconData[type];

  return (
    <svg
      className="svg-icon"
      style={{
        width: size,
        height: size,
        verticalAlign: "middle",
        fill: brandColor,
        stroke: noStroke ? "none" : brandColor,
        strokeWidth: noStroke ? 0 : 1, // Reduced from 30
        overflow: "visible", // Changed from hidden
      }}
      viewBox={viewBox}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d={path} />
    </svg>
  );
};
