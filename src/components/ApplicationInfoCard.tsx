import React from "react";
import { Typography, Box } from "@mui/material";
import { ApplicationInfo } from "@/common/type";
import { useApplicationInfo } from "@/hooks/useApplicationInfo";

type Props = {
  updated: boolean;
};

const style = {
  width: 700,
  height: "auto",
  padding: "0.75rem 1.2rem",
  border: "1px solid #aaaaaa",
};

const ApplicationInfoCard = (props: Props) => {
  const { updated } = props;
  const globalInfo = useApplicationInfo(updated);

  return (
    <div className="flex justify-center">
      <Box sx={style}>
        <Typography variant="h5" component="h2" className="mb-2 text-center">
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
  );
};

export default ApplicationInfoCard;
