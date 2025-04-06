import React, { useState } from "react";
import "./BetHistory.css";

type TabType = "all" | "my" | "top";

interface BetHistoryProps {
  // Add any props you need here
  // For example:
  // allBets: Bet[];
  // myBets: Bet[];
  // topBets: Bet[];
}

const BetHistory: React.FC<BetHistoryProps> = () => {
  const [activeTab, setActiveTab] = useState<TabType>("all");

  const [headerType, setHeaderType] = React.useState("my");

  const handleTabClick = (tab: TabType) => {
    setActiveTab(tab);
  };

  const header = [
    { type: "all", value: "All Bets" },
    { type: "my", value: "My Bets", onClick: "myBet" },
    { type: "top", value: "Top" },
  ];

  return (
    <div className="navigation-switcher-wrapper">
      <div className="navigation-switcher">
        {header.map((item, index) => (
          <button
            key={index}
            className={`tab ${headerType === item.type ? "click" : ""}`}
            onClick={() => {
              setHeaderType(item.type);
              item.onClick;
            }}
          >
            {item.value}
          </button>
        ))}
      </div>

      <div className="tab-content" onClick={() => handleTabClick}>
        {activeTab === "all" && <AllBetsContent  />}
        {activeTab === "my" && <MyBetsContent />}
        {activeTab === "top" && <TopBetsContent />}
      </div>
    </div>
  );
};

// Placeholder components - replace with your actual implementations
const AllBetsContent: React.FC = () => (
  <div className="bets-list">
    <p>Displaying all bets...</p>
    {/* Render your all bets list here */}
  </div>
);

const MyBetsContent: React.FC = () => (
  <div className="bets-list">
    <p>Displaying your bets...</p>
    {/* Render your personal bets here */}
  </div>
);

const TopBetsContent: React.FC = () => (
  <div className="bets-list">
    <p>Displaying top bets...</p>
    {/* Render top bets here */}
  </div>
);

export default BetHistory;
