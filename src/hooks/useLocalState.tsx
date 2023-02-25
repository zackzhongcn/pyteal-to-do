import { ContractState, LocalState } from "@/common/type";
import algosdk, { microalgosToAlgos } from "algosdk";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useAlgodClient } from "./useAlgodClient";

export const useLocalState = (
  address: string | null,
  updated: boolean = false
) => {
  const [localState, setLocalState] = useState<LocalState>();

  const client = useAlgodClient();

  const getApplicationInfo = useCallback(async (): Promise<void> => {
    if (client) {
      try {
        if (client && address) {
          const applicationId = Number(process.env.NEXT_PUBLIC_APPLICATION_ID);
          const accountApplicationInfo = await client
            .accountApplicationInformation(address, applicationId)
            .do();
          const contractLocalState = accountApplicationInfo["app-local-state"];
          if (contractLocalState) {
            const tmpState: LocalState = {} as LocalState;
            console.log(accountApplicationInfo);
            if (contractLocalState["key-value"]) {
              const states: ContractState[] = contractLocalState[
                "key-value"
              ].map((element: any) => {
                const key = Buffer.from(element.key, "base64").toString();
                const value =
                  element.value.type === 1
                    ? Buffer.from(element.value.bytes, "base64").toString()
                    : Number(element.value.uint.toString());
                return { key: key, value: value };
              });
              for (const state of states) {
                switch (state.key) {
                  case "taskSummary":
                    tmpState.summary = state.value as string;
                    break;
                  case "taskDescription":
                    tmpState.description = state.value as string;
                    break;
                  case "deadline":
                    tmpState.deadline = state.value as number;
                    break;
                  case "deposit":
                    tmpState.deposit = microalgosToAlgos(state.value as number);
                    break;
                  case "reward":
                    tmpState.reward = microalgosToAlgos(state.value as number);
                    break;
                  case "result":
                    tmpState.result =
                      (state.value as number) === 1 ? true : false;
                    break;
                  default:
                    break;
                }
              }
            }
            tmpState.opttedin = true;
            setLocalState(tmpState);
            console.log("locaal state", tmpState);
          } else {
            const tmpState: LocalState = {} as LocalState;
            tmpState.opttedin = false;
            setLocalState(tmpState);
          }
        }
      } catch (error: any) {
        console.log("error: ", error);
        toast.error(
          "Failed to get the account application information, please contact support."
        );
      }
    }
  }, [client, address, updated]);

  useEffect(() => {
    getApplicationInfo();
  }, [client, address, updated]);

  return localState;
};
