import { ApplicationInfo, ContractState } from "@/common/type";
import algosdk, { microalgosToAlgos } from "algosdk";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useAlgodClient } from "./useAlgodClient";

export const useApplicationInfo = (updated: boolean = false) => {
  const [globalInfo, setGlobalInfo] = useState<ApplicationInfo>();

  const client = useAlgodClient();

  const getApplicationInfo = useCallback(async (): Promise<void> => {
    if (client) {
      try {
        const applicationId = Number(process.env.NEXT_PUBLIC_APPLICATION_ID);
        const applicationInfo = await client
          .getApplicationByID(applicationId)
          .do();
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
            case "RewardPool":
              tmpGlobalInfo.rewardPool = microalgosToAlgos(
                state.value as number
              );
              break;
            case "GivenReward":
              tmpGlobalInfo.givenRewards = microalgosToAlgos(
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
              tmpGlobalInfo.creationFee = microalgosToAlgos(
                state.value as number
              );
              break;
            default:
              break;
          }
        }
        setGlobalInfo(tmpGlobalInfo);
        console.log("info: ", tmpGlobalInfo);
      } catch (error: any) {
        toast.error(
          "Failed to get the application information, please contact support."
        );
      }
    }
  }, [client, updated]);

  useEffect(() => {
    getApplicationInfo();
  }, [client, updated]);

  return globalInfo;
};
