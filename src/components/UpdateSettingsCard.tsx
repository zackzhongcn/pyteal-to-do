import React, { useCallback, useContext, useEffect, useState } from "react";
import { Typography, Box, TextField, Button } from "@mui/material";
import { AlgorandAccount, ApplicationInfo } from "@/common/type";
import { useForm, Controller } from "react-hook-form";
import { SubmitHandler } from "react-hook-form/dist/types";
import { UserConextType, UserContext } from "@/context/userContext";
import {
  getApplicationAddress,
  algosToMicroalgos,
  makeApplicationNoOpTxnFromObject,
  waitForConfirmation,
} from "algosdk";
import { formatNumberComma, formatToUint8Array } from "@/common/format";
import { toast } from "react-toastify";
import { useAlgodClient } from "@/hooks/useAlgodClient";
import MyAlgoConnect from "@randlabs/myalgo-connect";
import { PeraWalletConnect } from "@perawallet/connect";
import { useApplicationInfo } from "@/hooks/useApplicationInfo";

type Props = {
  updated: boolean;
  setUpdated: React.Dispatch<React.SetStateAction<boolean>>;
};

type SettingsFormValues = {
  rewardRate: Number;
  creationFee: Number;
};

const style = {
  width: 700,
  height: "auto",
  padding: "0.75rem 1.2rem",
  border: "1px solid #aaaaaa",
};

const UpdateSettingsCard = (props: Props) => {
  const { updated, setUpdated } = props;

  const { userState } = useContext(UserContext) as UserConextType;
  const { account, isAdmin } = userState;

  const client = useAlgodClient();
  const globalInfo = useApplicationInfo(updated);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SettingsFormValues>({
    defaultValues: { rewardRate: "", creationFee: "" },
  });

  const onSubmit: SubmitHandler<SettingsFormValues> = async (
    data: SettingsFormValues
  ) => {
    console.log("submit data: ", data);
    try {
      const applicationId = Number(
        process.env.NEXT_PUBLIC_APPLICATION_ID ?? "0"
      );
      if (client && globalInfo && applicationId !== 0) {
        const suggestedParams = await client.getTransactionParams().do();

        const appArgs = [
          new Uint8Array(Buffer.from("updateSettings")),
          formatToUint8Array(data.rewardRate as number),
          formatToUint8Array(algosToMicroalgos(data.creationFee as number)),
        ];
        console.log("args: ", appArgs);
        const applicationTxn = makeApplicationNoOpTxnFromObject({
          from: account ?? "",
          suggestedParams: suggestedParams,
          appIndex: applicationId,
          appArgs: appArgs,
        });

        const accountStroage: string | null = localStorage.getItem("account");
        if (accountStroage) {
          const algoAccount: AlgorandAccount = JSON.parse(accountStroage);
          if (algoAccount.provider === "Pera") {
            const pera = new PeraWalletConnect();
          } else {
            const myAlgo = new MyAlgoConnect();
            const signedTxn = await myAlgo.signTransaction(
              Buffer.from(applicationTxn.toByte()).toString("base64")
            );
            const { txId } = await client
              .sendRawTransaction(signedTxn.blob)
              .do();
            const result = await waitForConfirmation(client, txId, 4);
            console.log("result: ", result);
            setUpdated(!updated);
            toast.success("Successfully update settings in the contract.");
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
          "Failed to update settings, pleas try again or contact support."
        );
      }
    } finally {
      reset({ rewardRate: "", creationFee: "" });
    }
  };

  return (
    <div className="flex justify-center">
      <Box sx={style}>
        <Typography variant="h5" component="h2" className="mb-3 text-center">
          Update Settings
        </Typography>
        <form onSubmit={handleSubmit(onSubmit)}>
          <label className="float-right">
            Current Reward Rate: {globalInfo?.rewardRate}
          </label>
          <Controller
            name="rewardRate"
            control={control}
            rules={{ required: true, min: 1 }}
            render={({ field }) => (
              <TextField
                {...field}
                variant="outlined"
                label="Reward Rate"
                className="mb-3"
                fullWidth={true}
                type="number"
              ></TextField>
            )}
          />
          <label className="float-right">
            Current Creation Fee:&nbsp;
            {formatNumberComma(globalInfo?.creationFee ?? 0)}
          </label>
          <Controller
            name="creationFee"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <TextField
                {...field}
                variant="outlined"
                label="Creation Fee"
                className="mb-3"
                fullWidth={true}
                type="number"
              ></TextField>
            )}
          />
          <div className="text-center">
            <Button variant="outlined" type="submit">
              Update Settings
            </Button>
          </div>
        </form>
      </Box>
    </div>
  );
};

export default UpdateSettingsCard;
