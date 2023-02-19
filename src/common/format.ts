export const formatAddress = (address: string): string => {
  return address.substring(0, 4) + "..." + address.slice(-4);
};
