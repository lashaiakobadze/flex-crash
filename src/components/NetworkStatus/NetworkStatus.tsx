import React, { useState, useEffect } from "react";
import "./NetworkStatus.css";

type NetworkStatusProps = {
  latency: number;
  className?: string;
};

type ConnectionQuality = "excellent" | "good" | "fair" | "poor" | "disconnected";

const QUALITY_THRESHOLDS = {
  excellent: 50,
  good: 100,
  fair: 200,
  poor: 500,
};

const NetworkStatus: React.FC<NetworkStatusProps> = ({ latency, className = "" }) => {
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());
  const [isActive, setIsActive] = useState<boolean>(true);

  const getConnectionQuality = (): ConnectionQuality => {
    if (latency < 0) return "disconnected";
    if (latency <= QUALITY_THRESHOLDS.excellent) return "excellent";
    if (latency <= QUALITY_THRESHOLDS.good) return "good";
    if (latency <= QUALITY_THRESHOLDS.fair) return "fair";
    return "poor";
  };

  const quality = getConnectionQuality();

  useEffect(() => {
    const timer = setInterval(() => {
      setIsActive(Date.now() - lastUpdate < 5000);
    }, 1000);
    return () => clearInterval(timer);
  }, [lastUpdate]);

  useEffect(() => {
    if (latency >= 0) {
      setLastUpdate(Date.now());
      setIsActive(true);
    }
  }, [latency]);

  // Calculate bar heights based on quality
  const getBarHeights = () => {
    if (!isActive) return { low: 0, middle: 0, high: 0 };

    switch (quality) {
      case "excellent":
        return { low: 8, middle: 10, high: 12 };
      case "good":
        return { low: 6, middle: 8, high: 10 };
      case "fair":
        return { low: 4, middle: 6, high: 0 };
      case "poor":
        return { low: 2, middle: 0, high: 0 };
      default:
        return { low: 0, middle: 0, high: 0 };
    }
  };

  const barHeights = getBarHeights();
  const containerModifier = `network-status--${isActive ? quality : "disconnected"}`;

  return (
    <div className={`network-status ${containerModifier} ${className}`}>
      <div className="network-status__latency">
        {latency >= 0 ? `${Math.round(latency)}ms` : "--"}
      </div>

      <div className="network-status__bars">
        <div
          className="network-status__bar network-status__bar--low"
          style={{ height: `${barHeights.low}px` }}
        />
        <div
          className="network-status__bar network-status__bar--middle"
          style={{ height: `${barHeights.middle}px` }}
        />
        <div
          className="network-status__bar network-status__bar--high"
          style={{ height: `${barHeights.high}px` }}
        />
      </div>
    </div>
  );
};

export default NetworkStatus;
