export interface AssetConstructor {
  id: string,
  name: string,
  network: string,
  usdPrice?: number,
  priceSymbol?: string,
}

export interface SendParams {
  to: string;
  from: string;
  ether?: string;
  value?: string;
  message?: string | null;
}

export default class Asset {
  public id: string;
  public name: string;
  public network: string;
  public type: string | null;

  constructor({ id, name, network, usdPrice, priceSymbol }: AssetConstructor);
  setCore(core: any): void;
  getTx(txHash: string): Promise<any>;
  getDisplayValue(value: string, decimals?: number): string;
  getUSDValue(value: string, decimals?: number): string;
  getBalance(account: string): Promise<string>;
  getDisplayBalance(account: string, decimals?: number): Promise<string>;
  getMaximumSendableBalance(account: string): Promise<string>;
  send(params: SendParams): Promise<any>;
  supportsMessages(): boolean;
  getWeb3(): any;
  stop(): void;
}
