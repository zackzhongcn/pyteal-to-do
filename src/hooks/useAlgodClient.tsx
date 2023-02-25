import algosdk from "algosdk";
import { useEffect, useState } from "react";

export const useAlgodClient = () => {
  const [algodClient, setAlgodClient] = useState<algosdk.Algodv2>();

  useEffect(() => {
    console.log("algod init");
    const server = process.env.NEXT_PUBLIC_PURESTAKE_API_ADDRESS as string;
    const port = "";
    const token = {
      "X-API-Key": process.env.NEXT_PUBLIC_PURESTAKE_API_KEY as string,
    };
    const client = new algosdk.Algodv2(token, server, port);
    setAlgodClient(client);
  }, []);

  return algodClient;
};
