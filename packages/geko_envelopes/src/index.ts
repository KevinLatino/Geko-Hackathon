import { Buffer } from "buffer";
import { Address } from '@stellar/stellar-sdk';
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from '@stellar/stellar-sdk/contract';
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Typepoint,
  Duration,
} from '@stellar/stellar-sdk/contract';
export * from '@stellar/stellar-sdk'
export * as contract from '@stellar/stellar-sdk/contract'
export * as rpc from '@stellar/stellar-sdk/rpc'

if (typeof window !== 'undefined') {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}


export const networks = {
  testnet: {
    networkPassphrase: "Test SDF Network ; September 2015",
    contractId: "CBHDPEFXULHHF3NO5EYALTUEZOFLKQ6GTCDG6MAFRWWKRVOHQHRVTLYZ",
  }
} as const

export const Errors = {
  1: {message:"NotAuthorized"},
  2: {message:"InvalidInput"},
  3: {message:"InsufficientFunds"},
  4: {message:"EnvelopeExists"},
  5: {message:"EnvelopeNotFound"}
}


export interface Envelope {
  balance: i128;
  description: string;
  id: u64;
  name: string;
  token_contract: string;
}

export type DataKey = {tag: "Envelopes", values: readonly [string]} | {tag: "NextEnvelopeId", values: readonly [string]};




export interface Client {
  /**
   * Construct and simulate a create transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Crea un nuevo sobre asociado al usuario y al contrato del token.
   */
  create: ({user, name, description, token_contract}: {user: string, name: string, description: string, token_contract: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<u64>>

  /**
   * Construct and simulate a deposit transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Deposita `amount` en el sobre identificado por `id`.
   */
  deposit: ({user, id, amount}: {user: string, id: u64, amount: i128}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a withdraw transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Retira `amount` del sobre identificado por `id`.
   */
  withdraw: ({user, id, amount}: {user: string, id: u64, amount: i128}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_balance transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Retorna el balance actual del sobre por `id`.
   */
  get_balance: ({user, id}: {user: string, id: u64}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a list_envelopes transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Lista todos los sobres asociados al usuario.
   */
  list_envelopes: ({user}: {user: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Array<Envelope>>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(null, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAABAAAAAAAAAAAAAAABUVycm9yAAAAAAAABQAAAAAAAAANTm90QXV0aG9yaXplZAAAAAAAAAEAAAAAAAAADEludmFsaWRJbnB1dAAAAAIAAAAAAAAAEUluc3VmZmljaWVudEZ1bmRzAAAAAAAAAwAAAAAAAAAORW52ZWxvcGVFeGlzdHMAAAAAAAQAAAAAAAAAEEVudmVsb3BlTm90Rm91bmQAAAAF",
        "AAAAAQAAAAAAAAAAAAAACEVudmVsb3BlAAAABQAAAAAAAAAHYmFsYW5jZQAAAAALAAAAAAAAAAtkZXNjcmlwdGlvbgAAAAARAAAAAAAAAAJpZAAAAAAABgAAAAAAAAAEbmFtZQAAABEAAAAAAAAADnRva2VuX2NvbnRyYWN0AAAAAAAT",
        "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAAAgAAAAEAAAAAAAAACUVudmVsb3BlcwAAAAAAAAEAAAATAAAAAQAAAAAAAAAOTmV4dEVudmVsb3BlSWQAAAAAAAEAAAAT",
        "AAAABQAAAAAAAAAAAAAAD0VudmVsb3BlQ3JlYXRlZAAAAAABAAAAEGVudmVsb3BlX2NyZWF0ZWQAAAAEAAAAAAAAAAR1c2VyAAAAEwAAAAAAAAAAAAAAAmlkAAAAAAAGAAAAAAAAAAAAAAAEbmFtZQAAABEAAAAAAAAAAAAAAA50b2tlbl9jb250cmFjdAAAAAAAEwAAAAAAAAAC",
        "AAAABQAAAAAAAAAAAAAAC0RlcG9zaXRNYWRlAAAAAAEAAAAMZGVwb3NpdF9tYWRlAAAABAAAAAAAAAAEdXNlcgAAABMAAAAAAAAAAAAAAAJpZAAAAAAABgAAAAAAAAAAAAAABmFtb3VudAAAAAAACwAAAAAAAAAAAAAADnRva2VuX2NvbnRyYWN0AAAAAAATAAAAAAAAAAI=",
        "AAAABQAAAAAAAAAAAAAADldpdGhkcmF3YWxNYWRlAAAAAAABAAAAD3dpdGhkcmF3YWxfbWFkZQAAAAAEAAAAAAAAAAR1c2VyAAAAEwAAAAAAAAAAAAAAAmlkAAAAAAAGAAAAAAAAAAAAAAAGYW1vdW50AAAAAAALAAAAAAAAAAAAAAAOdG9rZW5fY29udHJhY3QAAAAAABMAAAAAAAAAAg==",
        "AAAAAAAAAEBDcmVhIHVuIG51ZXZvIHNvYnJlIGFzb2NpYWRvIGFsIHVzdWFyaW8geSBhbCBjb250cmF0byBkZWwgdG9rZW4uAAAABmNyZWF0ZQAAAAAABAAAAAAAAAAEdXNlcgAAABMAAAAAAAAABG5hbWUAAAARAAAAAAAAAAtkZXNjcmlwdGlvbgAAAAARAAAAAAAAAA50b2tlbl9jb250cmFjdAAAAAAAEwAAAAEAAAAG",
        "AAAAAAAAADREZXBvc2l0YSBgYW1vdW50YCBlbiBlbCBzb2JyZSBpZGVudGlmaWNhZG8gcG9yIGBpZGAuAAAAB2RlcG9zaXQAAAAAAwAAAAAAAAAEdXNlcgAAABMAAAAAAAAAAmlkAAAAAAAGAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAA",
        "AAAAAAAAADBSZXRpcmEgYGFtb3VudGAgZGVsIHNvYnJlIGlkZW50aWZpY2FkbyBwb3IgYGlkYC4AAAAId2l0aGRyYXcAAAADAAAAAAAAAAR1c2VyAAAAEwAAAAAAAAACaWQAAAAAAAYAAAAAAAAABmFtb3VudAAAAAAACwAAAAA=",
        "AAAAAAAAAC1SZXRvcm5hIGVsIGJhbGFuY2UgYWN0dWFsIGRlbCBzb2JyZSBwb3IgYGlkYC4AAAAAAAALZ2V0X2JhbGFuY2UAAAAAAgAAAAAAAAAEdXNlcgAAABMAAAAAAAAAAmlkAAAAAAAGAAAAAQAAAAs=",
        "AAAAAAAAACxMaXN0YSB0b2RvcyBsb3Mgc29icmVzIGFzb2NpYWRvcyBhbCB1c3VhcmlvLgAAAA5saXN0X2VudmVsb3BlcwAAAAAAAQAAAAAAAAAEdXNlcgAAABMAAAABAAAD6gAAB9AAAAAIRW52ZWxvcGU=" ]),
      options
    )
  }
  public readonly fromJSON = {
    create: this.txFromJSON<u64>,
        deposit: this.txFromJSON<null>,
        withdraw: this.txFromJSON<null>,
        get_balance: this.txFromJSON<i128>,
        list_envelopes: this.txFromJSON<Array<Envelope>>
  }
}