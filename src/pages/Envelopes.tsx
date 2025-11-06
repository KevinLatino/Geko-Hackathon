// src/pages/Envelopes.tsx
import { useState } from "react";
import { Button, Layout, Card, Input } from "@stellar/design-system";
import { useWallet } from "../hooks/useWallet";
import { useEnvelopes } from "../hooks/useEnvelopes";

const CONTRACT_ID = "CA64SL45LNBSS2JPQOGOPNVUXCEW7AZNTOAJW4GHB32RLHCC3733DIHN";

export default function EnvelopesPage() {
  const { address, isPending } = useWallet();
  const { loading, createEnvelope, deposit, withdraw, getBalance } =
    useEnvelopes(CONTRACT_ID);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [balance, setBalance] = useState<bigint | null>(null);

  if (isPending) {
    return <div className="text-center mt-10">Conectando wallet…</div>;
  }

  if (!address) {
    // Si no hay dirección, mostramos mensaje simple
    return (
      <div className="text-center mt-10">Por favor conecta tu wallet.</div>
    );
  }

  const handleGetBalance = async () => {
    const b = await getBalance(name);
    if (b !== undefined) {
      setBalance(b);
    }
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
              placeholder="Ej. Ahorros viaje"
            />
            <Input
              label="Descripción"
              id="env-desc"
              fieldSize="md"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Opcional"
            />

            <Button
              variant="primary"
              size="md"
              isFullWidth
              disabled={loading}
              onClick={() => {
                void createEnvelope(name, description);
              }}
            >
              {loading ? "Creando…" : "Crear sobre"}
            </Button>

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
                onClick={() => {
                  void deposit(name, BigInt(50));
                }}
              >
                Depositar 50
              </Button>
              <Button
                variant="tertiary"
                size="md"
                isFullWidth
                onClick={() => {
                  void withdraw(name, BigInt(20));
                }}
              >
                Retirar 20
              </Button>
            </div>

            <Button
              variant="secondary"
              size="md"
              isFullWidth
              onClick={() => {
                void handleGetBalance();
              }}
            >
              Consultar saldo
            </Button>

            {balance !== null && (
              <div style={{ marginTop: "0.5rem", textAlign: "center" }}>
                Saldo del sobre «{name}»: <strong>{balance.toString()}</strong>
              </div>
            )}
          </div>
        </Card>
      </Layout.Inset>
    </Layout.Content>
  );
}
