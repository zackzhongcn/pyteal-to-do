import React, { useEffect, useState, useCallback } from "react";
import NavBar from "@/components/layouts/NavBar";
import { UserProvider } from "@/context/userContext";
import type { AppProps } from "next/app";
import { ToastContainer, toast } from "react-toastify";
import algosdk from "algosdk";
import "react-toastify/dist/ReactToastify.css";
import "tailwindcss/tailwind.css";
import { AlgodContext } from "@/context/algodContext";
import { ApplicationInfo, ContractState } from "@/common/type";

export default function App({ Component, pageProps }: AppProps) {
  const [algodClient, setAlgodClient] = useState<algosdk.Algodv2 | undefined>();
  const [globalInfo, setGlobalInfo] = useState<ApplicationInfo | undefined>();

  useEffect(() => {
    const server = process.env.NEXT_PUBLIC_PURESTAKE_API_ADDRESS as string;
    const port = "";
    const token = {
      "X-API-Key": process.env.NEXT_PUBLIC_PURESTAKE_API_KEY as string,
    };
    const client = new algosdk.Algodv2(token, server, port);
    setAlgodClient(client);
  }, []);

  const getApplicationInfo = useCallback(async (): Promise<void> => {
    if (algodClient) {
      try {
        const applicationId = Number(process.env.NEXT_PUBLIC_APPLICATION_ID);
        const applicationInfo = await algodClient
          .getApplicationByID(applicationId)
          .do();
        console.log("info: ", applicationInfo);
        const states: ContractState[] = applicationInfo.params[
          "global-state"
        ].map((element: any) => {
          const key = Buffer.from(element.key, "base64").toString();
          const value =
            element.value.type === 1
              ? algosdk.encodeAddress(
                  Buffer.from(element.value.bytes, "base64")
                )
              : Number(element.value.uint.toString());
          return { key: key, value: value };
        });
        const tmpGlobalInfo: ApplicationInfo = {} as ApplicationInfo;
        for (const state of states) {
          switch (state.key) {
            case "AvailableRewardPool":
              tmpGlobalInfo.rewardPool = algosdk.microalgosToAlgos(
                state.value as number
              );
              break;
            case "GivenReward":
              tmpGlobalInfo.givenRewards = algosdk.microalgosToAlgos(
                state.value as number
              );
              break;
            case "RewardTokenId":
              tmpGlobalInfo.rewardTokenId = state.value as number;
              break;
            case "Deposit":
              tmpGlobalInfo.deposit = state.value as number;
              break;
            case "Owner":
              tmpGlobalInfo.owner = state.value as string;
              break;
            case "RewardRate":
              tmpGlobalInfo.rewardRate = state.value as number;
              break;
            case "TaskCreationFee":
              tmpGlobalInfo.creationFee = state.value as number;
              break;
            default:
              break;
          }
        }
        setGlobalInfo(tmpGlobalInfo);
        console.log("result: ", states);
      } catch (error: any) {
        toast.error(
          "Failed to get the application information, please contact support."
        );
      }
    }
  }, [algodClient]);

  useEffect(() => {
    console.log("client: ", algodClient);
    getApplicationInfo();
  }, [algodClient]);

  return (
    <>
      <ToastContainer position="top-center" />
      <UserProvider>
        <AlgodContext.Provider value={algodClient}>
          <NavBar globalInfo={globalInfo as ApplicationInfo} />
          <Component {...pageProps} globalInfo={globalInfo} />
        </AlgodContext.Provider>
      </UserProvider>
    </>
  );
}
