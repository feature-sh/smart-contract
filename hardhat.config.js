require('@nomiclabs/hardhat-waffle');
require('hardhat-tracer');
require('@nomiclabs/hardhat-etherscan');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, './.env') });

const {
  INFURA_PROJECT_ID,
  PRIVATE_KEY_DEPLOYER,
  MATICVIGIL_API_KEY,
  ETHERSCAN_API_KEY,
} = process.env;

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task('accounts', 'Prints the list of accounts', async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: '0.8.7',
  networks: {
    ...(INFURA_PROJECT_ID &&
      PRIVATE_KEY_DEPLOYER && {
        goerli: {
          url: `https://goerli.infura.io/v3/${INFURA_PROJECT_ID}`,
          accounts: [PRIVATE_KEY_DEPLOYER],
        },
      }),
    ...(PRIVATE_KEY_DEPLOYER && {
      poa: {
        url: 'https://sokol.poa.network/',
        accounts: [PRIVATE_KEY_DEPLOYER],
        gasPrice: 8000000000,
      },
    }),
    ...(MATICVIGIL_API_KEY &&
      PRIVATE_KEY_DEPLOYER && {
        matic: {
          url: `https://rpc-mumbai.maticvigil.com/v1/${MATICVIGIL_API_KEY}`,
          accounts: [PRIVATE_KEY_DEPLOYER],
          gasPrice: 8000000000,
        },
      }),
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
};
