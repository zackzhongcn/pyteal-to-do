import React, { useReducer, createContext, ReactElement } from "react";

type UserState = {
  account: string | null;
  isConnected: boolean;
  isAdmin: boolean;
};

export type UserConextType = {
  userState: UserState;
  connect: (account: string, isAdmin: boolean) => void;
  reconnect: (account: string, isAdmin: boolean) => void;
  authenticate: (isAdmin: boolean) => void;
  disconnect: () => void;
};

type Action = {
  type: string;
  payload: string | boolean | null;
};

const initialState: UserState = {
  account: null,
  isConnected: false,
  isAdmin: false,
};

export const UserContext = createContext<UserConextType | null>(null);

const userReducer = (state: UserState, action: Action): UserState => {
  switch (action.type) {
    case "CONNECT":
      return {
        account: action.payload as string,
        isConnected: true,
        isAdmin: false,
      };
    case "RECONNECT":
      return {
        account: action.payload as string,
        isConnected: true,
        isAdmin: false,
      };
    case "AUTHENTICATE":
      return {
        ...state,
        isAdmin: action.payload as boolean,
      };
    case "DISCONNECT":
      return {
        account: null,
        isConnected: false,
        isAdmin: false,
      };
    default:
      return state;
  }
};

export function UserProvider({ children }: { children: ReactElement }) {
  const [userState, dispatch] = useReducer(userReducer, initialState);

  const connect = (account: string) => {
    dispatch({ type: "CONNECT", payload: account });
  };

  const reconnect = (account: string) => {
    dispatch({ type: "RECONNECT", payload: account });
  };

  const authenticate = (isAdmin: boolean) => {
    dispatch({ type: "AUTHENTICATE", payload: isAdmin });
  };

  const disconnect = () => {
    dispatch({
      type: "DISCONNECT",
      payload: null,
    });
  };

  const value = {
    userState,
    connect,
    reconnect,
    authenticate,
    disconnect,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}
