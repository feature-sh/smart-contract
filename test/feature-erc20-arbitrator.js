const { expect } = require('chai');

const provider = ethers.provider;
let erc20Mock, featureERC20, feature, arbitrator;
let deployer,
  sender0,
  receiver0,
  sender1,
  receiver1,
  sender2,
  receiver2,
  sender3,
  receiver3,
  sender4,
  receiver4,
  challenger0,
  sender5,
  receiver5,
  challenger1,
  sender6,
  receiver6,
  challenger2,
  sender7,
  receiver7;
let contractAsSignerDeployer, contractAsSignerSender0;

beforeEach(async function () {
  // Get the ContractFactory and Signers here.
  const ERC20Mock = await ethers.getContractFactory('ERC20Mock');
  const FeatureERC20 = await ethers.getContractFactory('FeatureERC20');
  const CentralizedArbitrator = await ethers.getContractFactory(
    'CentralizedArbitratorERC20',
  );

  [
    deployer,
    sender0,
    receiver0,
    sender1,
    receiver1,
    sender2,
    receiver2,
    sender3,
    receiver3,
    sender4,
    receiver4,
    challenger0,
    sender5,
    receiver5,
    challenger1,
    sender6,
    receiver6,
    challenger2,
    sender7,
    receiver7,
  ] = await ethers.getSigners();

  featureERC20 = await FeatureERC20.deploy();
  erc20Mock = await ERC20Mock.deploy();

  await erc20Mock.deployed();
  await featureERC20.deployed();

  arbitrator = await CentralizedArbitrator.deploy(
    '100', // number of erc20Mock tokens needed to pay for arbitration fees
    `${erc20Mock.address}`,
  );
  await arbitrator.deployed();

  console.log(arbitrator.address, erc20Mock.address, featureERC20.address);
  const arbitrationCost = await arbitrator.arbitrationCost();
  console.log(arbitrationCost);

  contractAsSignerERC20Deployer = erc20Mock.connect(deployer);
  contractAsSender0ERC20Deployer = erc20Mock.connect(sender0);
  contractAsSender1ERC20Deployer = erc20Mock.connect(sender1);
  contractAsSender2ERC20Deployer = erc20Mock.connect(sender2);
  contractAsSender3ERC20Deployer = erc20Mock.connect(sender3);
  contractAsSender4ERC20Deployer = erc20Mock.connect(sender4);
  contractAsSender5ERC20Deployer = erc20Mock.connect(sender5);
  contractAsSender6ERC20Deployer = erc20Mock.connect(sender6);
  contractAsSender7ERC20Deployer = erc20Mock.connect(sender7);

  contractAsSignerDeployer = featureERC20.connect(deployer);
  contractAsSignerSender0 = featureERC20.connect(sender0);
  contractAsSignerReceiver0 = featureERC20.connect(receiver0);
  contractAsSignerSender1 = featureERC20.connect(sender1);
  contractAsSignerReceiver1 = featureERC20.connect(receiver1);
  contractAsSignerSender2 = featureERC20.connect(sender2);
  contractAsSignerReceiver2 = featureERC20.connect(receiver2);
  contractAsSignerSender3 = featureERC20.connect(sender3);
  contractAsSignerReceiver3 = featureERC20.connect(receiver3);
  contractAsSignerSender4 = featureERC20.connect(sender4);
  contractAsSignerReceiver4 = featureERC20.connect(receiver4);
  contractAsSignerChallenger0 = featureERC20.connect(challenger0);
  contractAsSignerSender5 = featureERC20.connect(sender5);
  contractAsSignerReceiver5 = featureERC20.connect(receiver5);
  contractAsSignerChallenger1 = featureERC20.connect(challenger1);
  contractAsSignerSender6 = featureERC20.connect(sender6);
  contractAsSignerReceiver6 = featureERC20.connect(receiver6);
  contractAsSignerChallenger2 = featureERC20.connect(challenger2);
  contractAsSignerSender7 = featureERC20.connect(sender7);
  contractAsSignerReceiver7 = featureERC20.connect(receiver7);

  contractAsSignerJuror = arbitrator.connect(deployer);

  const initializeTx = await contractAsSignerDeployer.initialize();
});

describe('Feature Arbitrator ERC20', function () {
  it('Should pay the receiver after a claim and a payment', async function () {
    console.log('test');
  });
});
