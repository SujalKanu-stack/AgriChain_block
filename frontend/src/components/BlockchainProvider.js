import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";

import CONTRACT_ABI from "../utils/contractAbi";

const BlockchainContext = createContext(null);
const STORAGE_KEY = "agrichain-blockchain-demo-mode";
const WALLET_SESSION_KEY = "agrichain-blockchain-wallet-session";

const NETWORK_LABELS = {
  1: { name: "Ethereum Mainnet", explorer: "https://etherscan.io/tx/" },
  11155111: { name: "Sepolia", explorer: "https://sepolia.etherscan.io/tx/" },
  137: { name: "Polygon", explorer: "https://polygonscan.com/tx/" },
  80002: { name: "Polygon Amoy", explorer: "https://amoy.polygonscan.com/tx/" },
  31337: { name: "Hardhat Local", explorer: "" },
};

function shortenAddress(address = "") {
  if (!address) {
    return "";
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function getInitialDemoMode() {
  if (typeof window === "undefined") {
    return true;
  }

  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === "true" || saved === "false") {
    return saved === "true";
  }

  const fromEnv = process.env.REACT_APP_BLOCKCHAIN_DEMO_MODE;
  if (fromEnv === "false") {
    return false;
  }

  return true;
}

function getInitialWalletSession() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(WALLET_SESSION_KEY) === "true";
}

function getContractAddress() {
  return (
    process.env.REACT_APP_CONTRACT_ADDRESS ||
    process.env.REACT_APP_SMART_CONTRACT_ADDRESS ||
    ""
  ).trim();
}

function getNetworkMeta(chainId) {
  const numericChainId = Number(chainId || 0);
  const known = NETWORK_LABELS[numericChainId];

  if (known) {
    return {
      chainId: numericChainId,
      networkName: known.name,
      explorerBaseUrl: process.env.REACT_APP_EXPLORER_BASE_URL || known.explorer,
      chainStatus: numericChainId === 31337 ? "Local chain" : "Connected",
    };
  }

  return {
    chainId: numericChainId,
    networkName: numericChainId ? `Chain ${numericChainId}` : "Unknown network",
    explorerBaseUrl: process.env.REACT_APP_EXPLORER_BASE_URL || "",
    chainStatus: numericChainId ? "Custom chain" : "Disconnected",
  };
}

function buildExplorerUrl(baseUrl, hash) {
  if (!baseUrl || !hash) {
    return "";
  }

  return `${baseUrl}${hash}`;
}

function parseOnChainBatchId(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error("This batch is not linked to an on-chain record yet. Create a new live batch or switch to demo mode.");
  }

  return BigInt(Math.round(parsed));
}

function parseReceiptForEvent(receipt, iface, eventName) {
  for (const log of receipt?.logs || []) {
    try {
      const parsed = iface.parseLog(log);
      if (parsed?.name === eventName) {
        return parsed.args;
      }
    } catch (error) {
      continue;
    }
  }

  return null;
}

export function BlockchainProvider({ children }) {
  const contractAddress = getContractAddress();
  const [demoMode, setDemoMode] = useState(getInitialDemoMode);
  const [walletSessionActive, setWalletSessionActive] = useState(getInitialWalletSession);
  const [wallet, setWallet] = useState({
    address: "",
    shortAddress: "",
    isConnected: false,
    isMetaMaskInstalled: false,
    networkName: "Disconnected",
    chainId: null,
    chainStatus: contractAddress ? "Awaiting wallet" : "Contract not configured",
    role: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, String(demoMode));
    }
  }, [demoMode]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(WALLET_SESSION_KEY, String(walletSessionActive));
    }
  }, [walletSessionActive]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const ethereum = window.ethereum;
    if (!ethereum) {
      setWallet((current) => ({
        ...current,
        isMetaMaskInstalled: false,
        chainStatus: contractAddress ? "MetaMask not installed" : "Contract not configured",
      }));
      return undefined;
    }

    const syncWallet = async () => {
      try {
        const provider = new ethers.BrowserProvider(ethereum);
        const accounts = await provider.send("eth_accounts", []);
        const network = await provider.getNetwork();
        const networkMeta = getNetworkMeta(network.chainId);
        const hasAuthorizedAccount = Boolean(accounts[0]);
        const address = walletSessionActive && hasAuthorizedAccount ? accounts[0] : "";
        let role = 0;

        if (address && contractAddress) {
          try {
            const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, provider);
            role = Number(await contract.getUserRole(address));
          } catch (error) {
            role = 0;
          }
        }

        setWallet({
          address,
          shortAddress: shortenAddress(address),
          isConnected: Boolean(address),
          isMetaMaskInstalled: true,
          networkName: networkMeta.networkName,
          chainId: networkMeta.chainId,
          chainStatus: contractAddress
            ? address
              ? networkMeta.chainStatus
              : hasAuthorizedAccount
                ? "Disconnected in app"
                : "Wallet not connected"
            : "Contract not configured",
          explorerBaseUrl: networkMeta.explorerBaseUrl,
          role,
        });
      } catch (error) {
        setWallet((current) => ({
          ...current,
          isMetaMaskInstalled: true,
          chainStatus: "Wallet unavailable",
        }));
      }
    };

    syncWallet();
    ethereum.on("accountsChanged", syncWallet);
    ethereum.on("chainChanged", syncWallet);

    return () => {
      ethereum.removeListener("accountsChanged", syncWallet);
      ethereum.removeListener("chainChanged", syncWallet);
    };
  }, [contractAddress, walletSessionActive]);

  const pushTransaction = (entry) => {
    setRecentTransactions((current) => [entry, ...current].slice(0, 6));
  };

  const updateTransaction = (id, patch) => {
    setRecentTransactions((current) =>
      current.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry))
    );
  };

  const connectWallet = async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      throw new Error("MetaMask is not installed");
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.send("eth_requestAccounts", []);
    const network = await provider.getNetwork();
    const networkMeta = getNetworkMeta(network.chainId);
    const address = accounts[0] || "";
    let role = 0;

    if (address && contractAddress) {
      try {
        const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, provider);
        role = Number(await contract.getUserRole(address));
      } catch (error) {
        role = 0;
      }
    }

    setWalletSessionActive(true);
    setWallet({
      address,
      shortAddress: shortenAddress(address),
      isConnected: Boolean(address),
      isMetaMaskInstalled: true,
      networkName: networkMeta.networkName,
      chainId: networkMeta.chainId,
      chainStatus: contractAddress ? networkMeta.chainStatus : "Contract not configured",
      explorerBaseUrl: networkMeta.explorerBaseUrl,
      role,
    });
  };

  const disconnectWallet = async () => {
    setWalletSessionActive(false);
    setWallet((current) => ({
      ...current,
      address: "",
      shortAddress: "",
      isConnected: false,
      role: 0,
      chainStatus: contractAddress
        ? current.isMetaMaskInstalled
          ? "Disconnected in app"
          : "MetaMask not installed"
        : "Contract not configured",
    }));
  };

  const toggleDemoMode = () => {
    setDemoMode((current) => !current);
  };

  const getLiveContract = async () => {
    if (demoMode) {
      throw new Error("Demo mode is active");
    }

    if (!contractAddress) {
      throw new Error("Contract address not configured");
    }

    if (typeof window === "undefined" || !window.ethereum) {
      throw new Error("MetaMask is not installed");
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, signer);

    return { provider, signer, contract };
  };

  const executeContractTransaction = async ({ action, method, args, fallbackHash, parseEvent }) => {
    if (demoMode) {
      const id = `demo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const hash = fallbackHash || `demo-${Date.now().toString(16)}`;
      const networkMeta = getNetworkMeta(wallet.chainId);

      pushTransaction({
        id,
        action,
        hash,
        status: "success",
        networkName: networkMeta.networkName,
        explorerUrl: "",
        demoMode: true,
        timestamp: new Date().toISOString(),
      });

      return { hash, demoMode: true };
    }

    const { contract } = await getLiveContract();
    const tx = await contract[method](...args);
    const id = `${tx.hash}-${Date.now()}`;
    const explorerUrl = buildExplorerUrl(wallet.explorerBaseUrl, tx.hash);

    pushTransaction({
      id,
      action,
      hash: tx.hash,
      status: "pending",
      networkName: wallet.networkName,
      explorerUrl,
      demoMode: false,
      timestamp: new Date().toISOString(),
    });

    try {
      const receipt = await tx.wait();
      const parsedArgs = parseEvent ? parseReceiptForEvent(receipt, contract.interface, parseEvent) : null;

      updateTransaction(id, {
        status: "success",
        blockNumber: Number(receipt?.blockNumber || 0),
        timestamp: new Date().toISOString(),
      });

      return {
        hash: tx.hash,
        receipt,
        parsedArgs,
        explorerUrl,
        demoMode: false,
      };
    } catch (error) {
      updateTransaction(id, {
        status: "error",
        error: error.message,
      });
      throw error;
    }
  };

  const createBatchTransaction = async ({
    productName,
    farmerName,
    location,
    quantity,
    farmerPrice,
    harvestDate,
  }) => {
    const result = await executeContractTransaction({
      action: "Batch Creation",
      method: "createBatch",
      args: [
        productName,
        farmerName,
        location,
        BigInt(Math.round(Number(quantity) || 0)),
        BigInt(Math.round(Number(farmerPrice) || 0)),
        BigInt(Math.floor(new Date(harvestDate || Date.now()).getTime() / 1000)),
      ],
      fallbackHash: `demo-create-${Date.now()}`,
      parseEvent: "BatchCreated",
    });

    const batchId = result?.parsedArgs?.batchId ? Number(result.parsedArgs.batchId) : null;
    return { ...result, batchId };
  };

  const transferOwnershipTransaction = async (batch, options = {}) => {
    const currentStageIndex = Number(batch?.currentStageIndex ?? 0);

    if (currentStageIndex <= 1) {
      return executeContractTransaction({
        action: "Ownership Transfer",
        method: "updateShipment",
        args: [
          parseOnChainBatchId(batch?.blockchainId || batch?.id),
          options.location || batch?.currentLocation || batch?.originLocation || "In transit",
          options.notes || "Ownership handoff recorded through MetaMask",
        ],
        fallbackHash: `demo-transfer-${Date.now()}`,
        parseEvent: "StageUpdated",
      });
    }

    if (currentStageIndex === 2) {
      return executeContractTransaction({
        action: "Ownership Transfer",
        method: "updateRetailPrice",
        args: [
          parseOnChainBatchId(batch?.blockchainId || batch?.id),
          BigInt(Math.round(Number(options.nextPrice ?? batch?.nextPrice ?? batch?.currentPrice ?? 0))),
          options.notes || "Retail handoff recorded through MetaMask",
        ],
        fallbackHash: `demo-retail-${Date.now()}`,
        parseEvent: "PriceUpdated",
      });
    }

    return executeContractTransaction({
      action: "Ownership Transfer",
      method: "confirmSale",
      args: [
        parseOnChainBatchId(batch?.blockchainId || batch?.id),
        options.location || batch?.currentLocation || "Retail Store",
        options.notes || "Consumer ownership verified through MetaMask",
      ],
      fallbackHash: `demo-sale-${Date.now()}`,
      parseEvent: "StageUpdated",
    });
  };

  const updateShipmentCheckpointTransaction = async (shipment, options = {}) => {
    return executeContractTransaction({
      action: "Shipment Checkpoint",
      method: "updateShipment",
      args: [
        parseOnChainBatchId(shipment?.shipmentId || shipment?.blockchainId || shipment?.id),
        options.location || shipment?.currentLocation || "Checkpoint",
        options.notes || "Checkpoint update signed in MetaMask",
      ],
      fallbackHash: `demo-checkpoint-${Date.now()}`,
      parseEvent: "StageUpdated",
    });
  };

  const consumerVerificationTransaction = async (batch, options = {}) => {
    return executeContractTransaction({
      action: "Consumer Verification",
      method: "confirmSale",
      args: [
        parseOnChainBatchId(batch?.blockchainId || batch?.id),
        options.location || batch?.currentLocation || "Consumer Verification",
        options.notes || "Consumer verification signed in MetaMask",
      ],
      fallbackHash: `demo-verify-${Date.now()}`,
      parseEvent: "StageUpdated",
    });
  };

  const value = useMemo(
    () => ({
      demoMode,
      toggleDemoMode,
      connectWallet,
      disconnectWallet,
      contractAddress,
      wallet,
      recentTransactions,
      createBatchTransaction,
      transferOwnershipTransaction,
      updateShipmentCheckpointTransaction,
      consumerVerificationTransaction,
      hasLiveContract: Boolean(contractAddress),
    }),
    [contractAddress, demoMode, recentTransactions, wallet]
  );

  return <BlockchainContext.Provider value={value}>{children}</BlockchainContext.Provider>;
}

export function useBlockchain() {
  const context = useContext(BlockchainContext);

  if (!context) {
    throw new Error("useBlockchain must be used inside BlockchainProvider");
  }

  return context;
}
