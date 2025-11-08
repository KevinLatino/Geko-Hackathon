import { useState, useEffect } from "react";
import { Button, Layout, Text } from "@stellar/design-system";
import { useWallet } from "../../../../hooks/useWallet";
import { useEnvelopes } from "../hooks/useEnvelopes";
import { EnvelopeCard } from "../ui/EnvelopeCard";
import { CreateEnvelopeForm } from "../ui/CreateEnvelopeForm";
import { EnvelopeActions } from "../ui/EnvelopeActions";
import { CONTRACT_ID, TOKEN_ADDRESSES } from "../constants";
import type { Envelope } from "geko_envelopes";
import "./EnvelopesPage.css";

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

  const [userEnvelopes, setUserEnvelopes] = useState<Envelope[]>([]);
  const [selectedEnvelope, setSelectedEnvelope] = useState<Envelope | null>(
    null
  );

  useEffect(() => {
    if (address) {
      void refreshEnvelopesList();
    }
  }, [address]);

  const refreshEnvelopesList = async () => {
    const res = await listEnvelopes();
    setUserEnvelopes(res ?? []);
  };
  console.log(userEnvelopes);

  const handleCreate = async (
    name: string,
    description: string,
    tokenContract: string
  ) => {
    try {
      console.log(name, description, tokenContract);
      const tx = await createEnvelope(name, description, tokenContract);
      const hash = tx?.sendTransactionResponse?.hash;
      console.log("🌟 TX Hash:", hash);
      await refreshEnvelopesList();
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const handleDeposit = async (id: bigint, amount: bigint) => {
    try {
      await deposit(id, amount);
      await refreshEnvelopesList();
      // Update selected envelope if it's the one we just deposited to
      if (selectedEnvelope && String(selectedEnvelope.id) === String(id)) {
        const updatedEnvelopes = await listEnvelopes();
        const updated = updatedEnvelopes.find(
          (e) => String(e.id) === String(id)
        );
        if (updated) setSelectedEnvelope(updated);
      }
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const handleWithdraw = async (id: bigint, amount: bigint) => {
    try {
      await withdraw(id, amount);
      await refreshEnvelopesList();
      // Update selected envelope if it's the one we just withdrew from
      if (selectedEnvelope && String(selectedEnvelope.id) === String(id)) {
        const updatedEnvelopes = await listEnvelopes();
        const updated = updatedEnvelopes.find(
          (e) => String(e.id) === String(id)
        );
        if (updated) setSelectedEnvelope(updated);
      }
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  if (isPending) {
    return (
      <Layout.Content>
        <Layout.Inset>
          <div className="envelopes-page__loading">
            <Text as="p" size="md">
              Conectando wallet…
            </Text>
          </div>
        </Layout.Inset>
      </Layout.Content>
    );
  }

  if (!address) {
    return (
      <Layout.Content>
        <Layout.Inset>
          <div className="envelopes-page__loading">
            <Text as="p" size="md">
              Por favor conecta tu wallet.
            </Text>
          </div>
        </Layout.Inset>
      </Layout.Content>
    );
  }

  return (
    <Layout.Content>
      <Layout.Inset>
        <div className="envelopes-page">
          <div className="envelopes-page__header">
            <Text as="h1" size="xl" className="envelopes-page__title">
              Geko Envelopes
            </Text>
            <Text as="p" size="sm" className="envelopes-page__subtitle">
              Gestiona tus ahorros de manera organizada
            </Text>
          </div>

          <CreateEnvelopeForm
            onSubmit={handleCreate}
            loading={loading}
            tokenAddresses={TOKEN_ADDRESSES}
          />

          <div className="envelopes-page__actions">
            <Button
              variant="secondary"
              size="md"
              onClick={() => void refreshEnvelopesList()}
              disabled={loading}
            >
              🔄 Actualizar Lista
            </Button>
          </div>

          {userEnvelopes.length > 0 && (
            <div className="envelopes-page__envelopes">
              <Text as="h2" size="lg" className="envelopes-page__section-title">
                Tus Sobres ({userEnvelopes.length})
              </Text>
              <div className="envelopes-page__grid">
                {userEnvelopes.map((env) => (
                  <EnvelopeCard
                    key={String(env.id)}
                    envelope={env}
                    onSelect={setSelectedEnvelope}
                    selected={String(selectedEnvelope?.id) === String(env.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {userEnvelopes.length === 0 && (
            <div className="envelopes-page__empty">
              <Text as="p" size="md">
                No tienes sobres aún. ¡Crea uno para comenzar!
              </Text>
            </div>
          )}

          <EnvelopeActions
            envelope={selectedEnvelope}
            onDeposit={handleDeposit}
            onWithdraw={handleWithdraw}
            onGetBalance={getBalance}
            loading={loading}
          />
        </div>
      </Layout.Inset>
    </Layout.Content>
  );
}
