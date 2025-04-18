import * as React from "react";
import { CrashEngine } from "./CrashEngine";
import { GameStatus } from "../../App";
import { useColor } from "../../context/ColorContext";

interface CrashCanvasProps {
  width?: number;
  height?: number;

  // drawCaption?: boolean;

  points?: number;

  time?: number;

  gameStatus?: GameStatus;
}

const CrashCanvas: React.FC<CrashCanvasProps> = ({
  width = 600,
  height = 400,
  // drawCaption,
  points = null,
  gameStatus = null,
}) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const engineRef = React.useRef<CrashEngine | null>(null);
  const animationFrameRef = React.useRef<number | null>(null);
  const [isMounted, setIsMounted] = React.useState(false);
  const { brandColor } = useColor();
  const { primaryBgColor } = useColor();

  // console.log("points in childe", points);

  React.useEffect(() => {
    setIsMounted(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new CrashEngine();
    engineRef.current = engine;

    engine.startTime = new Date().getTime();
    engine.onResize(canvas.width, canvas.height);
    engine.updateFromPoints(0); // Initialize with points

    const tick = () => {
      if (!canvas || !isMounted || !engineRef.current) return;

      const engine = engineRef.current;
      engine.tick();
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, engine.graphWidth, engine.graphHeight);

      // Draw line (same as before)
      ctx.beginPath();
      ctx.strokeStyle = brandColor;
      ctx.lineWidth = 2;
      ctx.moveTo(0, engine.plotHeight);
      const a = engine.getElapsedPosition(engine.elapsedTime);
      const b = engine.getElapsedPosition(engine.elapsedTime / 2);
      ctx.quadraticCurveTo(b.x, b.y, a.x, a.y);
      ctx.stroke();

      // Draw caption
      // ctx.font = "bold 50px sans-serif";
      // ctx.fillStyle = "white";
      // const labelText = engine.multiplier.toFixed(2) + "x";
      // const textSize = ctx.measureText(labelText);
      // if (drawCaption) {
      //   ctx.fillText(
      //     labelText,
      //     engine.plotWidth / 2 - textSize.width / 2,
      //     engine.plotHeight / 2 -
      //       (textSize.actualBoundingBoxAscent +
      //         textSize.actualBoundingBoxDescent) /
      //         2,
      //   );
      // }

      ctx.font = "15px sans-serif";
      ctx.fillStyle = brandColor;
      ctx.strokeStyle = "#777";

      if (gameStatus == GameStatus.PLAYING) {
        // Draw y axis
        const stepOffset = stepValues(engine.multiplier || 1);
        const stepScale = engine.plotHeight / engine.yAxis;
        const subStepOffset = stepOffset * stepScale;
        const subSteps = Math.max(
          2,
          Math.min(16, ~~(subStepOffset / Math.max(3, engine.yAxis / stepOffset)))
        );

        for (
          let offset = stepOffset, step = 0;
          offset < engine.yAxis + stepOffset && step <= 100;
          offset += stepOffset, step++
        ) {
          const positionX = 0.5 + ~~engine.plotWidth + 15;
          const positionY = engine.plotHeight - offset * stepScale;

          // Draw ticker
          ctx.strokeStyle = brandColor; // danayofebi
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(positionX - 2, positionY);
          ctx.lineTo(positionX, positionY);
          ctx.stroke();

          // Draw caption
          const labelText =
            engine.getYMultiplier(positionY).toFixed(engine.multiplier > 2 ? 0 : 1) + "x";
          const textSize = ctx.measureText(labelText);
          ctx.fillText(
            labelText,
            positionX + 5,
            positionY + (textSize.actualBoundingBoxAscent + textSize.actualBoundingBoxDescent) / 2
          );

          // Draw substeps
          for (let o = 1; o < subSteps; o++) {
            const isMiddleSubStep = o === subSteps / 2;
            const subStepWidth = isMiddleSubStep ? 12 : 7;
            const subStepPositionY = 0.5 + ~~(positionY + (subStepOffset / subSteps) * o);

            // Draw ticker
            ctx.beginPath();
            ctx.moveTo(positionX - subStepWidth, subStepPositionY);
            ctx.lineTo(positionX, subStepPositionY);
            ctx.stroke();
          }
        }
      }

      // Draw x axis
      if (gameStatus == GameStatus.PLAYING) {
        // Draw x axis
        const xStepOffset = stepValues(engine.xAxis, 5, 2);
        const xStepScale = engine.plotWidth / (engine.xAxis / xStepOffset);

        for (
          let step = 1, offset = 0;
          offset < engine.xAxis + xStepOffset && step <= 100;
          offset += xStepOffset, step++
        ) {
          const seconds = offset / 1000;
          const positionX = step * xStepScale;
          const positionY = engine.plotHeight + 10;

          // Draw ticker
          ctx.strokeStyle = brandColor;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(positionX, positionY - 1);
          ctx.lineTo(positionX, positionY + 2);
          ctx.stroke();

          // Draw caption
          const labelText = seconds.toFixed(0) + "s";
          const textSize = ctx.measureText(labelText);
          ctx.fillText(labelText, positionX - textSize.width / 2, positionY + 15);
        }
      }

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      setIsMounted(false);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      engine.destroy();
    };
  }, [isMounted, gameStatus]);

  // Add effect to update engine when points change
  React.useEffect(() => {
    if (engineRef.current) {
      engineRef.current.updateFromPoints(points);
    }
  }, [points]);

  const stepValues = (multiplier: number, e: number = 5, n: number = 2) => {
    for (let i = 0.4, r = 0.1; ; ) {
      if (multiplier < i) {
        return r;
      }

      r *= n;
      i *= e;

      if (multiplier < i) {
        return r;
      }

      r *= e;
      i *= n;
    }
  };

  return (
    <div>
      <canvas
        style={{ background: `${primaryBgColor}` }}
        ref={canvasRef}
        width={width}
        height={height}
      />
    </div>
  );
};

export default CrashCanvas;
