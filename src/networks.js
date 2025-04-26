// src/networks.js

export const networks = {
  monad: {
    chainId: "10143",
    chainName: "Monad Testnet",
    nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
    rpcUrls: ["https://testnet-rpc.monad.xyz"],
    blockExplorerUrls: ["https://testnet.monadexplorer.com/"]
  },
  somnia: {
    chainId: "50312",
    chainName: "Somnia Testnet",
    nativeCurrency: { name: "Somnia", symbol: "STT", decimals: 18 },
    rpcUrls: ["https://dream-rpc.somnia.network"],
    blockExplorerUrls: ["https://shannon-explorer.somnia.network/"]
  },
};

export const getNetworkParams = (network) => networks[network];
// User-01
export const contractAddresses = {
  monad: "0x62C7eA9ce3d69e5B9Ce745fB28aa225Ff860D440",
  somnia: "0x651Be9B210B9562cfCd228845f58D7d3EF7D9fc1",
};
