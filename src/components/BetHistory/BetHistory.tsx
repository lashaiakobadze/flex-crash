import React, { useState } from "react";
import "./BetHistory.css";
import { Bet } from "../../models";

type TabType = "all" | "my" | "top";

interface BetHistoryProps {
  // Add any props you need here
  // For example:
  currentBets: Bet[];
  // myBets: Bet[];
  // topBets: Bet[];
}

const BetHistory: React.FC<BetHistoryProps> = ({ currentBets }) => {
  const [activeTab, setActiveTab] = useState<TabType>("all");

  const [headerType, setHeaderType] = React.useState("my");

  const handleTabClick = (tab: TabType) => {
    console.log("Tab clicked:", tab);
    setActiveTab(tab);
  };

  const header = [
    { type: "all", value: "Bets" },
    // { type: "my", value: "My Bets", onClick: "myBet" },
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
              handleTabClick(item.type as TabType);
              // item.onClick;
            }}
          >
            {item.value}
          </button>
        ))}
      </div>

      <div className="tab-content" onClick={() => handleTabClick}>
        {activeTab === "all" && <AllBetsContent bets={currentBets} />}
        {activeTab === "my" && <MyBetsContent />}
        {activeTab === "top" && <TopBetsContent />}
      </div>
    </div>
  );
};

// Placeholder components - replace with your actual implementations
const AllBetsContent: React.FC<{ bets: Bet[] }> = ({ bets }) => (
  <div className="bets-list">
    <div className="bets-header">
      <div className="bets-header__item">Player</div>
      <div className="bets-header__item">Cashout</div>
      <div className="bets-header__item">Amount</div>
    </div>

    <div className="bets-content">
      {bets.map((bet, index) => (
        <div key={index} className="bets-content__item">
          <div className="bets-content__item__player">{bet.nickname}</div>
          <div className="bets-content__item__cashout">
            {bet.points ? bet.points.toFixed(2) : "-"}
          </div>
          <div className="bets-content__item__amount">{bet.amount.toFixed(2)}</div>
        </div>
      ))}
    </div>
  </div>
);

const MyBetsContent: React.FC = () => <div className="bets-list"></div>;

const TopBetsContent: React.FC = () => (
  <div className="bets-list">
    <p>Displaying top bets...</p>
    {/* Render top bets here */}
  </div>
);

export default BetHistory;
