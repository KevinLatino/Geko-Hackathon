# Geko - Stellar Scaffold Edition

This repository contains **Geko-Hackathon**, the version of Geko developed specifically for the **Stellar Scaffold Hackathon** in collaboration with **Aha Labs**. 

It implements a streamlined user experience focused on **habit-based saving**, **simple investing**, and **on-chain rewards**, with minimal onboarding friction through **Stellar Wallet Kit**.

---

## Features

- **Wallet Onboarding via Stellar Wallet Kit** (Testnet).
- **Envelopes (Savings Goals)**: create and manage savings objectives.
- **Easy Investing**: invokes contract functions with simplified UI flows.
- **Rewards Framework**: users can claim incentives tied to savings behavior.
- **AI Assistant**: 24/7 assistant that helps you towards your financial goals.

---

## Requirements

- Node.js **18+**
- npm / yarn / pnpm (examples use `npm`)
- Stellar CLI with Soroban support installed

---

## Setup & Run

### 1) Install Dependencies

```bash
git clone https://github.com/Geko-Finance/Geko-Hackathon.git && cd Geko-Hackathon
npm install
```

### 2) Configure Environment Variables

```bash
cp .env.example .env
```

### 3) Generate Soroban TypeScript Bindings

Run this command to generate a typed client for the deployed contract:

```bash
stellar contract bindings typescript   --network testnet   --id CBHDPEFXULHHF3NO5EYALTUEZOFLKQ6GTCDG6MAFRWWKRVOHQHRVTLYZ   --output-dir ./packages/geko_envelopes   --overwrite
```

Move into the bindings package, install dependencies, and build:

```bash
cd packages/geko_envelopes
npm install
npm run build
cd ../..
npm add file:./packages/geko_envelopes
```

### 4) Start the App

```bash
npm run dev
```

Open the development server shown in the terminal (typically `http://localhost:5173/`) and connect a compatible Stellar Wallet Kit wallet on **testnet**.

---

## Tech Stack

- **React + Vite**
- **TypeScript**
- **Stellar Wallet Kit**

All thanks to the Stellar Scaffold by Aha Labs.

---
## Notes

The AI Feature is in the `feat/ai-agent`, it is NOT in dev.

Checkout a full demo over at: [Demo + Pitch - Geko](https://www.youtube.com/watch?v=Wxt_zfRoGK8)
