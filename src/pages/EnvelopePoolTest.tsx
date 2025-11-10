import { useEffect, useMemo, useState } from "react";
import { useWallet } from "../hooks/useWallet";
import { useEnvelopePool } from "../hooks/useEnvelopePool";
import { CONTRACT_ID, TOKEN_ADDRESSES, POOL_CONTRACT_ID } from "../components/modules/envelopes/constants";

export default function EnvelopePoolTestPage() {
  const { address } = useWallet();
  const { loading, error, lastHash, createEnvelope, depositToPool, withdrawFromPool } =
    useEnvelopePool(CONTRACT_ID);

  const [name, setName] = useState("TASK_REWARD");
  const [description, setDescription] = useState("RewardEnvelope");
  const [tokenContract, setTokenContract] = useState<string>(TOKEN_ADDRESSES.XLM as string);
  const [poolContract, setPoolContract] = useState<string>(POOL_CONTRACT_ID as string);

  const [envId, setEnvId] = useState<string>("0");
  const [amount, setAmount] = useState<string>("10000000"); // 1.0000000

  const idAsBigint = useMemo(() => {
    try {
      return BigInt(envId || "0");
    } catch {
      return 0n;
    }
  }, [envId]);
  const amountAsBigint = useMemo(() => {
    try {
      return BigInt(amount || "0");
    } catch {
      return 0n;
    }
  }, [amount]);

  useEffect(() => {
    // Autofill recipient vars when wallet connects
  }, [address]);

  return (
    <div style={{ maxWidth: 920, margin: "0 auto", padding: 24, color: "#fff" }}>
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>Envelope Pool Test</h1>

      <section
        style={{
          background: "#151515",
          border: "1px solid #333",
          borderRadius: 8,
          padding: 16,
          marginBottom: 24,
          display: "grid",
          gap: 12,
        }}
      >
        <h2 style={{ fontSize: 18, margin: 0 }}>Create Envelope</h2>
        <label>
          Name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ width: "100%", padding: 8, marginTop: 4, background: "#0f0f0f", border: "1px solid #333", color: "#fff", borderRadius: 6 }}
          />
        </label>
        <label>
          Description
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ width: "100%", padding: 8, marginTop: 4, background: "#0f0f0f", border: "1px solid #333", color: "#fff", borderRadius: 6 }}
          />
        </label>
        <label>
          Token Contract
          <input
            value={tokenContract}
            onChange={(e) => setTokenContract(e.target.value)}
            style={{ width: "100%", padding: 8, marginTop: 4, background: "#0f0f0f", border: "1px solid #333", color: "#fff", borderRadius: 6 }}
          />
        </label>
        <label>
          Pool Contract
          <input
            value={poolContract}
            onChange={(e) => setPoolContract(e.target.value)}
            style={{ width: "100%", padding: 8, marginTop: 4, background: "#0f0f0f", border: "1px solid #333", color: "#fff", borderRadius: 6 }}
          />
        </label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            disabled={loading || !address}
            onClick={async () => {
              await createEnvelope(name, description, tokenContract, poolContract);
            }}
            style={{ padding: "10px 14px", background: "#2b6ef2", border: "none", borderRadius: 6, color: "#fff", cursor: "pointer" }}
          >
            Create
          </button>
        </div>
      </section>

      <section
        style={{
          background: "#151515",
          border: "1px solid #333",
          borderRadius: 8,
          padding: 16,
          marginBottom: 24,
          display: "grid",
          gap: 12,
        }}
      >
        <h2 style={{ fontSize: 18, margin: 0 }}>Deposit / Withdraw To Pool</h2>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <label style={{ flex: 1, minWidth: 220 }}>
            Envelope ID
            <input
              value={envId}
              onChange={(e) => setEnvId(e.target.value)}
              style={{ width: "100%", padding: 8, marginTop: 4, background: "#0f0f0f", border: "1px solid #333", color: "#fff", borderRadius: 6 }}
            />
          </label>
          <label style={{ flex: 1, minWidth: 220 }}>
            Amount (7 decimals)
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={{ width: "100%", padding: 8, marginTop: 4, background: "#0f0f0f", border: "1px solid #333", color: "#fff", borderRadius: 6 }}
            />
          </label>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            disabled={loading || !address}
            onClick={async () => {
              await depositToPool(idAsBigint, amountAsBigint);
            }}
            style={{ padding: "10px 14px", background: "#2b6ef2", border: "none", borderRadius: 6, color: "#fff", cursor: "pointer" }}
          >
            Deposit To Pool
          </button>
          <button
            disabled={loading || !address}
            onClick={async () => {
              await withdrawFromPool(idAsBigint, amountAsBigint);
            }}
            style={{ padding: "10px 14px", background: "#ff6a00", border: "none", borderRadius: 6, color: "#fff", cursor: "pointer" }}
          >
            Withdraw From Pool
          </button>
        </div>
      </section>

      <section
        style={{
          background: "#151515",
          border: "1px solid #333",
          borderRadius: 8,
          padding: 16,
          display: "grid",
          gap: 8,
        }}
      >
        <h3 style={{ margin: 0 }}>Status</h3>
        <div>Wallet: {address ?? "-"}</div>
        <div>Loading: {loading ? "yes" : "no"}</div>
        <div>Last TX: {lastHash ?? "-"}</div>
        {error && (
          <div style={{ color: "#ff7777" }}>
            Error: {error}
          </div>
        )}
      </section>
    </div>
  );
}


