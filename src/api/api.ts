import axios from "axios";

interface TopPlayer {
  playerId: number;
  nickname: string;
  points: number;
  avatarUrl?: string;
}

export const fetchTopPoints = async (limit: number = 10): Promise<TopPlayer[]> => {
  try {
    const response = await axios.get(`https://crash.flexgaming.net/game/top-points?limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching top points:", error);
    return [];
  }
};

export const fetchGameRound = async (id: string) => {
  try {
    const response = await axios.get(`https://crash.flexgaming.net/game/game-round?id=${id}`);
    return response.data; // Return the data from the response
  } catch (error) {
    console.error("Error fetching game round:", error);
    throw error; // Re-throw the error for further handling
  }
};
