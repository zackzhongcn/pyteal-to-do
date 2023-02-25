import algosdk, { microalgosToAlgos } from "algosdk";
import { useEffect, useState, useCallback } from "react";
import { useAlgodClient } from "./useAlgodClient";
import { useApplicationInfo } from "./useApplicationInfo";

export const useTokenBalance = (address: string | null) => {
  const [tokenBalance, setTokenBalance] = useState<number>(0);

  const client = useAlgodClient();
  const globalInfo = useApplicationInfo();

  const getTokenBalance = useCallback(async () => {
    if (client && address && globalInfo?.rewardTokenId) {
      const assetInfo = await client
        .accountAssetInformation(address, globalInfo.rewardTokenId)
        .do();
      if (!assetInfo.message) {
        setTokenBalance(microalgosToAlgos(assetInfo["asset-holding"].amount));
      }
    }
  }, [client, address, globalInfo]);

  useEffect(() => {
    if (client && address && globalInfo?.rewardTokenId) {
      console.log("here: token balance");
      getTokenBalance();
    }
  }, [client, address, globalInfo]);

  return tokenBalance;
};
