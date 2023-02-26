import React, { useEffect, useState, useContext, useCallback } from "react";
import Head from "next/head";
import { Typography } from "@mui/material";
import { toast } from "react-toastify";
import algosdk from "algosdk";
import ApplicationInfoCard from "@/components/ApplicationInfoCard";
import CreateTaskFormCard from "@/components/CreateTaskFormCard";
import { useLocalState } from "@/hooks/useLocalState";
import { UserConextType, UserContext } from "@/context/userContext";
import TaskCard from "@/components/TaskCard";

const style = {
  width: 700,
  height: "auto",
  padding: "0.75rem 1.2rem",
  border: "1px solid #aaaaaa",
};

export default function Home() {
  const [updated, setUpdated] = useState<boolean>(false);

  const { userState } = useContext(UserContext) as UserConextType;
  const { account } = userState;

  const localState = useLocalState(account, updated);

  return (
    <>
      <Head>
        <title>Pyteal To Do App</title>
        <meta name="description" content="A Algorand Application" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Typography variant="h3" component="h1" className="text-center my-3">
        To-Do Application
      </Typography>

      <div className="mb-4">
        <ApplicationInfoCard updated={updated} />
      </div>

      <div className="mb-4">
        {localState?.deadline ? (
          <TaskCard
            updated={updated}
            setUpdated={setUpdated}
            localState={localState}
          />
        ) : (
          <CreateTaskFormCard
            updated={updated}
            setUpdated={setUpdated}
            opttedin={localState?.opttedin}
          />
        )}
      </div>
    </>
  );
}
