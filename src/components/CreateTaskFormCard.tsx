import React, { useContext } from "react";
import { Typography, Box, TextField, Button } from "@mui/material";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import { AlgorandAccount } from "@/common/type";
import { useForm, Controller } from "react-hook-form";
import { SubmitHandler } from "react-hook-form/dist/types";
import { UserConextType, UserContext } from "@/context/userContext";
import {
  getApplicationAddress,
  algosToMicroalgos,
  makeApplicationNoOpTxnFromObject,
  waitForConfirmation,
  makeAssetTransferTxnWithSuggestedParamsFromObject,
  assignGroupID,
  Transaction,
  makeApplicationOptInTxnFromObject,
} from "algosdk";
import { formatNumberComma, formatToUint8Array } from "@/common/format";
import { toast } from "react-toastify";
import { useAlgodClient } from "@/hooks/useAlgodClient";
import MyAlgoConnect from "@randlabs/myalgo-connect";
import { PeraWalletConnect } from "@perawallet/connect";
import { useApplicationInfo } from "@/hooks/useApplicationInfo";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { useTokenBalance } from "@/hooks/useTokenBalance";

type Props = {
  updated: boolean;
  setUpdated: React.Dispatch<React.SetStateAction<boolean>>;
  opttedin: boolean | undefined;
};

type TaskFormValues = {
  summary: string;
  description: string;
  deadline: moment.Moment | null;
  depositAmount: Number;
};

const style = {
  width: 700,
  height: "auto",
  padding: "0.75rem 1.2rem",
  border: "1px solid #aaaaaa",
};

const CreateTaskFormCard = (props: Props) => {
  const { updated, setUpdated, opttedin } = props;

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
  } = useForm<TaskFormValues>({
    defaultValues: {
      summary: "",
      description: "",
      deadline: null,
      depositAmount: "",
    },
  });

  const onSubmit: SubmitHandler<TaskFormValues> = async (
    data: TaskFormValues
  ) => {
    console.log("submit data: ", data);
    try {
      const applicationId = Number(
        process.env.NEXT_PUBLIC_APPLICATION_ID ?? "0"
      );
      const applicationAddress = getApplicationAddress(applicationId);
      console.log("address: ", applicationAddress, data.deadline?.unix());
      if (client && globalInfo && applicationId !== 0) {
        const suggestedParams = await client.getTransactionParams().do();

        const optinTxn = makeApplicationOptInTxnFromObject({
          from: account ?? "",
          suggestedParams: suggestedParams,
          appIndex: applicationId,
        });

        const appArgs = [
          new Uint8Array(Buffer.from("createTask")),
          new Uint8Array(Buffer.from(data.summary)),
          new Uint8Array(Buffer.from(data.description)),
          formatToUint8Array(data.deadline?.unix() ?? 0),
        ];
        console.log("args: ", appArgs);
        const applicationTxn = makeApplicationNoOpTxnFromObject({
          from: account ?? "",
          suggestedParams: suggestedParams,
          appIndex: applicationId,
          appArgs: appArgs,
        });

        const assetTxn = makeAssetTransferTxnWithSuggestedParamsFromObject({
          amount: algosToMicroalgos(data.depositAmount as number),
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
            // optin
            if (opttedin) {
              const signedOptinTxn = await myAlgo.signTransaction(
                Buffer.from(optinTxn.toByte()).toString("base64")
              );
            }

            const tempSignedTxns = await myAlgo.signTxns(groupTxns);
            const signedTxns = tempSignedTxns.map(
              (txn: string | null) =>
                new Uint8Array(Buffer.from(txn as string, "base64"))
            );
            const { txId } = await client.sendRawTransaction(signedTxns).do();
            const result = await waitForConfirmation(client, txId, 4);
            console.log("result: ", result);
            setUpdated(!updated);
            toast.success("Successfully create a task.");
          }
        }
      } else {
        toast.error("Please refersh and try again or contact support.");
      }
      reset({
        summary: "",
        description: "",
        deadline: null,
        depositAmount: "",
      });
    } catch (error: any) {
      console.log("error: ", error);
      if (error.toString().includes("Operation cancelled")) {
        toast.warn("Operation cancelled, please try agian.");
      } else {
        toast.error(
          "Failed to creat a task, pleas try again or contact support."
        );
      }
    }
  };

  return (
    <div className="flex justify-center">
      <Box sx={style}>
        <Typography variant="h5" component="h2" className="mb-3 text-center">
          Create a Task
        </Typography>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Controller
            name="summary"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <TextField
                {...field}
                variant="outlined"
                label="Task Summary"
                className="mb-3"
                fullWidth={true}
              ></TextField>
            )}
          />
          <Controller
            name="description"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <TextField
                {...field}
                variant="outlined"
                label="Task Description"
                className="mb-3"
                fullWidth={true}
                multiline
                rows={4}
              ></TextField>
            )}
          />
          <Controller
            name="deadline"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <LocalizationProvider dateAdapter={AdapterMoment}>
                <DateTimePicker
                  renderInput={(props) => (
                    <TextField {...props} fullWidth={true} className="my-3" />
                  )}
                  label="DateTimePicker"
                  {...field}
                />
              </LocalizationProvider>
            )}
          />
          <label className="float-right mr-2">
            Balance: {formatNumberComma(tokenBalance)}
          </label>
          <Controller
            name="depositAmount"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <TextField
                {...field}
                variant="outlined"
                label="Deposit Amount"
                className="mb-3"
                fullWidth={true}
                type="number"
              ></TextField>
            )}
          />
          <div className="ml-2">Creation Fee: {globalInfo?.creationFee}</div>
          <div className="text-center">
            <Button variant="outlined" type="submit">
              Create Task
            </Button>
          </div>
        </form>
      </Box>
    </div>
  );
};

export default CreateTaskFormCard;
