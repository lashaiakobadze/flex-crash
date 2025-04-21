import React, { useEffect, useState } from "react";
import "./BetHistory.css";
import { Bet } from "../../models";
import { fetchTopPoints } from "../../api/api";
import { truncateNickname } from "../../utils/format";

type TabType = "all" | "my" | "top";

interface BetHistoryProps {
  // Add any props you need here
  // For example:
  currentBets: Bet[];
  onlineUsers: number;
  totalBets: any;
  // myBets: Bet[];
  // topBets: Bet[];
}

const BetHistory: React.FC<BetHistoryProps> = ({ currentBets, onlineUsers, totalBets }) => {
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [headerType, setHeaderType] = React.useState("all");

  const [topPlayers, setTopPlayers] = useState<any[]>([]);
  // const [loading, setLoading] = useState(true);
  // const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // setLoading(true);
        const data = await fetchTopPoints(10); // Get top 10 players
        console.log("Top players data:", data);
        setTopPlayers(data);
      } catch (err) {
        // setError("Failed to load top players");
        console.error(err);
      } finally {
        // setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleTabClick = async (tab: TabType) => {
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
            className={`tab ${headerType === item.type ? "active" : ""}`}
            onClick={() => {
              setHeaderType(item.type);
              handleTabClick(item.type as TabType);
            }}
          >
            {item.value}
          </button>
        ))}
      </div>

      <div className="tab-content" onClick={() => handleTabClick}>
        {activeTab === "all" && (
          <AllBetsContent bets={currentBets} onlineUsers={onlineUsers} totalBets={totalBets} />
        )}
        {activeTab === "my" && <MyBetsContent />}
        {activeTab === "top" && <TopBetsContent data={topPlayers} />}
      </div>
    </div>
  );
};

// Placeholder components - replace with your actual implementations
const AllBetsContent: React.FC<{ bets: Bet[]; onlineUsers: number; totalBets: any }> = ({
  bets,
  onlineUsers,
  totalBets,
}) => (
  <div className="bets-list">
    <div className="bets-header">
      <span>
        {totalBets?.count || 0}/{onlineUsers}
      </span>
      <span>{totalBets?.totalBetAmount.toFixed(2) || 0}</span>
    </div>

    <div className="bets-header">
      <div className="bets-header__item">Player</div>
      <div className="bets-header__item">Cashout</div>
      <div className="bets-header__item">Amount</div>
    </div>

    <div className="bets-content">
      {bets.length === 0 && <p className="bets-content__item">waiting next round...</p>}
      {bets.map((bet, index) => (
        <div key={index} className="bets-content__item">
          <div className="bets-content__item__player">{truncateNickname(bet.nickname, 12)}</div>
          <div className="bets-content__item__cashout">
            {bet.points ? bet.points.toFixed(2) + "x" : "-"}
          </div>
          <div
            className="bets-content__item__amount"
            style={{ color: bet.status === "won" ? "#4caf50" : "" }}
          >
            {bet.amount.toFixed(2)}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const MyBetsContent: React.FC = () => <div className="bets-list"></div>;

interface TopBet {
  id: number;
  point: string;
  finished_at: string;
  // Other fields can be added if needed
}

const TopBetsContent: React.FC<{ data: TopBet[] }> = ({ data }) => {
  // Format date to be more readable
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString(); // Adjust format as needed
  };

  return (
    <div className="top-bets-container">
      <h3>Top Bets History</h3>
      <div className="bets-table-container">
        <table className="bets-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Points</th>
              <th>Finished At</th>
            </tr>
          </thead>
          <tbody>
            {data.map((bet, index) => (
              <tr key={bet.id}>
                <td>{index + 1}</td>
                <td>
                  {parseFloat(bet.point).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                  x
                </td>
                <td>{formatDate(bet.finished_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BetHistory;
