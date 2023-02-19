import React, { useState, useContext, useEffect } from "react";
import Image from "next/image";
import PYTEAL_LOGO from "src/assets/pyteal.png";
import ConnectModal from "../modals/ConnectModal";
import Button from "@mui/material/Button";
import { UserConextType, UserContext } from "@/context/userContext";
import { formatAddress } from "@/common/format";
import { toast } from "react-toastify";
import { AlgodContext } from "@/context/algodContext";
import { ApplicationInfo } from "@/common/type";

type Props = {
  globalInfo: ApplicationInfo;
};

const NavBar = (props: Props) => {
  const { globalInfo } = props;
  const [showModal, setShowModal] = useState(false);

  const { userState, authenticate, disconnect } = useContext(
    UserContext
  ) as UserConextType;
  const { isConnected, account, isAdmin } = userState;
  const client = useContext(AlgodContext);

  useEffect(() => {
    console.log("state check");
    if (client && isConnected && globalInfo.owner) {
      const isAdmin = account === globalInfo.owner;
      console.log("authenticate", isAdmin);
      authenticate(isAdmin);
    }
  }, [client, isConnected, globalInfo]);

  const connectAlgoWallet = () => {
    console.log("clicked", showModal);
    setShowModal(true);
  };

  const disconnectAlgoWallet = () => {
    disconnect();
    localStorage.setItem("account", "");
    toast.success("Successfully disconnect your wallet.");
  };

  return (
    <>
      <nav className="bg-white border-b border-slate-900/10 p-2">
        <div className="flex justify-between">
          <div>
            <Image src={PYTEAL_LOGO} alt="Pyteal" width={120}></Image>
          </div>
          {isConnected ? (
            <div className="flex justify-center">
              {isAdmin && (
                <div className="mr-3">
                  <Button variant="text">Admin Portal</Button>
                </div>
              )}
              <div>
                <Button
                  variant="outlined"
                  onClick={() => disconnectAlgoWallet()}
                >
                  Disconnect {formatAddress(account as string)}
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <Button variant="outlined" onClick={() => connectAlgoWallet()}>
                Connect
              </Button>
            </div>
          )}
        </div>
      </nav>

      <ConnectModal show={showModal} setShow={setShowModal} />
    </>
  );
};

export default NavBar;
