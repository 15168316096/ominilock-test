import React, { useEffect, useState, StrictMode } from "react";
import { helpers, Script, config, commons } from "../../lumos/packages/lumos";
import {createRoot} from "react-dom/client";
import { asyncSleep, capacityOf, unisat, transfer } from "./lib";

const cfg = JSON.parse(JSON.stringify(config.predefined.AGGRON4));
cfg.SCRIPTS.OMNILOCK.TX_HASH =
    "0xb50ef6f2e9138f4dbca7d5280e10d29c1a65e60e8a574c009a2fa4e4107e0750";
// use testnet config
config.initializeConfig(cfg);

const App: React.FC = () => {
    const [bitcoinAddr, setBitcoinAddr] = useState("");
    const [omniAddr, setOmniAddr] = useState("");
    const [omniLock, setOmniLock] = useState<Script>();
    const [balance, setBalance] = useState("-");

    const [transferAddr, setTransferAddress] = useState("");
    const [transferAmount, setTransferAmount] = useState("");

    const [isSendingTx, setIsSendingTx] = useState(false);
    const [txHash, setTxHash] = useState("");

    useEffect(() => {
        asyncSleep(300).then(() => {
            if (unisat) connectToWallet();
        });
    }, []);

    function connectToWallet() {
        unisat
            .requestAccounts()
            .then(([bitcoinAddr]: string[]) => {
                const omniLockScript = commons.omnilock.createOmnilockScript({
                    auth: { flag: "BITCOIN", address: bitcoinAddr },
                });

                const omniAddr = helpers.encodeToAddress(omniLockScript);

                setBitcoinAddr(bitcoinAddr);
                setOmniAddr(omniAddr);
                setOmniLock(omniLockScript);

                return omniAddr;
            })
            .then((omniAddr) => capacityOf(omniAddr))
            .then((balance) => setBalance(balance.div(10 ** 8).toString() + " CKB"));
    }

    function onTransfer() {
        if (isSendingTx) return;
        setIsSendingTx(true);

        transfer({ amount: transferAmount, from: omniAddr, to: transferAddr })
            .then(setTxHash)
            .catch((e) => {
                console.log(e);
                alert(e.message || JSON.stringify(e));
            })
            .finally(() => setIsSendingTx(false));
    }

    if (!unisat) return <div>UniSat is not installed</div>;
    if (!bitcoinAddr) return <button onClick={connectToWallet}>Connect to UniSat</button>;

    return (
        <div>
            <ul>
                <li>Bitcoin Address: {bitcoinAddr}</li>
                <li>Nervos Address(Omni): {omniAddr}</li>
                <li>
                    Current Omni lock script:
                    <pre>{JSON.stringify(omniLock, null, 2)}</pre>
                </li>

                <li>Balance: {balance}</li>
            </ul>

            <div>
                <h2>Transfer to</h2>
                <label htmlFor="address">Address</label>&nbsp;
                <input id="address" type="text" onChange={(e) => setTransferAddress(e.target.value)} placeholder="ckt1..." />
                <br />
                <label htmlFor="amount">Amount</label>
                &nbsp;
                <input id="amount" type="text" onChange={(e) => setTransferAmount(e.target.value)} placeholder="shannon" />
                <br />
                <button onClick={onTransfer} disabled={isSendingTx}>
                    Transfer
                </button>
                <p>Tx Hash: {txHash}</p>
            </div>
        </div>
    );
};

const rootElement = document.getElementById("root");
const root = createRoot(rootElement);

root.render(
    <StrictMode>
        <App />
    </StrictMode>
);