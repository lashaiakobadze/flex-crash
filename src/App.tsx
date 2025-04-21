import { useCallback, useEffect, useRef, useState } from "react";
import * as msgpack from "msgpack-lite";

import "./App.css";
// import GameOptionsTab, {
//   GameOptions,
// } from "./ui/GameOptionsTab/GameOptionsTab";
import Button from "./ui/Button";
import CrashCanvas from "./components/Crash/CrashCanvas";
// import BetHistory from "./components/BetHistory/BetHistory";
import { Bet, Win } from "./models";
import NetworkStatus from "./components/NetworkStatus/NetworkStatus";
import { ColorPicker } from "./components/ColorPicker/ColorPicker";
import { Icon } from "./ui/Icon";
import { Dropdown } from "./components/Dropdown/Dropdown";
import BetHistory from "./components/BetHistory/BetHistory";
import Wins from "./components/Wins/Wins";
import { Player } from "./context/AuthContext";
import { Round, RoundStatus } from "./models/round-history";
import { truncateNickname } from "./utils/format";

// Constants
const PING_INTERVAL = 8000;
const PING_BYTE = 0x9;
const BET_REQUEST = 50;
const CASH_OUT_REQUEST = 52;

// Types
type WebSocketMessage = { t: number; [key: string]: any };

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

  // State declarations
  const [player, setPlayerData] = useState<Player | null>({
    playerId: 0,
    nickname: "",
    balance: 0,
    seed: "",
  });
  const [amount, setAmount] = useState<number>(5);
  const [cashOut, setCashOut] = useState<string>("");
  const [roundId, setRoundId] = useState<number>(0);
  const [nextRoundBetState, setNextRoundBetState] = useState(false);

  // Refs for synchronous access
  const playerRef = useRef(player);
  const amountRef = useRef<number>(amount);
  const cashOutRef = useRef<string>(cashOut);
  const roundIdRef = useRef<number>(roundId);
  const nextRoundBetRef = useRef<boolean>(nextRoundBetState);

  // Keep refs in sync with state
  useEffect(() => {
    amountRef.current = amount;
    cashOutRef.current = cashOut;
    roundIdRef.current = roundId;
    nextRoundBetRef.current = nextRoundBetState;
    playerRef.current = player;
  }, [amount, cashOut, roundId, nextRoundBetState]);

  const [time, setTime] = useState<number>(0);
  const [isAmountInputFocused, setIsAmountInputFocused] = useState(false);
  const [winSate, setWinState] = useState<{ status: string; data: Win }>({
    status: "",
    data: new Win(0, "", "", 0, 0, 0),
  });
  const [betState, setBetState] = useState<{ status: string; bet: Bet; roundId: number }>({
    status: "",
    roundId: 0,
    bet: new Bet(0, "", "", 0, 0),
  });

  const [isCashOutAmountInputFocused, setIsCashOutAmountInputFocused] = useState(false);
  const [winTimeout, setWinTimeout] = useState<boolean>(null);

  const [countdown, setCountdown] = useState(0); // Stores remaining time in milliseconds

  const [roundBetHistory, setRoundBetHistory] = useState<Round[]>([]);
  const [currentRound, setCurrentRound] = useState<Round | null>(null);

  const [currentBets, setCurrentBets] = useState<Bet[]>([]);
  const [totalBets, setTotalBets] = useState<{ count: number; totalBetAmount: number }>();

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Tab regained focus - check connection
        if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
          connectWebSocket();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        const newTime = prev - 100; // Decrease by 100ms (0.1s)
        return newTime >= 0 ? newTime : 0;
      });
    }, 100); // Update every 100ms

    return () => clearInterval(interval);
  }, [countdown]);

  const startCountdown = (durationSeconds: number) => {
    setCountdown(durationSeconds * 1000);
    setShowCountdown(true);
  };

  const formatCountdown = (ms: number) => {
    const seconds = (ms / 1000).toFixed(1); // Shows 1 decimal place
    return `${seconds}`;
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 420) {
        setDimensions({
          width: window.innerWidth * 0.9, //* 0.9,
          height: window.innerWidth, //* (4 / 5),
        });
      } else {
        setDimensions({ width: window.innerWidth * 0.7, height: window.innerHeight * 0.5 });
      }
    };

    // Set initial dimensions
    handleResize();

    // Optionally, add event listener for window resize
    window?.addEventListener("resize", handleResize);

    // Cleanup event listener on component unmount
    return () => {
      window?.removeEventListener("resize", handleResize);
    };
  }, []);

  // FUNCTIONS
  const saveGameState = () => {
    const gameState = { amount };
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
        setBetState({
          status: parsedSavedBetState.status,
          roundId: parsedSavedBetState.roundId,
          bet: parsedSavedBetState.bet,
        });
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

  const handleCashOutAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
  const [latency, setLatency] = useState<number>(0);
  const [onlineUsers, setOnlineUsers] = useState<number>(0);
  const [gameStatus, setGameStatus] = useState<GameStatus>(GameStatus.BETTING_ROUND);
  const [points, setPoints] = useState<number>(0);
  const [showCountdown, setShowCountdown] = useState<boolean>(false);

  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const pingTimeoutRef = useRef<any | null>(null);
  const reconnectTimeoutRef = useRef<number>(2000); // ???
  const reconnectAttemptRef = useRef<any | null>(null);

  const WS_URL =
    "wss://crash.flexgaming.net/launch?game_id=crash&user=example_user_id&token=operator_token_example&currency=USD&free_play=1"; //  is_dev=true&user_id= +

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
    // user info
    if (decodedData["t"] === 1) {
      const avatarUrl = parseInt(decodedData["a"]);
      const balance = parseInt(decodedData["b"]);
      const playerId = parseInt(decodedData["i"]);
      const nickname = decodedData["n"];
      const seed = decodedData["s"];

      console.log("1: user info ", { playerId, nickname, balance, seed, avatarUrl }, decodedData);
      setPlayerData({ playerId, nickname, balance, seed });
    }

    // Ping response (measure latency)
    if (decodedData["t"] === PING_BYTE) {
      console.log("PING response (measure latency)", decodedData);

      const now = Date.now();
      setLatency((now - decodedData["x"]) / 2);
      return;
    }

    // Bet placed (only to user)
    if (decodedData["t"] === 2) {
      const userId = parseInt(decodedData["u"]);
      const amount = parseInt(decodedData["a"]);
      const currency = decodedData["c"];
      const balance = decodedData["b"];
      const roundId = parseInt(decodedData["r"]);

      setBetState({
        status: "placed",
        roundId,
        bet: new Bet(amount, currency, player.nickname, 0, userId),
      });

      console.log("2", { userId, amount, currency, balance, roundId }, decodedData);
      return;
    }

    // Bet not placed (only to user)
    if (decodedData["t"] === 4) {
      const userId = parseInt(decodedData["u"]);
      const amount = parseInt(decodedData["a"]);
      const currency = decodedData["c"];
      let roundId = parseInt(decodedData["r"]);
      let balance = decodedData["b"];
      let errorCode = decodedData["e"]; // handle errors from here

      console.log("4", { userId, amount, currency, roundId, balance, errorCode }, decodedData);
      return;
    }

    // Bet placed (broadcast to all)
    if (decodedData["t"] === 8) {
      const newBet: Bet = {
        userId: parseInt(decodedData["u"]),
        nickname: decodedData["n"],
        amount: parseInt(decodedData["a"]),
        currency: decodedData["c"],
        status: "placed",
        time: Date.now(),
        roundId: currentRound?.r,
      };

      if (newBet.userId === playerRef.current.playerId) {
        setBetState({
          status: "placed",
          roundId,
          bet: new Bet(amount, newBet.currency, player.nickname, 0, newBet.userId),
        });
      }

      addNewBet(newBet);
      console.log(8, "New bet placed", newBet, decodedData);
      return;
    }

    // Player won (broadcast to all)
    if (decodedData["t"] === 10) {
      const wonBet: Bet = {
        userId: parseInt(decodedData["u"]),
        nickname: decodedData["n"],
        amount: parseInt(decodedData["a"]),
        currency: decodedData["c"],
        points: parseFloat(decodedData["p"]),
        status: "won",
        time: Date.now(),
        roundId: currentRound?.r,
      };

      updateWinningBet(wonBet);

      // Handle player-specific win state
      if (wonBet.userId === playerRef.current.playerId) {
        setWinState({
          status: "won",
          data: new Win(
            wonBet.amount,
            wonBet.currency,
            wonBet.nickname,
            wonBet.points,
            0,
            wonBet.userId
          ),
        });

        setBetState({ status: "won", roundId, bet: betState.bet });
        setWinTimeout(true);
        setTimeout(() => setWinTimeout(false), 3000);
      }

      console.log(10, "Bet won", wonBet, decodedData);

      return;
    }

    // Betting round starts
    if (decodedData["t"] === 18) {
      const roundId = parseInt(decodedData["r"]);
      const secondBeforeStart = parseInt(decodedData["s"]);

      setCurrentBets([]);
      setTotalBets({ count: 0, totalBetAmount: 0 });
      startCountdown(secondBeforeStart);
      setGameProgress(roundId, GameStatus.BETTING_ROUND);
      setRoundIdAndRef(roundId);

      // Now reads the latest value, not a stale one:
      if (nextRoundBetRef.current) {
        handleBet();
        setNextRoundBetState(false);
      }

      console.log("18", { roundId, decodedData }); // betting round starts time form here

      return;
    }

    // Betting round ends
    if (decodedData["t"] === 19) {
      // if (betState.status === "placed") {
      //   setBetState(() => ({ status: "placed", roundId, bet: betState.bet }));
      // }

      const roundId = parseInt(decodedData["r"]);
      setGameProgress(roundId, GameStatus.END_BETTING_ROUND);
      setShowCountdown(false);

      console.log("19", { roundId, decodedData });

      return;
    }

    // New round created
    if (decodedData["t"] === 20) {
      const roundId = parseInt(decodedData["r"]);
      const hash = decodedData["h"];
      setRoundIdAndRef(roundId);

      console.log("20", { roundId, hash }, decodedData);
      return;
    }

    // Rocket flying (broadcast to all)
    if (decodedData["t"] === 22) {
      const roundId = parseInt(decodedData["r"]);
      const points = parseFloat(decodedData["p"]);
      const time = parseInt(decodedData["e"]);

      setPoints(points);
      setTime(time);

      if (gameStatus !== GameStatus.PLAYING) {
        setGameProgress(roundId, GameStatus.PLAYING);
      }

      // console.log("22", { roundId, points, time }, decodedData);

      return;
    }

    // Rocket exploded (broadcast to all)
    if (decodedData["t"] === 24) {
      const finishedRound: Round = {
        r: parseInt(decodedData["r"]),
        p: decodedData["p"].toString(),
        s: RoundStatus.FINISHED,
      };

      handleRoundData([finishedRound]);

      // Update game state
      setPoints(parseFloat(decodedData["p"]));
      setBetState({ status: "lost", roundId: finishedRound.r, bet: betState.bet });
      setGameProgress(finishedRound.r, GameStatus.CANCELLED);

      console.log(24, "Round finished", finishedRound);
    }

    // Online users count (broadcast to all)
    if (decodedData["t"] === 26) {
      const onlineUsers = parseInt(decodedData["o"]);
      setOnlineUsers(onlineUsers);

      console.log("26", { onlineUsers }, decodedData);
      return;
    }

    // Bet round timer (broadcast to all)
    if (decodedData["t"] === 28) {
      const roundId = parseInt(decodedData["r"]);
      const secondBeforeStart = parseInt(decodedData["w"]); // fix secondBeforeStart are send only

      setWinState({ status: "", data: new Win(0, "", "", 0, 0, 0) });
      console.log("Round id with timer", parseInt(decodedData["r"]));

      if (!countdown) {
        console.log("Bet round timer", secondBeforeStart);
        startCountdown(secondBeforeStart);
      }
      setRoundIdAndRef(roundId);
      setGameProgress(roundId, GameStatus.BETTING_ROUND);

      console.log("28", { roundId, secondBeforeStart }, decodedData);
      return;
    }

    // Message type 30 (initial/bulk round data)
    if (decodedData["t"] === 30) {
      const roundsData: Round[] = decodedData["d"] || [];
      handleRoundData(roundsData);
      console.log(30, "Initial rounds loaded", roundsData);
    }

    // ფსონი თუ არ დაიდება (მხოლოდ იუზერს ეგზავნება)
    if (decodedData["t"] === 4) {
      let roundId = parseInt(decodedData["r"]);
      let userId = parseInt(decodedData["u"]);
      let amount = parseInt(decodedData["a"]);
      let currency = decodedData["c"];
      let balance = decodedData["b"];
      let errorCode = decodedData["e"];

      console.log("4", { roundId, userId, amount, currency, balance, errorCode }, decodedData);
    }
  };

  // // Start ping interval
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
        console.log("PING");
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

  const handleRoundData = (roundsData: Round[]) => {
    setRoundBetHistory((prevRounds) => {
      const roundMap = new Map<number, Round>();

      prevRounds.forEach((round) => roundMap.set(round.r, round));

      roundsData.forEach((round) => {
        if (round.s === RoundStatus.FINISHED) {
          roundMap.set(round.r, round);
        }
      });

      return Array.from(roundMap.values())
        .filter((round) => round.s === RoundStatus.FINISHED)
        .sort((a, b) => b.r - a.r) // Sort by round ID descending (newest first)
        .slice(0, 50); // Keep only first 50 items
    });

    // Track current round separately
    const currentRound = roundsData.find(
      (round) => round.s === RoundStatus.CURRENT || round.s === RoundStatus.UPCOMING
    );
    if (currentRound) setCurrentRound(currentRound);
  };

  // Utility function to sort and limit bets
  const processBets = (bets: Bet[]): Bet[] => {
    setTotalBets({
      count: bets.length,
      totalBetAmount: bets.reduce((acc, bet) => acc + bet.amount, 0),
    });

    return [...bets]
      .sort((a, b) => b.amount - a.amount) // Sort by amount (highest first)
      .slice(0, 50); // Keep only first 50
  };

  // 1. When adding new bets
  const addNewBet = (newBet: Bet) => {
    setCurrentBets((prev) => processBets([...prev, newBet]));
  };

  // 2. When updating winning bets
  const updateWinningBet = (wonBet: Bet) => {
    setCurrentBets((prev) =>
      processBets(prev.map((bet) => (bet.userId === wonBet.userId ? { ...bet, ...wonBet } : bet)))
    );
  };

  const setRoundIdAndRef = useCallback((newId: number) => {
    setRoundId(newId);
    roundIdRef.current = newId; // Manual sync
  }, []);

  // Set game progress
  const setGameProgress = (roundId: number, state: GameStatus) => {
    setRoundIdAndRef(roundId);
    setGameStatus(state);
  };

  const handleNextRoundBet = () => {
    setNextRoundBetState((prev) => {
      const next = !prev;
      nextRoundBetRef.current = next;
      return next;
    });
  };

  // Place bet handler
  const handleBet = useCallback(() => {
    if (roundIdRef.current < 1 || !wsRef.current) return;

    const betAmount = parseFloat(String(amountRef.current));
    const autoCashOut = parseFloat(cashOutRef.current);

    console.log("handleBet", roundIdRef.current, roundIdRef.current);
    console.log("handleBet", betAmount, autoCashOut);

    const data = {
      t: BET_REQUEST,
      r: roundIdRef.current,
      a: isNaN(betAmount) ? 0 : betAmount,
      // c: "USD",
      p: isNaN(autoCashOut) ? 0 : autoCashOut,
    };

    const encoded = msgpack.encode(data);
    wsRef.current.send(encoded);
  }, []);

  // Cash out handler
  const handleCashOut = () => {
    if (roundId < 1 || !wsRef.current || winSate.status === "won") return;

    const data = { t: CASH_OUT_REQUEST, r: roundId, a: !!cashOut };

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
    };
  }, []);

  // const handleTabChange = (option: GameOptions) => {
  //   setGameMode(option);
  // };

  return (
    <>
      <div className="game-frame">
        <div className="game-history-container">
          <BetHistory currentBets={currentBets} onlineUsers={onlineUsers} totalBets={totalBets} />
        </div>

        <div className="game-area">
          <div className="game-content">
            <div className="game-stats">
              <div className="game-stats__left">
                <div className="game-stats__item">
                  <div className="game-stats__item__icon">
                    <Icon type="user" size={18} />:
                  </div>
                  <span>{onlineUsers}</span>
                </div>
                <div className="game-stats__item">
                  <NetworkStatus latency={latency} />
                </div>
              </div>

              <div className="game-state__round-history game-state__round-history--desktop">
                <Wins history={roundBetHistory.reverse()} />
              </div>

              <div className="game-stats__item">
                <Dropdown
                  trigger={
                    <div className="game-stats__item__icon">
                      <Icon type="settings" size={18} />
                    </div>
                  }
                >
                  <ColorPicker />
                </Dropdown>
                <span>{truncateNickname(player.nickname, 12)}</span>
              </div>
            </div>

            <div className="game-state__round-history game-state__round-history--mobile">
              <Wins history={roundBetHistory.reverse()} />
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
              <span>
                {showCountdown && countdown > 0 ? (
                  `Starts in ${formatCountdown(countdown)} s`
                ) : (
                  <span
                    style={{
                      color:
                        betState.status === "lost" && gameStatus !== GameStatus.PLAYING
                          ? "red"
                          : "",
                    }}
                  >
                    {points.toFixed(2)}x{" "}
                  </span>
                )}
                {}
              </span>
            </div>

            {betState.status === "won" && winTimeout && (
              <div className="game-content__win visible">
                <span>
                  Win {winSate.data.amount.toFixed(2)} {winSate.data.currency}!
                </span>
              </div>
            )}
          </div>

          <div className="game-options">
            <div className="game-options__items">
              {/* <GameOptionsTab onTabChange={handleTabChange} /> */}
              <div className="games-options__content">
                <div className="games-options__actions__btn">
                  {gameStatus === GameStatus.PLAYING ? (
                    betState.status === "placed" ? (
                      <Button
                        onClick={handleCashOut}
                        amount={
                          winSate.status === "won"
                            ? winSate.data.amount.toFixed(2)
                            : (+points * +betState.bet.amount).toFixed(2)
                        }
                        label={winSate.status === "won" ? "You Win!" : "Cash Out"}
                      />
                    ) : (
                      <Button
                        label={nextRoundBetState ? "Cancel" : "Bet (next round)"}
                        onClick={handleNextRoundBet}
                      />
                    )
                  ) : (
                    <Button
                      onClick={nextRoundBetState ? handleNextRoundBet : handleBet}
                      label={`${betState.status === "placed" ? "Placed" : nextRoundBetState ? "Cancel" : gameStatus === GameStatus.CANCELLED ? "waiting" : "Bet"}`}
                      disabled={
                        betState.status === "placed" || gameStatus !== GameStatus.BETTING_ROUND
                      }
                    />
                  )}
                </div>

                <div className="games-options__actions__configs">
                  <div className="games-options__input">
                    <h2 className="games-options__input__title">Amount</h2>
                    <div
                      className={`games-options__amount ${isAmountInputFocused ? "focused" : ""}`}
                    >
                      <input
                        className="amount-input"
                        value={amount}
                        disabled={betState.status === "placed" || nextRoundBetState}
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
                          disabled={betState.status === "placed" || nextRoundBetState}
                        >
                          1/2
                        </button>
                        <button
                          role="button"
                          className="amount-btn"
                          onClick={() => setAmount(+amount * 2)}
                          disabled={betState.status === "placed" || nextRoundBetState}
                        >
                          2x
                        </button>
                        <button
                          role="button"
                          className="amount-btn"
                          onClick={() => setAmount(+amount * 3)}
                          disabled={betState.status === "placed" || nextRoundBetState}
                        >
                          3x
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* {gameMode === GameOptions.AUTO && ( */}
                  <div className="games-options__input">
                    <h2 className="games-options__input__title">Auto Cash Out</h2>
                    <div
                      className={`games-options__amount ${isCashOutAmountInputFocused ? "focused" : ""}`}
                    >
                      <input
                        className="amount-input amount-input--auto"
                        value={cashOut}
                        onChange={handleCashOutAmountChange}
                        onFocus={() => setIsCashOutAmountInputFocused(true)}
                        onBlur={() => setIsCashOutAmountInputFocused(false)}
                        placeholder="Set cash out x"
                        disabled={betState.status === "placed" || nextRoundBetState}
                      />
                    </div>
                  </div>
                  {/* )} */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
