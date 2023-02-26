import React, { useContext, useState } from "react";
import {
  Typography,
  Box,
  Button,
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel,
} from "@mui/material";
import { AlgorandAccount, LocalState } from "@/common/type";
import { useForm, Controller } from "react-hook-form";
import { SubmitHandler } from "react-hook-form/dist/types";
import { UserConextType, UserContext } from "@/context/userContext";
import {
  getApplicationAddress,
  makeApplicationNoOpTxnFromObject,
  waitForConfirmation,
} from "algosdk";
import { formatToUint8Array } from "@/common/format";
import { toast } from "react-toastify";
import { useAlgodClient } from "@/hooks/useAlgodClient";
import MyAlgoConnect from "@randlabs/myalgo-connect";
import { PeraWalletConnect } from "@perawallet/connect";
import { useApplicationInfo } from "@/hooks/useApplicationInfo";
import moment from "moment";

type Props = {
  updated: boolean;
  setUpdated: React.Dispatch<React.SetStateAction<boolean>>;
  localState: LocalState | undefined;
};

type TaskFormValues = {
  pin: Number;
  result: Number;
};

const style = {
  width: 700,
  height: "auto",
  padding: "0.75rem 1.2rem",
  border: "1px solid #aaaaaa",
};

const TaskCard = (props: Props) => {
  const { updated, setUpdated, localState } = props;
  const [showForm, setShowForm] = useState<boolean>(false);

  const { userState } = useContext(UserContext) as UserConextType;
  const { account, isConnected } = userState;

  const client = useAlgodClient();
  const globalInfo = useApplicationInfo(updated);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TaskFormValues>({
    defaultValues: { pin: "", result: "" },
  });

  const startToSubmit = () => {
    setShowForm(true);
  };

  const onSubmit: SubmitHandler<TaskFormValues> = async (
    data: TaskFormValues
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

        const appArgs = [
          new Uint8Array(Buffer.from("closeTask")),
          formatToUint8Array(data.pin as number),
          formatToUint8Array(data.result as number),
        ];
        console.log("args: ", appArgs);
        suggestedParams.fee = 2000;
        suggestedParams.flatFee = true;
        const applicationTxn = makeApplicationNoOpTxnFromObject({
          from: account ?? "",
          suggestedParams: suggestedParams,
          appIndex: applicationId,
          appArgs: appArgs,
          foreignAssets: [globalInfo.rewardTokenId],
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
            toast.success("Successfully close a task.");
            setShowForm(false);
          }
        }
      } else {
        toast.error("Please refersh and try again or contact support.");
      }
      reset({ pin: "", result: "" });
    } catch (error: any) {
      console.log("error: ", error);
      if (error.toString().includes("Operation cancelled")) {
        toast.warn("Operation cancelled, please try agian.");
      } else {
        toast.error(
          "Failed to close a task, pleas try again or contact support."
        );
      }
    }
  };

  return (
    <div className="flex justify-center">
      <Box sx={style}>
        <Typography variant="h5" component="h2" className="mb-3 text-center">
          Task Information
        </Typography>
        <div className="mb-2 border-b border-slate-900/30">
          <small className="mb-1">Task Summary</small>
          <div className="text-xl">{localState ? localState.summary : "-"}</div>
        </div>
        <div className="mb-2 border-b border-slate-900/30">
          <small className="mb-1">Task Description</small>
          <div className="text-xl">
            {localState ? localState.description : "-"}
          </div>
        </div>
        <div className="mb-3 border-b border-slate-900/30">
          <small className="mb-1">Deadline</small>
          <div className="text-xl">
            {localState
              ? moment.unix(localState.deadline).format("MM/DD/YYYY mm:hh")
              : "-"}
          </div>
        </div>
        <div className="mb-2 border-b border-slate-900/30">
          <small className="mb-1">Deposit</small>
          <div className="text-xl">{localState ? localState.deposit : "-"}</div>
        </div>

        {showForm ? (
          <form className="mt-5" onSubmit={handleSubmit(onSubmit)}>
            <Controller
              name="pin"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <TextField
                  {...field}
                  variant="outlined"
                  label="PIN"
                  className="mb-3"
                  fullWidth={true}
                  type="number"
                ></TextField>
              )}
            />
            <Controller
              name="result"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <div className="ml-2">
                  <FormLabel>Result</FormLabel>
                  <RadioGroup {...field} row>
                    <FormControlLabel
                      value={1}
                      control={<Radio />}
                      label="Done"
                    />
                    <FormControlLabel
                      value={2}
                      control={<Radio />}
                      label="Incomplete"
                    />
                  </RadioGroup>
                </div>
              )}
            />
            <div className="text-center">
              <Button variant="outlined" type="submit">
                Submit Result
              </Button>
            </div>
          </form>
        ) : localState?.result ? (
          <>
            <div className="mb-2 border-b border-slate-900/30">
              <small className="mb-1">Reward</small>
              <div className="text-xl">
                {localState ? localState.reward : "-"}
              </div>
            </div>
            <div className="mb-2 border-b border-slate-900/30">
              <small className="mb-1">Result</small>
              <div className="text-xl">
                {localState ? (localState.result ? "Done" : "Incomplete") : "-"}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center">
            <Button variant="outlined" onClick={() => startToSubmit()}>
              Start to Submit Result
            </Button>
          </div>
        )}
      </Box>
    </div>
  );
};

export default TaskCard;
