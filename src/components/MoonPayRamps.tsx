import { useEffect, useRef } from "react";

type MoonPayEnvironment = "sandbox" | "production";

interface MoonPayInitParams {
	apiKey: string;
	baseCurrencyCode?: string;
	baseCurrencyAmount?: string;
	defaultCurrencyCode?: string;
}

interface MoonPayInitOptions {
	flow: "buy" | "sell";
	environment: MoonPayEnvironment;
	variant: "overlay" | "embedded";
	params: MoonPayInitParams;
}

interface MoonPaySdk {
	show: () => void;
	close?: () => void;
}

declare global {
	interface Window {
		MoonPayWebSdk?: {
			init: (options: MoonPayInitOptions) => MoonPaySdk;
		};
	}
}

const MOONPAY_SDK_URL = "https://static.moonpay.com/web-sdk/v1/moonpay-web-sdk.min.js";
const MOONPAY_SCRIPT_ID = "moonpay-web-sdk";
const MOONPAY_ENV_API_KEY = import.meta.env.MOONPAY_API_KEY;

const loadMoonPayScript = () =>
	new Promise<void>((resolve, reject) => {
		const existingScript = document.getElementById(MOONPAY_SCRIPT_ID) as HTMLScriptElement | null;

			const onScriptLoad = () => {
				existingScript?.removeEventListener("load", onScriptLoad);
				existingScript?.removeEventListener("error", onScriptError);
				resolve();
			};

			const onScriptError = () => {
				existingScript?.removeEventListener("load", onScriptLoad);
				existingScript?.removeEventListener("error", onScriptError);
				reject(new Error("Failed to load MoonPay SDK"));
			};

		if (existingScript) {
			if (existingScript.dataset.loaded === "true") {
				resolve();
			} else {
				existingScript.addEventListener("load", onScriptLoad);
				existingScript.addEventListener("error", onScriptError);
			}
			return;
		}

		const script = document.createElement("script");
		script.id = MOONPAY_SCRIPT_ID;
		script.src = MOONPAY_SDK_URL;
		script.async = true;
		script.defer = true;
		script.dataset.loaded = "false";

			const handleLoad = () => {
			script.dataset.loaded = "true";
				script.removeEventListener("load", handleLoad);
				script.removeEventListener("error", handleError);
				resolve();
			};

			const handleError = () => {
				script.removeEventListener("load", handleLoad);
				script.removeEventListener("error", handleError);
				script.remove();
				reject(new Error("Failed to load MoonPay SDK"));
			};

			script.addEventListener("load", handleLoad);
			script.addEventListener("error", handleError);

		document.body.appendChild(script);
	});

const MoonPayRamps = () => {
	const sdkRef = useRef<MoonPaySdk | null>(null);

	useEffect(() => {
		let isActive = true;

		const initMoonPay = async () => {
			try {
				await loadMoonPayScript();
				if (!isActive) {
					return;
				}

					const sdkFactory = window.MoonPayWebSdk;
					if (!sdkFactory) {
						throw new Error("MoonPay SDK unavailable after script load");
					}

					sdkRef.current = sdkFactory.init({
					flow: "buy",
					environment: "sandbox",
					variant: "overlay",
						params: {
							apiKey: MOONPAY_ENV_API_KEY,
						baseCurrencyCode: "usd",
						baseCurrencyAmount: "100",
						defaultCurrencyCode: "usdc",
					},
				});

				sdkRef.current.show();
			} catch (error) {
				// eslint-disable-next-line no-console
				console.error("MoonPay SDK initialization failed", error);
			}
		};

		initMoonPay();

		return () => {
			isActive = false;
			sdkRef.current?.close?.();
			sdkRef.current = null;
		};
	}, []);

	return (
		<div
			id="moonpay-overlay-root"
			style={{ width: "100vw", height: "100vh", position: "relative" }}
		/>
	);
};

export default MoonPayRamps;
