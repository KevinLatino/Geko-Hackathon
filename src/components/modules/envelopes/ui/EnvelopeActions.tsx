import { useState } from "react";
import { Button, Card, Input, Text, Alert } from "@stellar/design-system";
import type { Envelope } from "geko_envelopes";
import { getTokenSymbol, isInvalidTokenContract } from "../utils/tokenUtils";
import "./EnvelopeActions.css";

interface EnvelopeActionsProps {
  envelope: Envelope | null;
  onDeposit: (id: bigint, amount: bigint) => Promise<void>;
  onWithdraw: (id: bigint, amount: bigint) => Promise<void>;
  onGetBalance: (id: bigint) => Promise<bigint | undefined>;
  loading?: boolean;
}

export function EnvelopeActions({
  envelope,
  onDeposit,
  onWithdraw,
  onGetBalance,
  loading = false,
}: EnvelopeActionsProps) {
  const [amount, setAmount] = useState("1"); // valor en XLM
  const [balance, setBalance] = useState<bigint | null>(null);

  const formatBalance = (balance: bigint | string | number): string => {
    const balanceNum =
      typeof balance === "bigint"
        ? Number(balance)
        : typeof balance === "string"
          ? Number(balance)
          : balance;
    const xlm = balanceNum / 10_000_000;
    return xlm.toFixed(7);
  };

  const handleDeposit = () => {
    if (!envelope) {
      alert("Primero selecciona un sobre.");
      return;
    }
    void (async () => {
      try {
        // convertir XLM → stroops
        const stroops = BigInt(Math.floor(Number(amount) * 10_000_000));
        await onDeposit(envelope.id, stroops);
        setAmount("1");
        const newBalance = await onGetBalance(envelope.id);
        if (newBalance !== undefined) setBalance(newBalance);
      } catch (e) {
        console.error(e);
      }
    })();
  };

  const handleWithdraw = () => {
    if (!envelope) {
      alert("Primero selecciona un sobre.");
      return;
    }
    void (async () => {
      try {
        const stroops = BigInt(Math.floor(Number(amount) * 10_000_000));
        await onWithdraw(envelope.id, stroops);
        setAmount("1");
        const newBalance = await onGetBalance(envelope.id);
        if (newBalance !== undefined) setBalance(newBalance);
      } catch (e) {
        console.error(e);
      }
    })();
  };

  const handleGetBalance = () => {
    if (!envelope) {
      alert("Primero selecciona un sobre.");
      return;
    }
    void (async () => {
      const b = await onGetBalance(envelope.id);
      if (b !== undefined) setBalance(b);
    })();
  };

  if (!envelope) {
    return (
      <div className="envelope-actions">
        <Card variant="primary">
          <Text as="p" size="md" className="envelope-actions__empty">
            Selecciona un sobre para realizar acciones
          </Text>
        </Card>
      </div>
    );
  }

  // Type assertion needed because envelope.token_contract type may not be properly inferred
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const tokenContract = envelope.token_contract as string;
  const isInvalid = isInvalidTokenContract(tokenContract);

  return (
    <div className="envelope-actions">
      <Card variant="primary">
        <div className="envelope-actions__header">
          <Text as="h3" size="lg">
            Acciones: {envelope.name}
          </Text>
          <Text as="p" size="sm" className="envelope-actions__id">
            ID: #{String(envelope.id)}
          </Text>
        </div>

        {isInvalid && (
          <Alert variant="error" placement="inline" title="Sobre No Funcional">
            Este sobre fue creado con una configuración inválida
            (token_contract: "{tokenContract}"). No se pueden realizar depósitos
            ni retiros. Por favor, crea un nuevo sobre con la configuración
            correcta.
          </Alert>
        )}

        <div className="envelope-actions__form">
          <Input
            label={`Monto (${getTokenSymbol(tokenContract)})`}
            id="env-amount"
            fieldSize="md"
            type="number"
            step="0.000001"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
            }}
            placeholder={`Ej. 5 (${getTokenSymbol(tokenContract)})`}
            disabled={isInvalid}
          />

          <div className="envelope-actions__buttons">
            <Button
              variant="secondary"
              size="md"
              isFullWidth
              onClick={handleDeposit}
              disabled={loading || isInvalid}
            >
              💰 Depositar
            </Button>
            <Button
              variant="tertiary"
              size="md"
              isFullWidth
              onClick={handleWithdraw}
              disabled={loading || isInvalid}
            >
              💸 Retirar
            </Button>
          </div>

          <Button
            variant="secondary"
            size="md"
            isFullWidth
            onClick={handleGetBalance}
            disabled={loading || isInvalid}
          >
            📊 Consultar Saldo
          </Button>

          {balance !== null && (
            <div className="envelope-actions__balance">
              <Text
                as="p"
                size="sm"
                className="envelope-actions__balance-label"
              >
                Saldo actual:
              </Text>
              <Text
                as="p"
                size="xl"
                className="envelope-actions__balance-amount"
              >
                {formatBalance(balance)} {getTokenSymbol(tokenContract)}
              </Text>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
