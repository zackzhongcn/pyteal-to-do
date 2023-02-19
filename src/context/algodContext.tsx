import { createContext } from "react";
import algosdk from "algosdk";

export const AlgodContext = createContext<algosdk.Algodv2 | undefined>(
  undefined
);
