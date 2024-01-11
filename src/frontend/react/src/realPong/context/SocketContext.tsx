/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-refresh/only-export-components */
import React, { useEffect, useReducer } from "react";
import { io } from "socket.io-client";
import { Match } from "../types/Match";
import { Room } from "../types/Room";

type action = {
  type: string;
  payload: any;
};

type state = {
  isConnected: boolean;
  username?: string;
  room?: Room;
  match?: Match;
  onQueue: boolean;
  socketId?: string;
};

const initialState: state = {
  isConnected: false,
  room: undefined,
  match: undefined,
  username: "",
  onQueue: false,
  socketId: "",
};

const socket = io("http://localhost:3000/gamer", { autoConnect: false });

const disconnect = () => {
  socket.off("connect");
  socket.off("disconnect");
  socket.off("RoomCreated");
  socket.off("MatchRefresh");
  socket.off("GameOver");
  socket.disconnect();
};

let set_name: (name: string) => void;

const SocketContext = React.createContext(initialState);

const SocketProvider = (props: any) => {
  const reducer = (state: state, action: action): state => {
    switch (action.type) {
      case "CONNECTED":
        return { ...state, isConnected: action.payload, socketId: socket.id };
      case "DISCONNECTED":
        return { ...state, isConnected: action.payload };
      case "NAME_SET":
        return { ...state, username: action.payload, match: undefined };
      case "ROOM_CREATED":
        return { ...state, room: action.payload };
      case "MATCH_REFRESH":
        return { ...state, match: action.payload, onQueue: false };
      case "QUEUE_JOINED":
        return { ...state, onQueue: action.payload };
      case "SET_WINNER":
        return {
          ...state,
          match: action.payload,
        };
      default:
        return state;
    }
  };

  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    socket.on("connect", () => {
      console.log("Conectado!");
      dispatch({ type: "CONNECTED", payload: true });
      if (localStorage.getItem("player")) {
        console.log("Reconectando...");
        socket.emit(
          "Reconnect",
          JSON.parse(localStorage.getItem("player") || "")
        );
      }
    });

    socket.on("disconnect", () => {
      dispatch({ type: "DISCONNECTED", payload: false });
    });

    socket.on("RoomCreated", (room) => {
      dispatch({ type: "ROOM_CREATED", payload: room });
    });

    socket.on("MatchRefresh", (match) => {
      dispatch({ type: "MATCH_REFRESH", payload: match });
    });

    socket.on("QueueJoined", () => {
      dispatch({ type: "QUEUE_JOINED", payload: true });
    });

    socket.on("QueueLeft", () => {
      dispatch({ type: "QUEUE_JOINED", payload: false });
    });

    // TODO: Make the winner be displayed
    socket.on("GameOver", () => {
      dispatch({ type: "SET_WINNER", payload: undefined });
    });

    set_name = (name: string) => {
      if (!name.trim()) return;
      dispatch({ type: "NAME_SET", payload: name });
      localStorage.setItem(
        "player",
        JSON.stringify({
          username: name.trim(),
          socketId: socket.id,
        })
      );
      socket.emit("Login", { name: name.trim() });
    };

    socket.connect();
    return () => disconnect();
  }, []);

  return (
    <SocketContext.Provider value={state}>
      {props.children}
    </SocketContext.Provider>
  );
};

// Helper Functions
const createRoom = (againstAi: boolean) => {
  socket.emit("CreateRoom", { againstAi });
};

const gameLoaded = () => {
  socket.emit("GameLoaded");
};

const sendKey = (key: string, type: string) => {
  socket.emit("SendKey", { key, type });
};

const joinQueue = () => {
  socket.emit("JoinQueue");
};

const leaveQueue = () => {
  socket.emit("LeaveQueue");
};

const pauseGame = () => {
  socket.emit("PauseMatch");
};

export {
  SocketContext,
  SocketProvider,
  createRoom,
  gameLoaded,
  joinQueue,
  leaveQueue,
  pauseGame,
  sendKey,
  set_name,
};
