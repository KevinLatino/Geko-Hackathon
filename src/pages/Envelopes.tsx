import { useState } from "react";
import { Button, Layout, Card, Input, Select } from "@stellar/design-system";
import { useWallet } from "../hooks/useWallet";
import { useEnvelopes } from "../hooks/useEnvelopes";
import type { Envelope } from "geko_envelopes";

const CONTRACT_ID = "CBHDPEFXULHHF3NO5EYALTUEZOFLKQ6GTCDG6MAFRWWKRVOHQHRVTLYZ";

// 🔹 Direcciones de los tokens (de ejemplo: testnet wrappers)
const TOKEN_ADDRESSES = {
  XLM: "native", // XLM nativo no necesita contrato
  USDC: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5", // cambia si tienes el real
};

export default function EnvelopesPage() {
  const { address, isPending } = useWallet();
  const {
    loading,
    createEnvelope,
    deposit,
    withdraw,
    getBalance,
    listEnvelopes,
  } = useEnvelopes(CONTRACT_ID);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [token, setToken] = useState<"XLM" | "USDC">("XLM");

  const [envelopeId, setEnvelopeId] = useState<bigint | null>(null);
  const [amount, setAmount] = useState("50");
  const [balance, setBalance] = useState<bigint | null>(null);
  const [userEnvelopes, setUserEnvelopes] = useState<Envelope[]>([]);

  if (isPending) {
    return <div className="text-center mt-10">Conectando wallet…</div>;
  }

  if (!address) {
    return (
      <div className="text-center mt-10">Por favor conecta tu wallet.</div>
    );
  }

  const refreshEnvelopesList = async () => {
    const res = await listEnvelopes();
    setUserEnvelopes(res ?? []);
  };

  const handleCreate = () => {
    void (async () => {
      try {
        const tokenContract =
          token === "XLM" ? TOKEN_ADDRESSES.XLM : TOKEN_ADDRESSES.USDC;
        const tx = await createEnvelope(name, description, tokenContract);
        const hash = tx?.sendTransactionResponse?.hash;

        console.log("🌟 TX Hash:", hash);
        alert("Sobre creado exitosamente.");
        await refreshEnvelopesList();
      } catch (e) {
        console.error(e);
        alert("Error creando sobre.");
      }
    })();
  };

  const handleDeposit = () => {
    void (async () => {
      if (!envelopeId) {
        alert("Primero selecciona o crea un sobre.");
        return;
      }
      try {
        await deposit(envelopeId, BigInt(amount));
      } catch (e) {
        console.error(e);
        alert("Error al depositar.");
      }
    })();
  };

  const handleWithdraw = () => {
    void (async () => {
      if (!envelopeId) {
        alert("Primero selecciona o crea un sobre.");
        return;
      }
      try {
        await withdraw(envelopeId, BigInt(amount));
      } catch (e) {
        console.error(e);
        alert("Error al retirar.");
      }
    })();
  };

  const handleGetBalance = () => {
    void (async () => {
      if (!envelopeId) {
        alert("Primero selecciona o crea un sobre.");
        return;
      }
      const b = await getBalance(envelopeId);
      if (b !== undefined) setBalance(b);
    })();
  };

  const handleList = () => {
    void refreshEnvelopesList();
  };

  return (
    <Layout.Content>
      <Layout.Inset>
        <div style={{ textAlign: "center", marginBottom: "1rem" }}>
          <h1>💌 Geko Envelopes</h1>
          <p style={{ color: "#6b7280" }}>Conectado: {address}</p>
        </div>

        <Card variant="primary">
          <div style={{ display: "grid", gap: "0.75rem" }}>
            <Input
              label="Nombre del sobre"
              id="env-name"
              fieldSize="md"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. AhorrosViaje"
            />
            <Input
              label="Descripción"
              id="env-desc"
              fieldSize="md"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej. Mi viaje a Japón"
            />
            <Select
              label="Token"
              id="env-token"
              fieldSize="md"
              onChange={(e) => setToken(e.target.value as "XLM" | "USDC")}
              value={token}
            >
              <option value="XLM">XLM (nativo)</option>
              <option value="USDC">USDC</option>
            </Select>

            <Button
              variant="primary"
              size="md"
              isFullWidth
              disabled={loading}
              onClick={handleCreate}
            >
              {loading ? "Creando…" : "Crear sobre"}
            </Button>

            <hr />

            <Input
              label="ID del sobre"
              id="env-id"
              fieldSize="md"
              value={envelopeId?.toString() ?? ""}
              onChange={(e) => {
                const value = e.target.value.trim();
                setEnvelopeId(value ? BigInt(value) : null);
              }}
              placeholder="Ej. 1"
            />

            <Input
              label="Monto"
              id="env-amount"
              fieldSize="md"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.75rem",
              }}
            >
              <Button
                variant="secondary"
                size="md"
                isFullWidth
                onClick={handleDeposit}
              >
                Depositar
              </Button>
              <Button
                variant="tertiary"
                size="md"
                isFullWidth
                onClick={handleWithdraw}
              >
                Retirar
              </Button>
            </div>

            <Button
              variant="secondary"
              size="md"
              isFullWidth
              onClick={handleGetBalance}
            >
              Consultar saldo
            </Button>

            {balance !== null && (
              <div style={{ marginTop: "0.5rem", textAlign: "center" }}>
                Saldo del sobre #{envelopeId?.toString()}:
                <strong> {balance.toString()}</strong>
              </div>
            )}

            <hr />

            <Button
              variant="secondary"
              size="md"
              isFullWidth
              onClick={handleList}
            >
              Listar sobres
            </Button>

            {userEnvelopes.length > 0 && (
              <div style={{ marginTop: "0.5rem" }}>
                <h4>📜 Tus sobres:</h4>
                <ul>
                  {userEnvelopes.map((env) => (
                    <li key={env.id.toString()}>
                      #{env.id.toString()} — {env.name} (
                      {env.balance.toString()} unidades)
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Card>
      </Layout.Inset>
    </Layout.Content>
  );
}
