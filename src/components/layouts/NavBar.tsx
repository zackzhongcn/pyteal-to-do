import React, { useState, useContext, useEffect, useCallback } from "react";
import Image from "next/image";
import PYTEAL_LOGO from "src/assets/pyteal.png";
import ConnectModal from "../modals/ConnectModal";
import Button from "@mui/material/Button";
import { UserConextType, UserContext } from "@/context/userContext";
import { formatAddress } from "@/common/format";
import { toast } from "react-toastify";
import { AlgorandAccount, ApplicationInfo } from "@/common/type";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAlgodClient } from "@/hooks/useAlgodClient";
import { useApplicationInfo } from "@/hooks/useApplicationInfo";

const NavBar = () => {
  const [showModal, setShowModal] = useState(false);

  const { userState, authenticate, connect, disconnect } = useContext(
    UserContext
  ) as UserConextType;
  const { isConnected, account, isAdmin } = userState;
  const client = useAlgodClient();
  const globalInfo = useApplicationInfo();

  const router = useRouter();

  useEffect(() => {
    console.log("state check");
    if (client && isConnected && globalInfo?.owner) {
      const isAdmin = account === globalInfo.owner;
      authenticate(isAdmin);
    }
  }, [client, isConnected, globalInfo]);

  const reconnectAlgoWallet = useCallback(() => {
    const accountStroage: string | null = localStorage.getItem("account");
    if (accountStroage) {
      const algoAccount: AlgorandAccount = JSON.parse(accountStroage);
      connect(algoAccount.address);
    }
  }, []);

  useEffect(() => {
    reconnectAlgoWallet();
  }, []);

  const connectAlgoWallet = () => {
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
            <div className="flex justify-center items-center">
              {isAdmin && (
                <div>
                  <div className="mr-3">
                    {router.pathname.includes("admin") ? (
                      <Link href="/">User Portal</Link>
                    ) : (
                      <Link href="/admin">Admin Portal</Link>
                    )}
                  </div>
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
