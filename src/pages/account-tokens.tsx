import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { TabsContent } from "@/components/ui/tabs";

import { Loader2 } from "lucide-react";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { truncateAddress } from "@/utils";
import { Button } from "@/components/ui/button";
import { TokenAccount } from "@/types/token";
import { useQuery } from "@tanstack/react-query";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useMetadata } from "@/hooks/useMetadata";
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";

function AccountTokenItem({ token }: { token: TokenAccount }) {
  const { data: metadata } = useMetadata(token.mint);

  if (!metadata) {
    return null; // Don't render if metadata is not available
  }
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg mb-2">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <span className="text-xl">{metadata?.icon}</span>
          <span className="font-medium">
            {token.balance.toString()} {metadata.symbol}
          </span>
        </div>
      </div>
      <div className="flex flex-col items-end">
        <span className="text-xs text-muted-foreground">
          {truncateAddress(token.mint)}
        </span>
      </div>
    </div>
  );
}

function getBalance(balance: string, decimals: number) {
  const parsedBalance = BigInt(balance);
  const divider = BigInt(10 ** decimals);
  const finalBalance = parsedBalance / divider;
  return finalBalance;
}

export default function AccountTokens({
  isWalletConnected,
  disconnect,
  setIsWalletConnected,
  loading,
}: {
  isWalletConnected: boolean;
  disconnect: () => void;
  setIsWalletConnected: (isWalletConnected: boolean) => void;
  loading: boolean;
}) {
  const { publicKey } = useWallet();
  const { connection } = useConnection();

  const { data: userTokens, refetch } = useQuery({
    queryKey: ["user-tokens"],
    queryFn: async () => {
      if (!publicKey) {
        return [];
      }

      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        publicKey, { programId: TOKEN_PROGRAM_ID }
      );
      
      const token2022Accounts = await connection.getParsedTokenAccountsByOwner(
        publicKey, { programId: TOKEN_2022_PROGRAM_ID }
      );

      const userTokens = [...tokenAccounts.value, ...token2022Accounts.value].map((item) => {
        const mint = item.account.data.parsed.info.mint;
        const balance = getBalance(
          item.account.data.parsed.info.tokenAmount.amount,
          item.account.data.parsed.info.tokenAmount.decimals
        );

        return { mint, balance };
      });

      return userTokens;
    }
  });

  return (
    <TabsContent value="accountTokens">
      <Card>
        <CardHeader className="flex flex-row justify-between">
          <div>
            <CardTitle>Your Tokens</CardTitle>
            <CardDescription>View your tokens and their balance.</CardDescription>
          </div>
          {isWalletConnected ? (
            <div>
              <Button
                onClick={() => {
                  try {
                    disconnect();
                    refetch();
                    setIsWalletConnected(false);
                  } catch (e) {
                    console.log("Error disconnecting", e);
                  }
                }}
              >
                Disconnect
              </Button>
            </div>
          ) : null}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {!isWalletConnected ? (
              <div className="text-center py-8">
                <p className="mb-4 text-muted-foreground">
                  Connect your wallet to view your tokens
                </p>
                <WalletMultiButton style={{ backgroundColor: "black" }}>
                  <Button asChild disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <div>Connect Wallet</div>
                    )}
                  </Button>
                </WalletMultiButton>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {userTokens?.map((token) => (
                    <AccountTokenItem key={token.mint} token={token} />
                  ))}
                  {userTokens?.length === 0 && (
                    <div className="text-center py-4 text-sm text-muted-foreground">
                      No tokens found
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
