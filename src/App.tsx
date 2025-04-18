import { useEffect, useRef, useState } from "react";
import * as msgpack from "msgpack-lite";
import userIcon from './assets/user-128.svg';

import "./App.css";
// import GameOptionsTab, {
//   GameOptions,
// } from "./ui/GameOptionsTab/GameOptionsTab";
import Button from "./ui/Button";
import CrashCanvas from "./components/Crash/CrashCanvas";
// import BetHistory from "./components/BetHistory/BetHistory";
import { Bet, Win } from "./models";
import NetworkStatus from "./components/NetworkStatus/NetworkStatus";

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

export enum GameStatus {
  PLAYING = "PLAYING",
  WAITING = "WAITING",
  CANCELLED = "CANCELLED",
  BETTING_ROUND = "BETTING_ROUND",
  END_BETTING_ROUND = "END_BETTING_ROUND",
}

function App() {
  const isMounted = useRef(false);
  // const [gameMode, setGameMode] = useState<GameOptions>(GameOptions.MANUAL);
  const [dimensions, setDimensions] = useState({ width: 420, height: 320 });

  const [amount, setAmount] = useState<number>(5);
  const [time, setTime] = useState<number>(0);
  const [isAmountInputFocused, setIsAmountInputFocused] = useState(false);
  const [cashOut, setCashOut] = useState<string>("");
  const [winSate, setWinState] = useState<{status: string, data: Win}>({ status: "", data: new Win(0, "", "", 0, 0, 0) });
  const [betState, setBetState] = useState<{ status: string, bet: Bet, roundId: number }>({ status: "", roundId: 0, bet: new Bet(0, "", "", 0, 0) });
  const [isCashOutAmountInputFocused, setIsCashOutAmountInputFocused] = useState(false);
  const [winTimeout, setWinTimeout] = useState<boolean>(null);
  const [betRoundSeconds, setBetRoundSeconds] = useState<number>(0);
  
    useEffect(() => {
      const handleResize = () => {
      if (window.innerWidth < 420) {
        setDimensions({
          width: window.innerWidth * 0.9 ,//* 0.9,
          height: window.innerWidth  //* (4 / 5),
        });
      } else {
        setDimensions({
          width: window.innerWidth * 0.7,
          height: window.innerWidth * 0.5 * (3 / 4), 
        });
      }
    };

    // Set initial dimensions
    handleResize();

    // Optionally, add event listener for window resize
    window.addEventListener('resize', handleResize);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // FUNCTIONS
  const saveGameState = () => {
    const gameState = {
      amount,
    };
    localStorage.setItem("gameState", JSON.stringify(gameState));
    localStorage.setItem("betState", JSON.stringify(betState));
  };

  const loadGameState = () => {
    const savedGameState = localStorage.getItem("gameState");
    const savedBetState = localStorage.getItem("betState");
    if (savedBetState) {
      const parsedSavedBetState = JSON.parse(savedBetState);
      console.log("roundId", roundId);
      console.log("parsedSavedBetState.roundId", parsedSavedBetState.roundId);
      if (roundId === parsedSavedBetState.roundId) {
        console.log("Loading saved bet state:", parsedSavedBetState);
        setBetState({ status: parsedSavedBetState.status, roundId: parsedSavedBetState.roundId, bet: parsedSavedBetState.bet });
      }
    }
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
  }, [amount, betState]);

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
  const [showCountdown, setShowCountdown] = useState<boolean>(false);

  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const pingTimeoutRef = useRef<any | null>(null);
  const reconnectTimeoutRef = useRef<number>(2000);
  const reconnectAttemptRef = useRef<any | null>(null);
  const countdownIntervalRef = useRef<any | null>(null);
  const countdownStartedRef = useRef<boolean>(false);

  // const WS_URL = `ws://localhost:5000/connect?user_id=${uid}`;
  const WS_URL = "wss://crash.flexgaming.net/connect?is_dev=true&user_id=" + uid; // 

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
      // reconnectWebSocket();
    };

    wsRef.current.onerror = (error: Event) => {
      console.error("WebSocket error:", error);
    };
  };

  // Handle incoming WebSocket messages
  const handleWebSocketMessage = (decodedData: WebSocketMessage) => {
    // Ping response (measure latency)
    if (decodedData["t"] === PING_BYTE) {
      console.log("PING response (measure latency)", decodedData);

      const now = Date.now();
      setLatency((now - decodedData["x"]) / 2);
      return;
    }

    // Bet placed (only to user)
    if (decodedData["t"] === 2) {
      console.log("Bet placed  (only to user)", decodedData);

      const userId = parseInt(decodedData["u"]);
      const amount = parseInt(decodedData["a"]);
      const currency = decodedData["c"];
      console.log("userId", userId);
      console.log("amount", amount);
      console.log("currency", currency);
      // Handle bet placed confirmation
      return;
    }

    // Bet not placed (only to user)
    if (decodedData["t"] === 4) {
      console.log("Bet not placed (only to user)", decodedData);

      const userId = parseInt(decodedData["u"]);
      const amount = parseInt(decodedData["a"]);
      const currency = decodedData["c"];
      console.log("userId", userId);
      console.log("amount", amount);
      console.log("currency", currency);
      // Handle bet not placed
      return;
    }

    // Bet placed (broadcast to all)
    if (decodedData["t"] === 8) {
      console.log("Bet placed", decodedData);

      const userId = parseInt(decodedData["u"]);
      const nickname = decodedData["n"];
      const amount = parseInt(decodedData["a"]);
      const currency = decodedData["c"];
      setBetState({ status: "placed", roundId, bet: new Bet(amount, currency, nickname, 0, userId) });
      return;
    }

    // Player won (broadcast to all)
    if (decodedData["t"] === 10) {
      console.log("Player won", decodedData);

      const userId = parseInt(decodedData["u"]);
      const nickname = decodedData["n"];
      const amount = parseInt(decodedData["a"]);
      const currency = decodedData["c"];
      const points = parseFloat(decodedData["p"]);
      console.log("Win message", decodedData);
      setWinState({ status: "won", data: new Win(amount, currency, nickname, points, 0, userId) });
      setBetState({ status: "won", roundId, bet: betState.bet });
      setWinTimeout(true);

      setTimeout(() => {
        setWinTimeout(false);
      }, 2000);

      return;
    }

    // Betting round starts
    if (decodedData["t"] === 18) {
      console.log("Betting round starts", decodedData);
      
      const roundId = parseInt(decodedData["r"]);

      setBetState({ status: "", roundId, bet: new Bet(0, "", "", 0, 0) });
      setWinState({ status: "", data: new Win(0, "", "", 0, 0, 0) });
      setGameProgress(roundId, GameStatus.BETTING_ROUND);
      betRoundStarts();

      return;
    }

    // Betting round ends
    if (decodedData["t"] === 19) {
      console.log("Betting round ends", decodedData);
      if (betState.status === 'placed') {
        setBetState( () => ({ status: "placed", roundId, bet: betState.bet }) );
      }
      const roundId = parseInt(decodedData["r"]);
      setGameProgress(roundId, GameStatus.END_BETTING_ROUND);
      betRoundEnd();
      return;
    }

    // New round created
    if (decodedData["t"] === 20) {
      console.log("New round created", decodedData);

      const roundId = parseInt(decodedData["r"]);
      const hash = decodedData["h"];
      console.log("hash", hash);
      setRoundId(roundId);
      return;
    }

    // Rocket flying (broadcast to all)
    if (decodedData["t"] === 22) {
      const roundId = parseInt(decodedData["r"]);
      const points = parseFloat(decodedData["p"]);
      // const sequence = parseInt(decodedData["q"]);
      const time = parseInt(decodedData["e"]); //elapsed ms
      // console.log("roundId", roundId);
      // console.log("points", points);
      // console.log("sequence", sequence);

      setPoints(points);
      setTime(time);
      if (gameStatus !== GameStatus.PLAYING) {
        setGameProgress(roundId, GameStatus.PLAYING);
      }
      return;
    }

    //     if (decodedData["t"] === 22) {
    //     let roundId = parseInt(decodedData["r"])
    //     let points = parseFloat(decodedData["p"])
    //     let elapsed = parseInt(decodedData["e"]) //elapsed ms

    //     setPointsUp(points)
    //     if(_roundState !== "PLAYING") {
    //         setGameProgress(roundId, "PLAYING")
    //     }
    // }

    // Rocket exploded (broadcast to all)
    if (decodedData["t"] === 24) {
      console.log("Rocket exploded", decodedData);
      const roundId = parseInt(decodedData["r"]);
      const points = parseFloat(decodedData["p"]);
      const sequence = parseInt(decodedData["q"]);
      console.log("roundId", roundId);
      console.log("points", points);
      console.log("sequence", sequence);

      setPoints(points);
      setBetState({ status: "lost", roundId, bet: betState.bet });
      setGameProgress(roundId, GameStatus.CANCELLED);
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

      setBetRoundSeconds(seconds);
      setRoundId(roundId);
      return;
    }

//         if (decodedData["t"] === 30) {
//                   let roundId = parseInt(decodedData["r"])
//                   let p = parseInt(decodedData["p"])
//                   let s = parseInt(decodedData["s"]) // 0= upcoming, 1=current, 4= finished, 5= canceled
//                   console.log(decodedData)
//         }
    
// // ეს თამაშების ისტორიისთვის და
// // და ეს 2 ივენთი კიდე:
// // / ფსონი თუ დაიდება მოვა ეს ივენთი (მხოლოდ იუზერს ეგზავნება)
//               if (decodedData["t"] === 2) {
//                  let roundId = parseInt(decodedData["r"]);
//                  let userId = parseInt(decodedData["u"]);
//                  let amount = parseInt(decodedData["a"])
//                  let currency = decodedData["c"]
//                  let balance = decodedData["b"]

//                   console.log("your bet accepted", decodedData)
//               }

// //               // ფსონი თუ არ დაიდება (მხოლოდ იუზერს ეგზავნება)
//               if (decodedData["t"] === 4) {
//                   let roundId = parseInt(decodedData["r"]);
//                   let userId = parseInt(decodedData["u"]);
//                   let amount = parseInt(decodedData["a"])
//                   let currency = decodedData["c"]
//                   let balance = decodedData["b"]
//                   let errorCode = decodedData["e"]

//                   console.log("your bet rejected", decodedData)
//               }
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
              console.log("PING", );
      }
    }, PING_INTERVAL);
  };

  // Reconnect WebSocket with exponential backoff
  // const reconnectWebSocket = () => {
  //   console.log(
  //     `reconnecting in ${reconnectTimeoutRef.current / 1000} seconds...`,
  //   );
  //   reconnectAttemptRef.current = setTimeout(() => {
  //     connectWebSocket();
  //     reconnectTimeoutRef.current = Math.min(
  //       reconnectTimeoutRef.current * 2,
  //       3000,
  //     );
  //   }, reconnectTimeoutRef.current);
  // };

  // Set game progress
  const setGameProgress = (roundId: number, state: GameStatus) => {
    console.log("setGameProgress", state);
    setRoundId(roundId);
    setGameStatus(state);
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
      // c: "USD",
      p: isNaN(autoCashOut) ? 0 : autoCashOut,
    };
    console.log("BET", data);
    

    const encoded = msgpack.encode(data);
    wsRef.current.send(encoded);
  };

  // Cash out handler
  const handleCashOut = () => {
    if (roundId < 1 || !wsRef.current || winSate.status === 'won') return;

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

  // const handleTabChange = (option: GameOptions) => {
  //   setGameMode(option);
  // };

  return (
    <>
      <div className="game-frame">
        <div className="game-options">
          <div className="game-options__items">
            {/* <div className="game-history-container">
              <BetHistory />
            </div> */}
            {/* <GameOptionsTab onTabChange={handleTabChange} /> */}
            <div className="games-options__content">
              <div className="games-options__actions__btn">
                {gameStatus === GameStatus.PLAYING ? (
                    betState.status === 'placed' ? (
                      <Button
                        onClick={handleCashOut}
                        amount={winSate.status === 'won' ? winSate.data.amount.toFixed(2) : (+points * +amount).toFixed(2)}
                        label={winSate.status === 'won' ? 'You Win!' : "Cash Out"}
                      />
                    ) : (
                      <Button
                        label="Waiting next round"
                      />
                  ) 
                ) : (
                  <Button
                    onClick={handleBet}
                    label={`${betState.status === 'placed' ? 'placed' : 'bet'}`}
                    amount={`${betRoundSeconds} s`}
                    disabled={betState.status === 'placed' || gameStatus !== GameStatus.BETTING_ROUND}
                  />
                )}
              </div>

              <div className="games-options__actions__configs">
                <div className="games-options__input">
                  <h2>Amount</h2>
                  <div
                    className={`games-options__amount ${isAmountInputFocused ? "focused" : ""}`}
                    >
                    <input
                      className="amount-input"
                      value={amount}
                      disabled={betState.status === 'placed'}
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
                        disabled={betState.status === 'placed'}
                      >
                        1/2
                      </button>
                      <button
                        role="button"
                        className="amount-btn"
                        onClick={() => setAmount(+amount * 2)}
                        disabled={betState.status === 'placed'}
                      >
                        2x
                      </button>
                      <button
                        role="button"
                        className="amount-btn"
                        onClick={() => setAmount(+amount * 3)}
                        disabled={betState.status === 'placed'}
                      >
                        3x
                      </button>
                    </div>
                  </div>
                </div>

                {/* {gameMode === GameOptions.AUTO && ( */}
                  <div className="games-options__input">
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
                        disabled={betState.status === 'placed'}
                      />
                    </div>
                  </ div>
                {/* )} */}
              </div>
              
            </div>
          </div>
        </div>

        <div className="game-content">
          {/* <Wins history={history} /> */}
          {/* <WheelRoulette newSpin={newSpin} /> */}

          <div className="game-stats">
            <div className="game-stats__item">
              <div className="game-stats__item__icon">
                <img  src={userIcon} alt="user-icon" width={16} height={16} />:
              </div>
              <span>{onlineUsers}</span>
            </div>
            <div className="game-stats__item">
              <NetworkStatus latency={latency} />
            </div>
          </div>

          <CrashCanvas
            width={dimensions.width}
            height={dimensions.height}
            // drawCaption={gameStatus === GameStatus.PLAYING}
            points={points}
            time={time}
            gameStatus={gameStatus}
          />

          <div className="game-content__status">
              <h1 style={{ margin: "10px 0 0 0", fontSize: "48px" }}>
                { showCountdown ? "left " + betRoundSeconds + 's' : betState.status === 'lost' ? 'Crashed' : points.toFixed(2) + "x"  }{}
              </h1>
          </div>

            {betState.status === 'won' && winTimeout && (
              <div className="game-content__win visible">
                <span>
                  Win {winSate.data.amount.toFixed(2)} {winSate.data.currency}!
                </span>
              </div>
           )} 

          {/* width={800} height={600} */}
        </div>
      </div>
    </>
  );
}

export default App;
