import React, { useMemo, useState } from "react";
import { Layout, Card, Button, Input } from "@stellar/design-system";
import { Box } from "../components/layout/Box.tsx";
import { useWallet } from "../hooks/useWallet";
import { useWalletBalance } from "../hooks/useWalletBalance";
import contracts from "../../testnet.contracts.json";
import { PoolContractV2, RequestType } from "@blend-capital/blend-sdk";
import {
  Transaction,
  TransactionBuilder,
  rpc,
  xdr,
} from "@stellar/stellar-sdk";
import { rpcUrl, networkPassphrase } from "../contracts/util";

const POOL_NAME = "Test";
const XLM_ID = (contracts as any).ids?.["XLM"] as string;
const USDC_ID = (contracts as any).ids?.["USDC"] as string;

const formatBalanceLine = (b: any) => {
  if (b.asset_type === "native") return "XLM";
  if (b.asset_type?.startsWith("credit_")) return `${b.asset_code}:${b.asset_issuer}`;
  return b.asset_type ?? "UNKNOWN";
};

async function signAndSubmit(
  signer: ((xdr: string, opts?: { networkPassphrase?: string; address?: string }) => Promise<{ signedTxXdr: string }>) | undefined,
  opXdrBase64: string,
  address: string,
) {
  if (!signer) throw new Error("Wallet not connected");
  const server = new rpc.Server(rpcUrl, { allowHttp: rpcUrl.startsWith("http://") });
  const userAccount = await server.getAccount(address);
  const txBuilder = new TransactionBuilder(userAccount, {
    fee: "10000",
    timebounds: { minTime: 0, maxTime: 0 },
    networkPassphrase,
  }).addOperation(xdr.Operation.fromXDR(opXdrBase64, "base64"));
  const built = txBuilder.build();
  const sim = await server.simulateTransaction(built);
  if (!rpc.Api.isSimulationSuccess(sim) && !rpc.Api.isSimulationRestore(sim)) {
    throw new Error("Simulation failed");
  }
  const assembled = rpc.assembleTransaction(built, sim).build();
  const { signedTxXdr } = await signer(assembled.toXDR(), { networkPassphrase, address });
  const tx = TransactionBuilder.fromXDR(signedTxXdr, networkPassphrase) as Transaction;
  const sent = await server.sendTransaction(tx);
  if (sent.status !== "PENDING") throw new Error("Failed to send");
  let res = await server.getTransaction(sent.hash);
  while (res.status === "NOT_FOUND") {
    await new Promise((r) => setTimeout(r, 1000));
    res = await server.getTransaction(sent.hash);
  }
  if (res.status !== "SUCCESS") throw new Error("Transaction failed");
  return sent.hash;
}

const Pool: React.FC = () => {
  const { address, signTransaction } = useWallet();
  const { balances, xlm, isFunded, isLoading, error, updateBalance } = useWalletBalance();
  const poolAddress = (contracts as any).ids?.[POOL_NAME] ?? "";
  const pool = useMemo(() => new PoolContractV2(poolAddress), [poolAddress]);

  const [amountXlm, setAmountXlm] = useState("");
  const [amountUsdc, setAmountUsdc] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [lastHash, setLastHash] = useState<string | null>(null);
  const [wAmountXlm, setWAmountXlm] = useState("");
  const [wAmountUsdc, setWAmountUsdc] = useState("");

  const toFixed7 = (v: string) => BigInt(Math.round(Number(v) * 1e7));

  const handleDepositXlm = async () => {
    if (!address) return;
    setBusy("deposit-xlm");
    try {
      const op = pool.submit({
        from: address,
        spender: address,
        to: address,
        requests: [
          {
            address: XLM_ID,
            amount: toFixed7(amountXlm),
            request_type: RequestType.SupplyCollateral,
          },
        ],
      });
      const hash = await signAndSubmit(signTransaction as any, op, address);
      setLastHash(hash);
      await updateBalance();
    } finally {
      setBusy(null);
    }
  };

  const handleDepositUsdc = async () => {
    if (!address) return;
    setBusy("deposit-usdc");
    try {
      const amt = toFixed7(amountUsdc);
      const op = pool.submit({
        from: address,
        spender: address,
        to: address,
        requests: [
          { address: USDC_ID, amount: amt, request_type: RequestType.Supply },
        ],
      });
      const hash = await signAndSubmit(signTransaction as any, op, address);
      setLastHash(hash);
      await updateBalance();
    } finally {
      setBusy(null);
    }
  };

  const handleWithdrawXlm = async () => {
    if (!address) return;
    setBusy("withdraw-xlm");
    try {
      const op = pool.submit({
        from: address,
        spender: address,
        to: address,
        requests: [
          {
            address: XLM_ID,
            amount: toFixed7(wAmountXlm),
            request_type: RequestType.WithdrawCollateral,
          },
        ],
      });
      const hash = await signAndSubmit(signTransaction as any, op, address);
      setLastHash(hash);
      await updateBalance();
    } finally {
      setBusy(null);
    }
  };

  const handleWithdrawUsdc = async () => {
    if (!address) return;
    setBusy("withdraw-usdc");
    try {
      const op = pool.submit({
        from: address,
        spender: address,
        to: address,
        requests: [
          {
            address: USDC_ID,
            amount: toFixed7(wAmountUsdc),
            request_type: RequestType.WithdrawCollateral,
          },
        ],
      });
      const hash = await signAndSubmit(signTransaction as any, op, address);
      setLastHash(hash);
      await updateBalance();
    } finally {
      setBusy(null);
    }
  };

  return (
    <Layout.Content>
      <Layout.Inset>
        <h2>Pool: {POOL_NAME}</h2>
        <Card variant="secondary">
          <Box gap="md">
            <Input
              label="Pool Address"
              id="pool-id"
              fieldSize="md"
              copyButton={{ position: "right" }}
              readOnly
              value={poolAddress}
            />
            <Input
              label="Connected Wallet"
              id="wallet-id"
              fieldSize="md"
              copyButton={{ position: "right" }}
              readOnly
              value={address ?? "Not connected"}
            />
          </Box>
        </Card>
      </Layout.Inset>

      <Layout.Inset>
        <h3>Your Balances</h3>
        <Card variant="primary">
          <Box gap="md">
            {error && <p style={{ color: "red" }}>{error.message}</p>}
            <p>Status: {isLoading ? "Loading..." : isFunded ? "Funded" : "Not funded"}</p>
            <p>XLM: {xlm}</p>
            <ul>
              {balances.map((b, i) => (
                <li key={`${b.asset_type}-${i}`}>
                  {formatBalanceLine(b)} — {b.balance}
                </li>
              ))}
            </ul>
            {lastHash && <p>Last Tx: {lastHash}</p>}
          </Box>
        </Card>
      </Layout.Inset>

      <Layout.Inset>
        <h3>Deposit</h3>
        <Card variant="secondary">
          <Box gap="md">
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end", flexWrap: "wrap" }}>
              <Input label="XLM amount" id="xlm-amt" fieldSize="md" value={amountXlm} onChange={(e) => setAmountXlm(e.target.value)} />
              <Button variant="primary" size="md" disabled={!address || busy==="deposit-xlm"} onClick={handleDepositXlm}>Deposit XLM</Button>
            </div>
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end", flexWrap: "wrap" }}>
              <Input label="USDC amount" id="usdc-amt" fieldSize="md" value={amountUsdc} onChange={(e) => setAmountUsdc(e.target.value)} />
              <Button variant="primary" size="md" disabled={!address || busy==="deposit-usdc"} onClick={handleDepositUsdc}>Deposit USDC</Button>
            </div>
          </Box>
        </Card>
      </Layout.Inset>

      <Layout.Inset>
        <h3>Withdraw</h3>
        <Card variant="secondary">
          <Box gap="md">
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end", flexWrap: "wrap" }}>
              <Input label="XLM amount" id="xlm-w-amt" fieldSize="md" value={wAmountXlm} onChange={(e) => setWAmountXlm(e.target.value)} />
              <Button variant="primary" size="md" disabled={!address || busy==="withdraw-xlm"} onClick={handleWithdrawXlm}>Withdraw XLM</Button>
            </div>
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end", flexWrap: "wrap" }}>
              <Input label="USDC amount" id="usdc-w-amt" fieldSize="md" value={wAmountUsdc} onChange={(e) => setWAmountUsdc(e.target.value)} />
              <Button variant="primary" size="md" disabled={!address || busy==="withdraw-usdc"} onClick={handleWithdrawUsdc}>Withdraw USDC</Button>
            </div>
          </Box>
        </Card>
      </Layout.Inset>
    </Layout.Content>
  );
};

export default Pool;
