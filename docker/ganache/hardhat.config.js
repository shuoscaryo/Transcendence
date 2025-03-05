require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.0",
  networks: {
    ganache: {
      url: "http://127.0.0.1:7545", // Asegúrate de que sea la IP correcta de Ganache
      accounts: {
        mnemonic: "cube same payment father quiz ethics detect click fox final art thumb"
      }
    }
  }
};
