import { useWallet } from "../hooks/useWallet";
import { MoonPayBuyWidget } from "@moonpay/moonpay-react";

const MoonPayRamps = () => {
	const { address, isPending } = useWallet();

	if (isPending || !address) {
		return <div>
			<h1>Address required.</h1>
			<p>Please connect your wallet to use this feature.</p>
		</div>;
	}

	return (
		<MoonPayBuyWidget
			variant="overlay"
			baseCurrencyCode="usd"
			baseCurrencyAmount="100"
			defaultCurrencyCode="xlm"
			walletAddress={address}
			visible
		/>
	);
};

export default MoonPayRamps;
