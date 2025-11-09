import { useState } from "react";
import { Button, Card, Input, Select, Text } from "@stellar/design-system";
import "./CreateEnvelopeForm.css";

interface CreateEnvelopeFormProps {
  onSubmit: (
    name: string,
    description: string,
    tokenContract: string
  ) => Promise<void>;
  loading?: boolean;
  tokenAddresses: Record<string, string>;
}

export function CreateEnvelopeForm({
  onSubmit,
  loading = false,
  tokenAddresses,
}: CreateEnvelopeFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [token, setToken] = useState<"XLM" | "USDC">("XLM");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tokenContract =
      token === "XLM" ? tokenAddresses.XLM : tokenAddresses.USDC;
    void onSubmit(name, description, tokenContract);
    // Reset form after submission
    setName("");
    setDescription("");
    setToken("XLM");
  };

  return (
    <div className="create-envelope-form">
      <Card variant="primary">
        <div className="create-envelope-form__header">
          <Text as="h2" size="lg">
            Crear Nuevo Sobre
          </Text>
          <Text as="p" size="sm" className="create-envelope-form__subtitle">
            Crea un sobre para ahorrar tus tokens de manera organizada
          </Text>
        </div>

        <form onSubmit={handleSubmit} className="create-envelope-form__form">
          <Input
            label="Nombre del sobre"
            id="env-name"
            fieldSize="md"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. AhorrosViaje"
            required
          />

          <Input
            label="Descripción"
            id="env-desc"
            fieldSize="md"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ej. Mi viaje a Japón"
            required
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
            type="submit"
            variant="primary"
            size="md"
            isFullWidth
            disabled={loading || !name.trim() || !description.trim()}
          >
            {loading ? "Creando…" : "💌 Crear Sobre"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
