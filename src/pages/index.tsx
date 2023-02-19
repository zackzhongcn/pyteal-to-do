import React, { useEffect, useState, useContext, useCallback } from "react";
import Head from "next/head";
import { Typography, Grid, Box } from "@mui/material";
import { AlgodContext } from "@/context/algodContext";
import { toast } from "react-toastify";
import algosdk from "algosdk";
import { ApplicationInfo, ContractState } from "@/common/type";

type Props = {
  globalInfo: ApplicationInfo;
};

const style = {
  width: 700,
  height: "auto",
  padding: "0.75rem 1.2rem",
  border: "1px solid #aaaaaa",
};

export default function Home(props: Props) {
  const { globalInfo } = props;
  const client = useContext(AlgodContext);

  return (
    <>
      <Head>
        <title>Pyteal To Do App</title>
        <meta name="description" content="A Algorand Application" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Typography variant="h4" component="h1" className="text-center my-3">
        To-Do Application
      </Typography>

      <div className="flex justify-center">
        <Box sx={style}>
          <Typography variant="h6" component="h2" className="mb-2">
            Application Information
          </Typography>
          <div className="grid grid-cols-4 gap-3 text-center">
            <div>
              <div>Reward Token</div>
              <div>{globalInfo ? globalInfo.rewardTokenId : "-"}</div>
            </div>
            <div>
              <div>Reward Pool</div>
              <div>{globalInfo ? globalInfo.rewardPool : "-"}</div>
            </div>
            <div>
              <div>Given Reward</div>
              <div>{globalInfo ? globalInfo.givenRewards : "-"}</div>
            </div>
            <div>
              <div>Reward Rate</div>
              <div>{globalInfo ? globalInfo.rewardRate : "-"}</div>
            </div>
          </div>
        </Box>
      </div>
    </>
  );
}
