import React, { useContext, useState } from "react";
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
import ConnectModal from "./modals/ConnectModal";

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
  const [tokenUpdated, setTokenUpdated] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);

  const { userState } = useContext(UserContext) as UserConextType;
  const { account, isConnected } = userState;

  const client = useAlgodClient();
  const globalInfo = useApplicationInfo(updated);
  const tokenBalance = useTokenBalance(account, tokenUpdated);

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

  const connectAlgoWallet = () => {
    setShowModal(true);
  };

  const reloadBalancce = async () => {
    if (client && globalInfo) {
      const suggestedParams = await client.getTransactionParams().do();
      const accountInfo = await client
        .accountInformation(account as string)
        .do();
      const assets = accountInfo.assets.filter(
        (a: any) => a["asset-id"] === globalInfo.rewardTokenId
      );
      // optin token if not
      if (assets.length === 0) {
        const assetOptTxn = makeAssetTransferTxnWithSuggestedParamsFromObject({
          from: account as string,
          to: account as string,
          amount: 0,
          assetIndex: globalInfo.rewardTokenId as number,
          suggestedParams: suggestedParams,
        });
        const accountStroage: string | null = localStorage.getItem("account");
        if (accountStroage) {
          const algoAccount: AlgorandAccount = JSON.parse(accountStroage);
          if (algoAccount.provider === "Pera") {
            const pera = new PeraWalletConnect();
          } else {
            const myAlgo = new MyAlgoConnect();
            try {
              const signedTxn = await myAlgo.signTransaction(
                Buffer.from(assetOptTxn.toByte()).toString("base64")
              );
              const { txId } = await client
                .sendRawTransaction(signedTxn.blob)
                .do();
              await waitForConfirmation(client, txId, 4);
              toast.success("Successfully optin the token.");
            } catch (error: any) {
              if (error.toString().includes("Operation cancelled")) {
                toast.warn("Operation cancelled, please try agian.");
              } else {
                toast.error(
                  "Failed to creat a task, pleas try again or contact support."
                );
              }
            }
          }
        }
      }
    }
    setTokenUpdated(!tokenUpdated);
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
      console.log("address: ", applicationAddress, data.deadline?.unix());
      if (client && globalInfo && applicationId !== 0) {
        if (Number(data.depositAmount) > tokenBalance) {
          toast.error(
            "You don't have enough balance, please get the funds and try again."
          );
          return;
        }

        if (Number(data.depositAmount) < globalInfo.creationFee) {
          toast.error("Please depoist more than creation fee.");
          return;
        }

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

            // optin application
            console.log("optted in", opttedin);
            if (!opttedin) {
              const signedOptinTxn = await myAlgo.signTransaction(
                Buffer.from(optinTxn.toByte()).toString("base64")
              );
              const { txId: optinTxId } = await client
                .sendRawTransaction(signedOptinTxn.blob)
                .do();
              await waitForConfirmation(client, optinTxId, 4);
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
                disabled={!isConnected}
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
                disabled={!isConnected}
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
                  disabled={!isConnected}
                  {...field}
                />
              </LocalizationProvider>
            )}
          />
          <label className="float-right mr-2 flex items-center">
            Balance: {formatNumberComma(tokenBalance)}&nbsp;&nbsp;
            <button
              className="hover:opacity-50"
              onClick={() => reloadBalancce()}
            >
              Reload
            </button>
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
                disabled={!isConnected}
                type="number"
              ></TextField>
            )}
          />
          <div className="ml-2">Creation Fee: {globalInfo?.creationFee}</div>
          <div className="text-center">
            {isConnected ? (
              <Button variant="outlined" disabled={!isConnected} type="submit">
                Create Task
              </Button>
            ) : (
              <Button variant="outlined" onClick={() => connectAlgoWallet()}>
                Connect
              </Button>
            )}
          </div>
        </form>
      </Box>

      <ConnectModal show={showModal} setShow={setShowModal} />
    </div>
  );
};

export default CreateTaskFormCard;
