import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface Player {
  playerId: number;
  nickname: string;
  balance: number;
  seed: string;
}

interface AuthContextType {
  player: Player | null;
  isAuthenticated: boolean;
  setPlayerData: (playerData: Player) => void;
  login: (playerData: Player) => void;
  logout: () => void;
  updateBalance: (newBalance: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [player, setPlayer] = useState<Player | null>({
    playerId: -1,
    nickname: "",
    balance: 0,
    seed: "",
  });

  // Load from localStorage on initial render
  useEffect(() => {
    const savedPlayer = localStorage.getItem("player");
    if (savedPlayer) {
      setPlayer(JSON.parse(savedPlayer));
    }
  }, []);

  const setPlayerData = (playerData: Player) => {
    setPlayer(playerData);
    localStorage.setItem("player", JSON.stringify(playerData));
  };

  const login = (playerData: Player) => {
    setPlayer(playerData);
    localStorage.setItem("player", JSON.stringify(playerData));
  };

  const logout = () => {
    setPlayer(null);
    localStorage.removeItem("player");
  };

  const updateBalance = (newBalance: number) => {
    if (player) {
      const updatedPlayer = { ...player, balance: newBalance };
      setPlayer(updatedPlayer);
      localStorage.setItem("player", JSON.stringify(updatedPlayer));
    }
  };

  const value = { player, isAuthenticated: !!player, setPlayerData, login, logout, updateBalance };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
