import { useEffect, useRef, useState } from "react";
import * as msgpack from "msgpack-lite";

import "./App.css";
import GameOptionsTab, {
  GameOptions,
} from "./ui/GameOptionsTab/GameOptionsTab";
import Button from "./ui/Button";
import CrashCanvas from "./components/Crash/CrashCanvas";
import BetHistory from "./components/BetHistory/BetHistory";

// Constants
const PING_INTERVAL = 8000;
const PING_BYTE = 0x9;
const BET_REQUEST = 50;
const CASH_OUT_REQUEST = 52;

// Types
type WebSocketMessage = {
  t: number;
  [key: string]: any;
};

enum GameStatus {
  PLAYING = "PLAYING",
  WAITING = "WAITING",
  CANCELLED = "CANCELLED",
  BETTING_ROUND = "BETTING_ROUND",
  END_BETTING_ROUND = "END_BETTING_ROUND",
}

function App() {
  const isMounted = useRef(false);
  const [gameMode, setGameMode] = useState<GameOptions>(GameOptions.MANUAL);

  const [amount, setAmount] = useState<number>(5);
  const [isAmountInputFocused, setIsAmountInputFocused] = useState(false);
  const [cashOut, setCashOut] = useState<string>("");
  const [isCashOutAmountInputFocused, setIsCashOutAmountInputFocused] =
    useState(false);

  // FUNCTIONS
  const saveGameState = () => {
    const gameState = {
      amount,
    };
    localStorage.setItem("gameState", JSON.stringify(gameState));
  };

  const loadGameState = () => {
    const savedGameState = localStorage.getItem("gameState");
    if (savedGameState) {
      const { amount } = JSON.parse(savedGameState);
      setAmount(amount);
    } else {
      setAmount(5);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    // Allow only numbers and a single decimal point
    value = value.replace(/[^0-9.]/g, ""); // Only digits and decimal point
    value = value.replace(/^0+(\d)/, "$1"); // Remove leading zeros if followed by digits
    value = value.replace(/(\..*)\./g, "$1"); // Allow only one decimal point

    setAmount(+value); // Keep it as a string to handle cases like '5.'
  };

  const handleCashOutAmountChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    let value = e.target.value;

    // Allow only numbers and a single decimal point
    value = value.replace(/[^0-9.]/g, ""); // Only digits and decimal point
    value = value.replace(/^0+(\d)/, "$1"); // Remove leading zeros if followed by digits
    value = value.replace(/(\..*)\./g, "$1"); // Allow only one decimal point

    setCashOut(value); // Keep it as a string to handle cases like '5.'
  };

  // HOOKS
  useEffect(() => {
    loadGameState();
  }, []);

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
    } else {
      saveGameState();
    }
  }, [amount]);

  /// CRASH GAME ///
  // State
  const [uid] = useState<number>(Date.now());
  const [latency, setLatency] = useState<number>(0);
  const [onlineUsers, setOnlineUsers] = useState<number>(0);
  const [gameStatus, setGameStatus] = useState<GameStatus>(
    GameStatus.BETTING_ROUND,
  );
  const [points, setPoints] = useState<number>(0);
  const [roundId, setRoundId] = useState<number>(0);
  // const [amount, setAmount] = useState<string>('');
  // const [cashOut, setCashOut] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(0);
  const [showCountdown, setShowCountdown] = useState<boolean>(false);

  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const pingTimeoutRef = useRef<any | null>(null);
  const reconnectTimeoutRef = useRef<number>(2000);
  const reconnectAttemptRef = useRef<any | null>(null);
  const countdownIntervalRef = useRef<any | null>(null);
  const countdownStartedRef = useRef<boolean>(false);

  // const WS_URL = `ws://localhost:5000/connect?user_id=${uid}`;
  const WS_URL = "ws://173.212.232.122/connect?user_id=" + uid;

  // WebSocket connection management
  const connectWebSocket = () => {
    wsRef.current = new WebSocket(WS_URL);

    wsRef.current.onopen = () => {
      console.log("Connected to WebSocket");
      startPing(true);
      reconnectTimeoutRef.current = 3000;
    };

    wsRef.current.onmessage = async (event: MessageEvent) => {
      try {
        let decodedData: WebSocketMessage;

        if (event.data instanceof Blob) {
          const buffer = await event.data.arrayBuffer();
          decodedData = msgpack.decode(new Uint8Array(buffer));
        } else if (event.data instanceof ArrayBuffer) {
          decodedData = msgpack.decode(new Uint8Array(event.data));
        } else {
          console.warn("Received unknown data type:", event.data);
          return;
        }

        handleWebSocketMessage(decodedData);
      } catch (err) {
        console.error("Error decoding message:", err);
      }
    };

    wsRef.current.onclose = (event: CloseEvent) => {
      console.warn(`WebSocket closed: ${event.code}`);
      clearTimeout(pingTimeoutRef.current);
      reconnectWebSocket();
    };

    wsRef.current.onerror = (error: Event) => {
      console.error("WebSocket error:", error);
    };
  };

  // Handle incoming WebSocket messages
  const handleWebSocketMessage = (decodedData: WebSocketMessage) => {
    // Ping response (measure latency)
    if (decodedData["t"] === PING_BYTE) {
      const now = Date.now();
      setLatency((now - decodedData["x"]) / 2);
      return;
    }

    // Bet placed (only to user)
    if (decodedData["t"] === 2) {
      const userId = parseInt(decodedData["u"]);
      const amount = parseInt(decodedData["a"]);
      const currency = decodedData["c"];
      // Handle bet placed confirmation
      return;
    }

    // Bet not placed (only to user)
    if (decodedData["t"] === 4) {
      const userId = parseInt(decodedData["u"]);
      const amount = parseInt(decodedData["a"]);
      const currency = decodedData["c"];
      // Handle bet not placed
      return;
    }

    // Bet placed (broadcast to all)
    if (decodedData["t"] === 8) {
      const userId = parseInt(decodedData["u"]);
      const nickname = decodedData["n"];
      const amount = parseInt(decodedData["a"]);
      const currency = decodedData["c"];
      console.log("Bet placed", decodedData);
      return;
    }

    // Player won (broadcast to all)
    if (decodedData["t"] === 10) {
      const userId = parseInt(decodedData["u"]);
      const nickname = decodedData["n"];
      const amount = parseInt(decodedData["a"]);
      const currency = decodedData["c"];
      const points = parseFloat(decodedData["p"]);
      console.log("Win message", decodedData);
      return;
    }

    // Betting round starts
    if (decodedData["t"] === 18) {
      const roundId = parseInt(decodedData["r"]);
      const until = parseInt(decodedData["w"]);
      setGameProgress(roundId, GameStatus.BETTING_ROUND);
      betRoundStarts();
      betRoundCountdown(until);
      return;
    }

    // Betting round ends
    if (decodedData["t"] === 19) {
      const roundId = parseInt(decodedData["r"]);
      setGameProgress(roundId, GameStatus.END_BETTING_ROUND);
      betRoundEnd();
      return;
    }

    // New round created
    if (decodedData["t"] === 20) {
      const roundId = parseInt(decodedData["r"]);
      const hash = decodedData["h"];
      setRoundId(roundId);
      return;
    }

    // Rocket flying (broadcast to all)
    if (decodedData["t"] === 22) {
      const roundId = parseInt(decodedData["r"]);
      const points = parseFloat(decodedData["p"]);
      const sequence = parseInt(decodedData["q"]);
      setPoints(points);
      if (gameStatus !== GameStatus.PLAYING) {
        setGameProgress(roundId, GameStatus.PLAYING);
      }
      return;
    }

    // Rocket exploded (broadcast to all)
    if (decodedData["t"] === 24) {
      const roundId = parseInt(decodedData["r"]);
      const points = parseFloat(decodedData["p"]);
      const sequence = parseInt(decodedData["q"]);
      // Handle rocket explosion
      return;
    }

    // Online users count (broadcast to all)
    if (decodedData["t"] === 26) {
      const onlineUsers = parseInt(decodedData["o"]);
      setOnlineUsers(onlineUsers);
      return;
    }

    // Bet round timer (broadcast to all)
    if (decodedData["t"] === 28) {
      const roundId = parseInt(decodedData["r"]);
      const seconds = parseInt(decodedData["w"]);
      setRoundId(roundId);
      return;
    }
  };

  // Start ping interval
  const startPing = (isFirst: boolean) => {
    if (isFirst && wsRef.current?.readyState === WebSocket.OPEN) {
      const d = { t: PING_BYTE, x: Date.now() };
      const m = msgpack.encode(d);
      wsRef.current.send(m);
    }

    pingTimeoutRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        const d = { t: PING_BYTE, x: Date.now() };
        const m = msgpack.encode(d);
        wsRef.current.send(m);
      }
    }, PING_INTERVAL);
  };

  // Reconnect WebSocket with exponential backoff
  const reconnectWebSocket = () => {
    console.log(
      `reconnecting in ${reconnectTimeoutRef.current / 1000} seconds...`,
    );
    reconnectAttemptRef.current = setTimeout(() => {
      connectWebSocket();
      reconnectTimeoutRef.current = Math.min(
        reconnectTimeoutRef.current * 2,
        3000,
      );
    }, reconnectTimeoutRef.current);
  };

  // Set game progress
  const setGameProgress = (roundId: number, state: GameStatus) => {
    setRoundId(roundId);
    setGameStatus(state);
  };

  // Start bet round countdown
  const betRoundCountdown = (unixTime: number) => {
    if (countdownStartedRef.current) return;
    countdownStartedRef.current = true;

    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    countdownIntervalRef.current = setInterval(() => {
      const currentTime = Math.floor(Date.now() / 1000);
      const remainingTime = unixTime - currentTime;

      if (remainingTime <= 0) {
        clearInterval(countdownIntervalRef.current);
        setCountdown(0);
        countdownStartedRef.current = false;
      } else {
        setCountdown(remainingTime);
      }
    }, 1000);
  };

  // Show countdown elements
  const betRoundStarts = () => {
    setShowCountdown(true);
  };

  // Hide countdown elements
  const betRoundEnd = () => {
    setShowCountdown(false);
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    countdownStartedRef.current = false;
  };

  // Place bet handler
  const handleBet = () => {
    if (roundId < 1 || !wsRef.current) return;

    const betAmount = parseFloat(String(amount));
    const autoCashOut = parseFloat(cashOut);

    const data = {
      t: BET_REQUEST,
      r: roundId,
      a: isNaN(betAmount) ? 0 : betAmount,
      c: "USD",
      p: isNaN(autoCashOut) ? 0 : autoCashOut,
    };

    console.log("BET", data);

    const encoded = msgpack.encode(data);
    wsRef.current.send(encoded);
  };

  // Cash out handler
  const handleCashOut = () => {
    if (roundId < 1 || !wsRef.current) return;

    const data = {
      t: CASH_OUT_REQUEST,
      r: roundId,
    };

    console.log("CASH OUT", data);
    const encoded = msgpack.encode(data);
    wsRef.current.send(encoded);
  };

  // Setup and cleanup
  useEffect(() => {
    connectWebSocket();

    return () => {
      // Cleanup on component unmount
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (pingTimeoutRef.current) {
        clearTimeout(pingTimeoutRef.current);
      }
      if (reconnectAttemptRef.current) {
        clearTimeout(reconnectAttemptRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  const handleTabChange = (option: GameOptions) => {
    setGameMode(option);
  };

  return (
    <>
      <div className="game-frame">
        <div className="game-options">
          <div className="game-options__items">
            <div className="game-history-container">
              <BetHistory />
            </div>
            <GameOptionsTab onTabChange={handleTabChange} />
            <div className="games-options__content">
              <h2>Amount</h2>

              <div
                className={`games-options__amount ${isAmountInputFocused ? "focused" : ""}`}
              >
                <input
                  className="amount-input"
                  value={amount}
                  disabled={gameStatus === GameStatus.PLAYING}
                  onChange={handleAmountChange}
                  onFocus={() => setIsAmountInputFocused(true)}
                  onBlur={() => setIsAmountInputFocused(false)}
                  placeholder="Set amount"
                />

                <div className="amount-buttons">
                  <button
                    role="button"
                    className="amount-btn"
                    onClick={() => setAmount(+amount / 2)}
                    disabled={gameStatus === GameStatus.PLAYING}
                  >
                    1/2
                  </button>
                  <button
                    role="button"
                    className="amount-btn"
                    onClick={() => setAmount(+amount * 2)}
                    disabled={gameStatus === GameStatus.PLAYING}
                  >
                    2x
                  </button>
                  <button
                    role="button"
                    className="amount-btn"
                    onClick={() => setAmount(+amount * 3)}
                    disabled={gameStatus === GameStatus.PLAYING}
                  >
                    3x
                  </button>
                </div>
              </div>

              {gameMode === GameOptions.AUTO && (
                <>
                  <h2>Auto Cash Out</h2>
                  <div
                    className={`games-options__amount ${isCashOutAmountInputFocused ? "focused" : ""}`}
                  >
                    <input
                      className="amount-input amount-input--auto"
                      value={cashOut}
                      onChange={handleCashOutAmountChange}
                      onFocus={() => setIsCashOutAmountInputFocused(true)}
                      onBlur={() => setIsCashOutAmountInputFocused(false)}
                      placeholder="Set cash out amount"
                    />
                  </div>
                </>
              )}

              {gameStatus === GameStatus.PLAYING ? (
                <Button
                  onClick={handleCashOut}
                  amount={(+points * +amount).toFixed(2)}
                  label="Cash Out"
                />
              ) : (
                <Button
                  onClick={handleBet}
                  label="Bet"
                  amount={`${countdown} s`}
                />
              )}
            </div>
          </div>

          <div className="game-stats">
            <div className="game-stats__item">
              <span>latency: </span>
              <span>{latency.toFixed(2)}</span>
              <span> ms</span>
            </div>
            <div className="game-stats__item">
              <span>online: </span>
              <span>{onlineUsers}</span>
            </div>
          </div>
        </div>

        <div className="game-content">
          {/* <Wins history={history} /> */}
          {/* <WheelRoulette newSpin={newSpin} /> */}

          <CrashCanvas
            width={760}
            height={540}
            drawCaption={gameStatus === GameStatus.PLAYING}
            points={points}
          />

          <div className="game-content__status">
            {gameStatus !== GameStatus.PLAYING ? <h1>{gameStatus}</h1> : null}

            {showCountdown && (
              <div className="game-content__status__countdown">
                <span>Ends in: </span>
                <span>{countdown}</span>
              </div>
            )}

            <h1 style={{ margin: "10px 0 0 0", fontSize: "48px" }}>
              {points.toFixed(2)}x
            </h1>
          </div>
          {/* width={800} height={600} */}
        </div>
      </div>

      <div
        style={{
          fontFamily: "Arial, sans-serif",
          maxWidth: "600px",
          margin: "0 auto",
        }}
      >
        {/* Status bar */}
        <div style={{ marginBottom: "20px" }}>
          <div>
            <span style={{ fontWeight: "bold" }}>latency: </span>
            <span style={{ color: "green" }}>{latency.toFixed(2)}</span>
            <span> ms</span>
          </div>
          <div>
            <span style={{ fontWeight: "bold" }}>online: </span>
            <span style={{ color: "green" }}>{onlineUsers}</span>
          </div>
        </div>

        {/* Game area */}
        <div
          style={{
            height: "200px",
            width: "100%",
            backgroundColor: "burlywood",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: "20px",
            borderRadius: "8px",
            padding: "20px",
            boxSizing: "border-box",
          }}
        >
          <h1 style={{ margin: "0 0 10px 0" }}>{gameStatus}</h1>

          {showCountdown && (
            <div style={{ marginBottom: "10px" }}>
              <span style={{ fontSize: "26px", fontWeight: "bold" }}>
                Ends in:{" "}
              </span>
              <span style={{ fontSize: "26px", fontWeight: "bold" }}>
                {countdown}
              </span>
            </div>
          )}

          <h1 style={{ margin: "10px 0 0 0", fontSize: "48px" }}>
            {points.toFixed(2)}x
          </h1>
        </div>

        {/* Controls */}
        <div
          style={{
            height: "auto",
            width: "100%",
            backgroundColor: "gold",
            padding: "20px",
            borderRadius: "8px",
            boxSizing: "border-box",
          }}
        >
          <div style={{ marginBottom: "10px" }}>
            <label htmlFor="amount" style={{ marginRight: "10px" }}>
              Amount
            </label>
            <input
              id="amount"
              placeholder="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(+e.target.value)}
              style={{ padding: "5px" }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label htmlFor="cashOut" style={{ marginRight: "10px" }}>
              Auto Cashout
            </label>
            <input
              id="cashOut"
              placeholder="cashOut"
              type="number"
              value={cashOut}
              onChange={(e) => setCashOut(e.target.value)}
              style={{ padding: "5px" }}
            />
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              id="bet"
              style={{ width: "100px", padding: "8px" }}
              type="button"
              onClick={handleBet}
              disabled={roundId < 1}
            >
              BET
            </button>

            <button
              id="btn_cashout"
              style={{ width: "100px", padding: "8px" }}
              type="button"
              onClick={handleCashOut}
              disabled={roundId < 1}
            >
              Cashout
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
