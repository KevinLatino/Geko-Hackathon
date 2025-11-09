import { Card, Text } from "@stellar/design-system";
import type { Envelope } from "geko_envelopes";
import { getTokenSymbol, isInvalidTokenContract } from "../utils/tokenUtils";
import "./EnvelopeCard.css";

interface EnvelopeCardProps {
  envelope: Envelope;
  onSelect?: (envelope: Envelope) => void;
  selected?: boolean;
}

export function EnvelopeCard({
  envelope,
  onSelect,
  selected,
}: EnvelopeCardProps) {
  const formatBalance = (balance: bigint | string | number): string => {
    // Convertir de stroops a XLM (dividir por 10,000,000)
    const balanceNum =
      typeof balance === "bigint"
        ? Number(balance)
        : typeof balance === "string"
          ? Number(balance)
          : balance;
    const xlm = balanceNum / 10000000;
    return xlm.toFixed(7);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect?.(envelope);
  };

  // Type assertion needed because envelope.token_contract type may not be properly inferred
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const tokenContract = envelope.token_contract as string;
  const isInvalid = isInvalidTokenContract(tokenContract);

  return (
    <div
      className={`envelope-card-wrapper ${selected ? "envelope-card-wrapper--selected" : ""} ${isInvalid ? "envelope-card-wrapper--invalid" : ""}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect?.(envelope);
        }
      }}
    >
      <Card variant="primary">
        <div className="envelope-card__header">
          <div className="envelope-card__icon">💌</div>
          <div className="envelope-card__id">
            #{String(envelope.id)}
            {isInvalid && (
              <span className="envelope-card__invalid-badge">⚠️</span>
            )}
          </div>
        </div>

        <div className="envelope-card__body">
          <Text as="h3" size="lg" className="envelope-card__name">
            {envelope.name}
          </Text>
          <Text as="p" size="sm" className="envelope-card__description">
            {envelope.description}
          </Text>
          {isInvalid && (
            <Text as="p" size="xs" className="envelope-card__invalid-message">
              ⚠️ Sobre no funcional
            </Text>
          )}
        </div>

        <div className="envelope-card__footer">
          <div className="envelope-card__balance">
            <Text as="span" size="xs" className="envelope-card__balance-label">
              Balance
            </Text>
            <Text as="span" size="xl" className="envelope-card__balance-amount">
              {formatBalance(envelope.balance)} {getTokenSymbol(tokenContract)}
            </Text>
          </div>
          <div className="envelope-card__token">
            <Text as="span" size="xs">
              {getTokenSymbol(tokenContract)}
            </Text>
          </div>
        </div>
      </Card>
    </div>
  );
}
