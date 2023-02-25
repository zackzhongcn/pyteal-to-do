import React, { useEffect, useState, useCallback } from "react";
import NavBar from "@/components/layouts/NavBar";
import { UserProvider } from "@/context/userContext";
import type { AppProps } from "next/app";
import { ToastContainer, toast } from "react-toastify";
import algosdk from "algosdk";
import "react-toastify/dist/ReactToastify.css";
import "tailwindcss/tailwind.css";
import { ApplicationInfo, ContractState } from "@/common/type";
import { useAlgodClient } from "@/hooks/useAlgodClient";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <ToastContainer position="top-center" />
      <UserProvider>
        <>
          <NavBar />
          <Component {...pageProps} />
        </>
      </UserProvider>
    </>
  );
}
