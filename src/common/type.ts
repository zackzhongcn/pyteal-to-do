export type AlgorandAccount = {
  address: string;
  provider: string;
};

export type ContractState = {
  key: string;
  value: string | number;
};

export type ApplicationInfo = {
  owner: string;
  deposit: number;
  rewardTokenId: number;
  rewardPool: number;
  givenRewards: number;
  rewardRate: number;
  creationFee: number;
};
