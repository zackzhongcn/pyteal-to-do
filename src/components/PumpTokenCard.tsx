import React, { useCallback, useContext, useEffect, useState } from "react";
import { Typography, Box, TextField, Button } from "@mui/material";
import { AlgorandAccount, ApplicationInfo } from "@/common/type";
import { useForm, Controller } from "react-hook-form";
import { SubmitHandler } from "react-hook-form/dist/types";
import { UserConextType, UserContext } from "@/context/userContext";
import {
  getApplicationAddress,
  makeAssetTransferTxnWithSuggestedParamsFromObject,
  microalgosToAlgos,
  algosToMicroalgos,
  makeApplicationNoOpTxnFromObject,
  assignGroupID,
  Transaction,
  waitForConfirmation,
} from "algosdk";
import { formatNumberComma } from "@/common/format";
import { toast } from "react-toastify";
import { useAlgodClient } from "@/hooks/useAlgodClient";
import MyAlgoConnect from "@randlabs/myalgo-connect";
import { PeraWalletConnect } from "@perawallet/connect";
import { useApplicationInfo } from "@/hooks/useApplicationInfo";
import { useTokenBalance } from "@/hooks/useTokenBalance";

type Props = {
  updated: boolean;
  setUpdated: React.Dispatch<React.SetStateAction<boolean>>;
};

type PumpTokenFormValues = {
  amount: Number;
};

const style = {
  width: 700,
  height: "auto",
  padding: "0.75rem 1.2rem",
  border: "1px solid #aaaaaa",
};

const PumpTokenCard = (props: Props) => {
  const { updated, setUpdated } = props;

  const { userState } = useContext(UserContext) as UserConextType;
  const { account, isAdmin } = userState;

  const client = useAlgodClient();
  const globalInfo = useApplicationInfo(updated);
  const tokenBalance = useTokenBalance(account);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PumpTokenFormValues>({
    defaultValues: { amount: "" },
  });

  const onSubmit: SubmitHandler<PumpTokenFormValues> = async (
    data: PumpTokenFormValues
  ) => {
    console.log("submit data: ", data);
    try {
      const applicationId = Number(
        process.env.NEXT_PUBLIC_APPLICATION_ID ?? "0"
      );
      const applicationAddress = getApplicationAddress(applicationId);
      console.log("address: ", applicationAddress);
      if (client && globalInfo && applicationId !== 0) {
        const suggestedParams = await client.getTransactionParams().do();

        const appArgs = [new Uint8Array(Buffer.from("pumpToken"))];
        const applicationTxn = makeApplicationNoOpTxnFromObject({
          from: account ?? "",
          suggestedParams: suggestedParams,
          appIndex: applicationId,
          appArgs: appArgs,
          foreignAssets: [globalInfo.rewardTokenId],
        });

        const assetTxn = makeAssetTransferTxnWithSuggestedParamsFromObject({
          amount: algosToMicroalgos(data.amount as number),
          assetIndex: globalInfo.rewardTokenId,
          from: account ?? "",
          to: applicationAddress,
          suggestedParams: suggestedParams,
        });

        const txns = [applicationTxn, assetTxn];
        assignGroupID(txns);
        const groupTxns = txns.map((element: Transaction) => ({
          txn: Buffer.from(element.toByte()).toString("base64"),
        }));
        const accountStroage: string | null = localStorage.getItem("account");
        if (accountStroage) {
          const algoAccount: AlgorandAccount = JSON.parse(accountStroage);
          if (algoAccount.provider === "Pera") {
            const pera = new PeraWalletConnect();
          } else {
            const myAlgo = new MyAlgoConnect();
            const tempSignedTxns = await myAlgo.signTxns(groupTxns);
            const signedTxns = tempSignedTxns.map(
              (txn: string | null) =>
                new Uint8Array(Buffer.from(txn as string, "base64"))
            );
            const { txId } = await client.sendRawTransaction(signedTxns).do();
            const result = await waitForConfirmation(client, txId, 4);
            console.log("result: ", result);
            setUpdated(!updated);
            toast.success("Successfully pump token to the contract.");
          }
        }
      } else {
        toast.error("Please refersh and try again or contact support.");
      }
    } catch (error: any) {
      console.log("error: ", error);
      if (error.toString().includes("Operation cancelled")) {
        toast.warn("Operation cancelled, please try agian.");
      } else {
        toast.error(
          "Failed to pump token, pleas try again or contact support."
        );
      }
    } finally {
      reset({ amount: "" });
    }
  };

  return (
    <div className="flex justify-center">
      <Box sx={style}>
        <Typography variant="h5" component="h2" className="mb-3 text-center">
          Pump Token
        </Typography>
        <form onSubmit={handleSubmit(onSubmit)}>
          <label className="float-right mr-2">
            Balance: {formatNumberComma(tokenBalance)}
          </label>
          <Controller
            name="amount"
            control={control}
            rules={{ required: true, min: 1, max: 99 }}
            render={({ field }) => (
              <TextField
                {...field}
                variant="outlined"
                label="Pump Amount"
                className="mb-3"
                fullWidth={true}
                type="number"
              ></TextField>
            )}
          />
          <div className="text-center">
            <Button variant="outlined" type="submit">
              Pump Token
            </Button>
          </div>
        </form>
      </Box>
    </div>
  );
};

export default PumpTokenCard;
