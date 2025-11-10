import { Icon, Tooltip } from "@stellar/design-system";
import type { Envelope } from "geko_envelopes";
import { useEffect, useState } from "react";
import EnvelopeEditModal from "../components/EnvelopeEditModal";
import { TOKEN_ADDRESSES } from "../components/modules/envelopes/constants";
import { getTokenSymbol } from "../components/modules/envelopes/utils/tokenUtils";
import { stellarNetwork } from "../contracts/util";
import { useEnvelopes } from "../hooks/useEnvelopes";
import { useNotification } from "../hooks/useNotification";
import { useWallet } from "../hooks/useWallet";
import { useWalletBalance } from "../hooks/useWalletBalance";
import { getUSDCIssuer } from "../util/assets";

const CONTRACT_ID = "CBHDPEFXULHHF3NO5EYALTUEZOFLKQ6GTCDG6MAFRWWKRVOHQHRVTLYZ";

/**
 * Convierte un string a snake_case (minúsculas con guiones bajos)
 * Ejemplo: "Trip to Europe" -> "trip_to_europe"
 */
const toSnakeCase = (str: string): string => {
  return str
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_") // Reemplaza espacios con guiones bajos
    .replace(/[^a-z0-9_]/g, "") // Elimina caracteres especiales que no sean alfanuméricos o guiones bajos
    .replace(/_+/g, "_") // Reemplaza múltiples guiones bajos consecutivos con uno solo
    .replace(/^_|_$/g, ""); // Elimina guiones bajos al inicio y final
};

/**
 * Convierte snake_case a formato legible para mostrar en la UI
 * Ejemplo: "trip_to_europe" -> "Trip to Europe"
 */
const toReadableFormat = (str: string): string => {
  return str
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

interface EnvelopeWithDate extends Envelope {
  createdAt?: string;
}

export default function EnvelopesPage() {
  const { address, isPending, triggerCurrencyChange } = useWallet();
  const { loading, createEnvelope, listEnvelopes, deposit } =
    useEnvelopes(CONTRACT_ID);
  const { balances } = useWalletBalance();
  const { addNotification } = useNotification();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [token, setToken] = useState<"XLM" | "USDC">("XLM");
  const [initialAmount, setInitialAmount] = useState("");
  const [hasYield, setHasYield] = useState(false);
  const [isCreateExpanded, setIsCreateExpanded] = useState(true);
  const [isYieldTooltipVisible, setIsYieldTooltipVisible] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEnvelope, setSelectedEnvelope] =
    useState<EnvelopeWithDate | null>(null);
  const [wasWalletModalOpen, setWasWalletModalOpen] = useState(false);

  const [userEnvelopes, setUserEnvelopes] = useState<EnvelopeWithDate[]>([]);

  // Load envelopes on mount and when address changes
  useEffect(() => {
    if (address) {
      void refreshEnvelopesList();
    }
  }, [address]);

  // Update wallet card currency when token changes
  useEffect(() => {
    if (token === "USDC") {
      triggerCurrencyChange("USD");
    } else {
      triggerCurrencyChange("XLM");
    }
  }, [token, triggerCurrencyChange]);

  if (isPending) {
    return (
      <div className="envelopes-page">
        <div className="envelopes-page__loading">Conectando wallet…</div>
      </div>
    );
  }

  if (!address) {
    return (
      <div className="envelopes-page">
        <div className="envelopes-page__empty">
          Por favor conecta tu wallet.
        </div>
      </div>
    );
  }

  const refreshEnvelopesList = async () => {
    const res = await listEnvelopes();
    if (res) {
      // Load createdAt from localStorage for each envelope
      const envelopesWithDate: EnvelopeWithDate[] = res.map((env) => {
        const stored = localStorage.getItem(`envelope_${env.id.toString()}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          return {
            ...env,
            createdAt: parsed.createdAt || new Date().toISOString(),
          };
        }
        return {
          ...env,
          createdAt: new Date().toISOString(),
        };
      });
      setUserEnvelopes(envelopesWithDate);
    }
  };

  const checkUSDCTrustline = async (): Promise<boolean> => {
    if (!address) return false;

    try {
      const usdcIssuer = getUSDCIssuer();
      const network = stellarNetwork;
      const horizonUrl =
        network === "PUBLIC"
          ? "https://horizon.stellar.org"
          : "https://horizon-testnet.stellar.org";

      const response = await fetch(`${horizonUrl}/accounts/${address}`);
      if (!response.ok) {
        return false;
      }

      const account = await response.json();

      // Check if account has USDC trustline
      const hasUsdcTrustline = account.balances?.some(
        (balance: any) =>
          balance.asset_code === "USDC" && balance.asset_issuer === usdcIssuer
      );

      return hasUsdcTrustline || false;
    } catch (error) {
      console.error("Error checking trustline:", error);
      return false;
    }
  };

  const handleCreate = () => {
    void (async () => {
      if (!name.trim() || !description.trim()) {
        addNotification("Please complete all fields.", "error");
        return;
      }

      const tokenContract =
        token === "XLM" ? TOKEN_ADDRESSES.XLM : TOKEN_ADDRESSES.USDC;
      const tokenSymbol = getTokenSymbol(tokenContract);

      // Validate initial amount if provided
      if (initialAmount.trim()) {
        const amount = parseFloat(initialAmount);
        if (isNaN(amount) || amount <= 0) {
          addNotification("Please enter a valid initial amount.", "error");
          return;
        }

        // Check if it's USDC and validate trustline and balance
        if (tokenSymbol === "USDC") {
          const hasTrustline = await checkUSDCTrustline();
          const usdcBalance = balances.find(
            (b) =>
              b.asset_type !== "native" &&
              b.asset_type !== "liquidity_pool_shares" &&
              b.asset_code === "USDC"
          );
          const hasBalance = usdcBalance && parseFloat(usdcBalance.balance) > 0;

          if (!hasTrustline) {
            addNotification(
              "You don't have a USDC trustline. Please add a USDC trustline first to deposit USDC.",
              "error",
              true
            );
            return;
          }

          if (!hasBalance) {
            addNotification(
              "You don't have USDC balance. Please acquire USDC first to make a deposit.",
              "error",
              true
            );
            return;
          }

          const availableBalance = parseFloat(usdcBalance.balance);

          if (amount > availableBalance) {
            addNotification(
              `Insufficient USDC balance. You have ${availableBalance.toFixed(2)} USDC available.`,
              "error",
              true
            );
            return;
          }
        }
      }

      try {
        // Convertir name y description a snake_case antes de enviar al contrato
        const formattedName = toSnakeCase(name);
        const formattedDescription = toSnakeCase(description);

        // Validar que después de la conversión no estén vacíos
        if (!formattedName || !formattedDescription) {
          addNotification(
            "Please enter valid values (only letters, numbers and spaces).",
            "error"
          );
          return;
        }

        // Create envelope first
        const createTx = await createEnvelope(
          formattedName,
          formattedDescription,
          tokenContract
        );
        const createHash = createTx?.sendTransactionResponse?.hash;

        if (!createHash) {
          addNotification("Error creating envelope", "error");
          return;
        }

        // If there's an initial amount, deposit it after creation
        if (initialAmount.trim()) {
          const amount = parseFloat(initialAmount);

          // Wait a bit for the envelope to be created on-chain
          await new Promise((resolve) => setTimeout(resolve, 2000));

          // Refresh envelopes list to get the new envelope ID
          await refreshEnvelopesList();

          // Find the newly created envelope by name (in snake_case)
          // Use a fresh list from listEnvelopes to ensure we have the latest data
          const freshEnvelopes = await listEnvelopes();
          const newEnvelope = freshEnvelopes.find(
            (env) => env.name === formattedName
          );

          if (newEnvelope) {
            // Make the deposit
            await deposit(
              newEnvelope.id,
              BigInt(Math.round(amount * 10000000))
            );
            addNotification(
              "Envelope created and initial deposit successful!",
              "success"
            );
          } else {
            addNotification(
              "Envelope created but could not find it for deposit. Please deposit manually.",
              "warning"
            );
          }
        } else {
          addNotification("Envelope created successfully!", "success");
        }

        // Reset form
        setName("");
        setDescription("");
        setInitialAmount("");

        // Refresh list after a short delay to allow blockchain to update
        setTimeout(async () => {
          await refreshEnvelopesList();
        }, 2000);
      } catch (e) {
        console.error(e);
        const errorMessage = e instanceof Error ? e.message : "Unknown error";
        const normalizedMessage = errorMessage.toLowerCase();
        const isBalanceError =
          normalizedMessage.includes("resulting balance is not within the allowed range") ||
          normalizedMessage.includes("error(contract, #10)");

        if (isBalanceError) {
          addNotification(
            "We couldn’t create the envelope with an initial deposit. Confirm your wallet has enough balance for this asset and the trustline/allowance is enabled.",
            "error",
            true
          );
          return;
        }

        addNotification(`Error creating envelope: ${errorMessage}`, "error");
      }
    })();
  };

  const formatBalance = (
    balance: bigint | string | number,
    tokenContract: string
  ): string => {
    const balanceNum =
      typeof balance === "bigint"
        ? Number(balance)
        : typeof balance === "string"
          ? Number(balance)
          : balance;

    const xlm = balanceNum / 10000000;
    const tokenSymbol = getTokenSymbol(tokenContract);

    return `${xlm.toFixed(7)} ${tokenSymbol}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString)
      return new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleEnvelopeEdit = (envelope: EnvelopeWithDate) => {
    setSelectedEnvelope(envelope);

    const walletModal = document.querySelector(".wallet-modal.open");
    const wasOpen = walletModal !== null;
    setWasWalletModalOpen(wasOpen);

    setIsEditModalOpen(true);

    if (wasOpen) {
      const walletDrawerButton = document.querySelector(
        ".logo-icon, .mobile-wallet-btn"
      ) as HTMLElement;
      if (walletDrawerButton) {
        walletDrawerButton.click();
      }
    }
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedEnvelope(null);

    if (wasWalletModalOpen) {
      setTimeout(() => {
        const walletDrawerButton = document.querySelector(
          ".logo-icon, .mobile-wallet-btn"
        ) as HTMLElement;
        if (walletDrawerButton) {
          walletDrawerButton.click();
        }
      }, 100);
    }
    setWasWalletModalOpen(false);
  };

  const handleEnvelopeUpdate = () => {
    void refreshEnvelopesList();
  };

  return (
    <div className="envelopes-page pool-container lg:p-1 md:p-5 sm:p-5">
      <div className="create-envelope-section">
        <div className="create-envelope-header">
          <div className="create-envelope-title-row">
            <h2 className="create-envelope-title">Create a new envelope</h2>
            <button
              className="create-envelope-toggle"
              onClick={() => setIsCreateExpanded(!isCreateExpanded)}
            >
              <Icon.ChevronDown
                size="md"
                className={isCreateExpanded ? "expanded" : ""}
              />
            </button>
          </div>
          <div
            className={`create-envelope-description-wrapper ${
              isCreateExpanded ? "expanded" : ""
            }`}
          >
            <p className="create-envelope-description">
              Complete the fields to create a new envelope
            </p>
          </div>
        </div>

        <div
          className={`create-envelope-form-wrapper ${
            isCreateExpanded ? "expanded" : ""
          }`}
        >
          <div className="create-envelope-form">
            <div className="form-field">
              <label className="form-label">Name</label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Trip to Europe"
              />
            </div>

            <div className="form-field">
              <label className="form-label">Description</label>
              <input
                type="text"
                className="form-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Savings for a future goal"
              />
            </div>

            <div className="form-field">
              <label className="form-label">Token</label>
              <div className="token-selector">
                <button
                  className={`token-selector-btn ${token === "XLM" ? "active" : ""}`}
                  onClick={() => setToken("XLM")}
                >
                  XLM
                </button>
                <button
                  className={`token-selector-btn ${token === "USDC" ? "active" : ""}`}
                  onClick={() => setToken("USDC")}
                >
                  USDC
                </button>
              </div>
            </div>

            <div className="form-field">
              <label className="form-label">Initial Amount (Optional)</label>
              <input
                type="number"
                step="0.0000001"
                min="0"
                className="form-input"
                value={initialAmount}
                onChange={(e) => setInitialAmount(e.target.value)}
                placeholder={`0.0 ${token}`}
              />
            </div>

            <div className="form-field">
              <div className="form-label-row yield-field-row">
                <div className="yield-label-container">
                  <label className="form-label">Yield</label>
                  <div
                    onMouseEnter={() => setIsYieldTooltipVisible(true)}
                    onMouseLeave={() => setIsYieldTooltipVisible(false)}
                  >
                    <Tooltip
                      isVisible={isYieldTooltipVisible}
                      isContrast
                      title="What is Yield?"
                      placement="top"
                      triggerEl={
                        <div className="yield-tooltip-trigger" role="button">
                          <Icon.InfoCircle size="sm" />
                        </div>
                      }
                    >
                      <div style={{ maxWidth: "250px" }}>
                        Yield allows your envelope to earn interest over time.
                        When enabled, your funds will be automatically invested
                        to generate returns.
                      </div>
                    </Tooltip>
                  </div>
                </div>
                <div className="yield-switch-container">
                  <button
                    className={`yield-switch ${hasYield ? "active" : ""}`}
                    onClick={() => setHasYield(!hasYield)}
                    type="button"
                  >
                    <span
                      className={`yield-switch-slider ${hasYield ? "active" : ""}`}
                    />
                  </button>
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button
                className="create-button"
                onClick={handleCreate}
                disabled={loading || !name.trim() || !description.trim()}
              >
                {loading ? "Creating..." : "Create new"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="envelopes-grid-section">
        {userEnvelopes.length === 0 ? (
          <div className="envelopes-page__empty">
            No envelopes yet. Create your first one above!
          </div>
        ) : (
          <div className="envelopes-grid">
            {userEnvelopes.map((envelope) => {
              const tokenContract = envelope.token_contract as string;
              return (
                <div key={envelope.id.toString()} className="envelope-card">
                  <div className="envelope-card-header">
                    <span className="envelope-date">
                      {formatDate(envelope.createdAt)}
                    </span>
                    <button
                      className="envelope-edit-btn"
                      onClick={() => handleEnvelopeEdit(envelope)}
                    >
                      <Icon.Pencil01 size="sm" />
                    </button>
                  </div>
                  <h3 className="envelope-name">
                    {toReadableFormat(envelope.name)}
                  </h3>
                  <div className="envelope-status">
                    <span className="status-badge">Saved</span>
                  </div>
                  <div className="envelope-balance">
                    {formatBalance(envelope.balance, tokenContract)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <EnvelopeEditModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        envelope={selectedEnvelope}
        onUpdate={handleEnvelopeUpdate}
      />
    </div>
  );
}
