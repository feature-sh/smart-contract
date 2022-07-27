const { expect } = require('chai');

const provider = ethers.provider;
let feature, arbitrator;
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
  const Feature = await ethers.getContractFactory('Feature');
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

  feature = await Feature.deploy();

  await feature.deployed();

  arbitrator = await CentralizedArbitrator.deploy(
    '100', // number of erc20Mock tokens needed to pay for arbitration fees
    `${feature.address}`,
  );
  await arbitrator.deployed();

  console.log(arbitrator.address, feature.address);
  const arbitrationCost = await arbitrator.arbitrationCost();
  console.log(arbitrationCost);

  await feature.deployed();
  await arbitrator.deployed();

  contractAsSignerDeployer = feature.connect(deployer);
  contractAsSignerSender0 = feature.connect(sender0);
  contractAsSignerReceiver0 = feature.connect(receiver0);
  contractAsSignerSender1 = feature.connect(sender1);
  contractAsSignerReceiver1 = feature.connect(receiver1);
  contractAsSignerSender2 = feature.connect(sender2);
  contractAsSignerReceiver2 = feature.connect(receiver2);
  contractAsSignerSender3 = feature.connect(sender3);
  contractAsSignerReceiver3 = feature.connect(receiver3);
  contractAsSignerSender4 = feature.connect(sender4);
  contractAsSignerReceiver4 = feature.connect(receiver4);
  contractAsSignerChallenger0 = feature.connect(challenger0);
  contractAsSignerSender5 = feature.connect(sender5);
  contractAsSignerReceiver5 = feature.connect(receiver5);
  contractAsSignerChallenger1 = feature.connect(challenger1);
  contractAsSignerSender6 = feature.connect(sender6);
  contractAsSignerReceiver6 = feature.connect(receiver6);
  contractAsSignerChallenger2 = feature.connect(challenger2);
  contractAsSignerSender7 = feature.connect(sender7);
  contractAsSignerReceiver7 = feature.connect(receiver7);

  contractAsSignerJuror = arbitrator.connect(deployer);

  const initializeTx = await contractAsSignerDeployer.initialize();
});

describe('Feature', function () {
  it('Should pay the receiver after a claim and a payment', async function () {
    const createTransactionTx = await contractAsSignerSender0.createTransaction(
      arbitrator.address,
      0x00,
      '100000000000000000', // _deposit for claim : 0.1eth => 10% of amount
      '864000', // _timeoutPayment => 10 days
      '259200', // _timeoutClaim => 3 days
      '', // _metaEvidence
      {
        value: '1000000000000000000', // 1eth in wei
      },
    );

    expect((await feature.transactions(0)).sender).to.equal(sender0.address);
    expect((await feature.transactions(0)).delayClaim).to.equal('259200');

    const claimTx = await contractAsSignerReceiver0.claim(
      0, // _transactionID
      {
        value: '120000000000000000', // 0.12eth
        gasPrice: 150000000000,
      },
    );

    /*// Wait until the transaction is mined
    const transactionMinedClaimTx = await claimTx.wait();

    expect((await feature.transactions(0)).runningClaimCount).to.equal(1);

    const gasFeeClaimTx = transactionMinedClaimTx.gasUsed
      .valueOf()
      .mul(150000000000);

    expect((await feature.claims(0)).transactionID).to.equal(0);

    await network.provider.send('evm_increaseTime', [259200]);
    await network.provider.send('evm_mine'); // this one will have 100s more

    const payTx = await contractAsSignerDeployer.pay(
      0, // _claimID
    );

    const newBalanceReceiverExpected = new ethers.BigNumber.from(
      '10001000000000000000000',
    ).sub(gasFeeClaimTx);

    expect((await provider.getBalance(receiver0.address)).toString()).to.equal(
      newBalanceReceiverExpected.toString(),
    );*/
  });
});
