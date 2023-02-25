import React, { useState } from "react";
import Head from "next/head";
import { Typography } from "@mui/material";
import ApplicationInfoCard from "@/components/ApplicationInfoCard";
import PumpTokenCard from "@/components/PumpTokenCard";
import UpdateSettingsCard from "@/components/UpdateSettingsCard";

export default function Admin() {
  const [updated, setUpdated] = useState<boolean>(false);

  return (
    <>
      <Head>
        <title>Pyteal To Do App - Admin</title>
        <meta name="description" content="A Algorand Application" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Typography variant="h4" component="h1" className="text-center my-3">
        To-Do Application
      </Typography>

      <div className="mb-4">
        <ApplicationInfoCard updated={updated} />
      </div>

      <div className="mb-4">
        <PumpTokenCard updated={updated} setUpdated={setUpdated} />
      </div>

      <div className="mb-4">
        <UpdateSettingsCard updated={updated} setUpdated={setUpdated} />
      </div>
    </>
  );
}
