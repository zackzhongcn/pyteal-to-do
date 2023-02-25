export const formatAddress = (address: string): string => {
  return address.substring(0, 4) + "..." + address.slice(-4);
};

export const formatNumberComma = (number: number): string => {
  if (!number) return "0";
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

export const formatToUint8Array = (number: number): Uint8Array => {
  const buffer = Buffer.alloc(8);
  const bigIntValue = BigInt(number);
  buffer.writeBigUInt64BE(bigIntValue);
  return Uint8Array.from(buffer);
};
