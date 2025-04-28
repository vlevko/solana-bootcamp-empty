export interface TokenAccount {
    mint: string;
    balance: BigInt;
    name?: string;
    symbol?: string;
    icon?: string;
    decimals?: number;
}
