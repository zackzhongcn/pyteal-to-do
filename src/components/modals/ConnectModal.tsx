import React, { useState, useContext } from "react";
import { Modal, Box } from "@mui/material";
import Button from "@mui/material/Button";
import MyAlgoConnect from "@randlabs/myalgo-connect";
import { PeraWalletConnect } from "@perawallet/connect";
import { AlgorandChainIDs } from "@perawallet/connect/dist/util/peraWalletTypes";
import { UserConextType, UserContext } from "@/context/userContext";
import { AlgorandAccount } from "@/common/type";
import { toast } from "react-toastify";

type Porps = {
  show: boolean;
  setShow: React.Dispatch<React.SetStateAction<boolean>>;
};

const style = {
  position: "absolute" as "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 500,
  bgcolor: "background.paper",
  boxShadow: 24,
};

const ConnectModal = (props: Porps) => {
  const { show, setShow } = props;

  const { connect } = useContext(UserContext) as UserConextType;

  const handleClose = () => {
    setShow(false);
  };

  const connectAccount = async (provider: string) => {
    if (provider === "Pera") {
      try {
        const peraWallet = new PeraWalletConnect({ chainId: 416002 });
        const accounts = await peraWallet.connect();
        console.log("acccount: ", accounts);
        const newConnect: AlgorandAccount = {
          address: accounts[0],
          provider: "Pera",
        };
        localStorage.setItem("account", JSON.stringify(newConnect));
        connect(accounts[0]);
        toast.success("Successfully connect with Pera wallet.");
      } catch (error: any) {
        console.log("error: ", error);
        toast.error("Failed to connect with Pera Wallet, please try again");
      }
    } else {
      try {
        const myAlgoConnect = new MyAlgoConnect();
        const accounts = await myAlgoConnect.connect();
        console.log("acccount: ", accounts);
        const newConnect: AlgorandAccount = {
          address: accounts[0].address,
          provider: "MyAlgo",
        };
        localStorage.setItem("account", JSON.stringify(newConnect));
        connect(accounts[0].address);
        toast.success("Successfully connect with MyAlgo wallet.");
      } catch (error: any) {
        console.log("error: ", error);
        toast.error("Failed to connect with MyAlgo Wallet, please try again");
      }
    }
    setShow(false);
  };

  return (
    <>
      <Modal open={show} onClose={handleClose}>
        <Box sx={style}>
          <div className="flex justify-end py-2 px-3">
            <button className="text-xl" onClick={handleClose}>
              &times;
            </button>
          </div>
          <hr />
          <div className="py-5 px-3 text-center">
            <div className="mb-3">
              <Button
                size="large"
                variant="outlined"
                className="w-80"
                onClick={() => connectAccount("MyAlgo")}
              >
                My Algo Wallet
              </Button>
            </div>
            <div>
              <Button
                size="large"
                variant="outlined"
                className="w-80"
                onClick={() => connectAccount("Pera")}
              >
                Pera Wallet
              </Button>
            </div>
          </div>
        </Box>
      </Modal>
    </>
  );
};

export default ConnectModal;
