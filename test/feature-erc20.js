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
    'CentralizedAppealableArbitrator',
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
  arbitrator = await CentralizedArbitrator.deploy('20000000000000000', '42'); // 0.02 ether, 42s
  erc20Mock = await ERC20Mock.deploy();

  await erc20Mock.deployed();
  await featureERC20.deployed();
  await arbitrator.deployed();

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

describe('Feature ERC20', function () {
  it('Should pay the receiver after a claim and a payment', async function () {
    const createTransferTx = await contractAsSignerERC20Deployer.transfer(
      sender0.address,
      100,
    );

    expect(await erc20Mock.balanceOf(sender0.address)).to.equal(100);

    const createAllowERC20Tx = await contractAsSender0ERC20Deployer.approve(
      featureERC20.address,
      100,
    );

    const createTransactionTx = await contractAsSignerSender0.createTransaction(
      arbitrator.address,
      0x00,
      erc20Mock.address,
      100,
      '100000000000000000', // _deposit for claim : 0.1eth => 10% of amount
      '864000', // _timeoutPayment => 10 days
      '259200', // _challengePeriod => 3 days
      '', // _metaEvidence
    );

    expect(await erc20Mock.balanceOf(featureERC20.address)).to.equal(100);
    expect((await featureERC20.transactions(0)).sender).to.equal(
      sender0.address,
    );
    expect((await featureERC20.transactions(0)).delayClaim).to.equal('259200');

    const claimTx = await contractAsSignerReceiver0.claim(
      0, // _transactionID
      'https://github.com/feature-sh/bot/pull/190',
      {
        value: '120000000000000000', // 0.12eth
        gasPrice: 150000000000,
      },
    );

    // Wait until the transaction is mined
    const transactionMinedClaimTx = await claimTx.wait();
    const txID = transactionMinedClaimTx.events[0].args[0].toString();

    /// Get proof from the claim
    const proofExpected = (await contractAsSignerReceiver1.claims(txID))[3];

    expect(proofExpected).to.equal('https://github.com/feature-sh/bot/pull/190');
    expect((await featureERC20.transactions(0)).runningClaimCount).to.equal(1);

    const gasFeeClaimTx = transactionMinedClaimTx.gasUsed
      .valueOf()
      .mul(150000000000);

    expect((await featureERC20.claims(0)).transactionID).to.equal(0);

    await network.provider.send('evm_increaseTime', [259200]);
    await network.provider.send('evm_mine');

    const payTx = await contractAsSignerDeployer.pay(
      0, // _claimID
    );

    const newBalanceReceiverExpected = new ethers.BigNumber.from(
      '10000000000000000000000',
    ).sub(gasFeeClaimTx);

    expect((await provider.getBalance(receiver0.address)).toString()).to.equal(
      newBalanceReceiverExpected.toString(),
    );
    expect((await erc20Mock.balanceOf(receiver0.address)).toString()).to.equal(
      '100',
    );
  });

  it('Should refund the money to the sender after a timeout payment without any claim', async function () {
    const createTransferTx = await contractAsSignerERC20Deployer.transfer(
      sender1.address,
      100,
    );

    const createAllowERC20Tx = await contractAsSender1ERC20Deployer.approve(
      featureERC20.address,
      100,
    );

    const createTransactionTx = await contractAsSignerSender1.createTransaction(
      arbitrator.address,
      0x00,
      erc20Mock.address,
      100,
      '100000000000000000', // _deposit for claim : 0.1eth => 10% of amount
      '864000', // _timeoutPayment => 10 days
      '259200', // _challengePeriod => 3 days
      '', // _metaEvidence
    );

    expect((await featureERC20.transactions(0)).sender).to.equal(
      sender1.address,
    );

    // Wait until the transaction is mined
    const transactionMinedCreateTransactionTx = await createTransactionTx.wait();
    const gasFeeCreateTransactionTx = transactionMinedCreateTransactionTx.gasUsed
      .valueOf()
      .mul(150000000000);

    await network.provider.send('evm_increaseTime', [864000]);
    await network.provider.send('evm_mine');

    const withdrawTx = await contractAsSignerDeployer.refund(
      0, // _transactionID
    );

    expect((await erc20Mock.balanceOf(sender1.address)).toString()).to.equal(
      '100',
    );
  });

  it('Should revert the refund to the sender if the timeout payment is not passed', async function () {
    const createTransferTx = await contractAsSignerERC20Deployer.transfer(
      sender2.address,
      100,
    );

    const createAllowERC20Tx = await contractAsSender2ERC20Deployer.approve(
      featureERC20.address,
      100,
    );

    const createTransactionTx = await contractAsSignerSender2.createTransaction(
      arbitrator.address,
      0x00,
      erc20Mock.address,
      100,
      '100000000000000000', // _deposit for claim : 0.1eth => 10% of amount
      '864000', // _timeoutPayment => 10 days
      '259200', // _challengePeriod => 3 days
      '', // _metaEvidence
    );

    expect((await featureERC20.transactions(0)).sender).to.equal(
      sender2.address,
    );

    // Wait until the transaction is mined
    const transactionMinedCreateTransactionTx = await createTransactionTx.wait();
    const gasFeeCreateTransactionTx = transactionMinedCreateTransactionTx.gasUsed
      .valueOf()
      .mul(150000000000);

    const claimTx = await contractAsSignerReceiver1.claim(
      0, // _transactionID
      'https://github.com/feature-sh/bot/pull/190',
      {
        value: '120000000000000000', // 0.12eth
        gasPrice: 150000000000,
      },
    );

    await network.provider.send('evm_increaseTime', [42]);
    await network.provider.send('evm_mine');

    await expect(contractAsSignerDeployer.refund(0)).to.be.revertedWith(
      'The timeout payment should be passed.',
    );
  });

  it('Should revert the refund to the sender if there is any claim', async function () {
    const createTransferTx = await contractAsSignerERC20Deployer.transfer(
      sender3.address,
      100,
    );

    const createAllowERC20Tx = await contractAsSender3ERC20Deployer.approve(
      featureERC20.address,
      100,
    );

    const createTransactionTx = await contractAsSignerSender3.createTransaction(
      arbitrator.address,
      0x00,
      erc20Mock.address,
      100,
      '100000000000000000', // _deposit for claim : 0.1eth => 10% of amount
      '864000', // _timeoutPayment => 10 days
      '259200', // _challengePeriod => 3 days
      '', // _metaEvidence
    );

    expect((await featureERC20.transactions(0)).sender).to.equal(
      sender3.address,
    );

    // Wait until the transaction is mined
    const transactionMinedCreateTransactionTx = await createTransactionTx.wait();
    const gasFeeCreateTransactionTx = transactionMinedCreateTransactionTx.gasUsed
      .valueOf()
      .mul(150000000000);

    const claimTx = await contractAsSignerReceiver2.claim(
      0, // _transactionID
      'https://github.com/feature-sh/bot/pull/190',
      {
        value: '120000000000000000', // 0.12eth
        gasPrice: 150000000000,
      },
    );

    await network.provider.send('evm_increaseTime', [864000]);
    await network.provider.send('evm_mine');

    await expect(contractAsSignerDeployer.refund(0)).to.be.revertedWith(
      'The transaction should not to have running claims.',
    );
  });

  it('Should give the arbitration fee and the total deposit to the challenger after a successful challenge', async function () {
    const createTransferTx = await contractAsSignerERC20Deployer.transfer(
      sender4.address,
      100,
    );

    const createAllowERC20Tx = await contractAsSender4ERC20Deployer.approve(
      featureERC20.address,
      100,
    );

    const createTransactionTx = await contractAsSignerSender4.createTransaction(
      arbitrator.address,
      0x00,
      erc20Mock.address,
      100,
      '100000000000000000', // _deposit for claim : 0.1eth => 10% of amount
      '864000', // _timeoutPayment => 10 days
      '259200', // _challengePeriod => 3 days
      '', // _metaEvidence
    );

    expect((await featureERC20.transactions(0)).sender).to.equal(
      sender4.address,
    );

    // Claim
    const claimTx = await contractAsSignerReceiver3.claim(
      0, // _transactionID
      'https://github.com/feature-sh/bot/pull/190',
      {
        value: '120000000000000000', // 0.12eth
        gasPrice: 150000000000,
      },
    );

    // Challenge claim
    const challengeClaimTx = await contractAsSignerChallenger0.challengeClaim(
      0, // _claimID
      {
        value: '120000000000000000', // 0.12eth
        gasPrice: 150000000000,
      },
    );

    // Wait until the transaction is mined
    const transactionMinedChallengeClaimTx = await challengeClaimTx.wait();

    const gasFeeChallengeClaimTx = transactionMinedChallengeClaimTx.gasUsed
      .valueOf()
      .mul(150000000000);

    // Give ruling
    await contractAsSignerJuror.giveRuling(
      0, // _disputeID
      2, // Ruling for the challenger
    );

    await network.provider.send('evm_increaseTime', [42]);
    await network.provider.send('evm_mine');

    // Execute ruling
    await contractAsSignerJuror.giveRuling(
      0, // _disputeID
      2, // Ruling for the challenger
    );

    const claim = await featureERC20.claims(0);

    // Claim status switch to Resolved.
    expect(parseInt(claim.status)).to.equal(2);

    const newBalanceChallenger0Expected = new ethers.BigNumber.from(
      '10000000000000000000000',
    )
      .sub(gasFeeChallengeClaimTx)
      .add('100000000000000000');

    expect(
      (await provider.getBalance(challenger0.address)).toString(),
    ).to.equal(newBalanceChallenger0Expected.toString());
  });

  it('Should give the amount of the total deposit to the claimer after a aborted challenge', async function () {
    const createTransferTx = await contractAsSignerERC20Deployer.transfer(
      sender5.address,
      100,
    );

    await createTransferTx.wait();

    const createAllowERC20Tx = await contractAsSender5ERC20Deployer.approve(
      featureERC20.address,
      100,
    );

    await createAllowERC20Tx.wait();

    const createTransactionTx = await contractAsSignerSender5.createTransaction(
      arbitrator.address,
      0x00,
      erc20Mock.address,
      100,
      '100000000000000000', // _deposit for claim : 0.1eth => 10% of amount
      '864000', // _timeoutPayment => 10 days
      '259200', // _challengePeriod => 3 days
      '', // _metaEvidence
    );

    // Claim
    const claimTx = await contractAsSignerReceiver4.claim(
      0, // _transactionID
      'https://github.com/feature-sh/bot/pull/190',
      {
        value: '120000000000000000', // 0.12eth
        gasPrice: 150000000000,
      },
    );

    // Wait until the transaction is mined
    const transactionMinedClaimTx = await claimTx.wait();

    const gasFeeClaimTx = transactionMinedClaimTx.gasUsed
      .valueOf()
      .mul(150000000000);

    // Challenge claim
    const challengeClaimTx = await contractAsSignerChallenger1.challengeClaim(
      0, // _claimID
      {
        value: '120000000000000000', // 0.12eth
        gasPrice: 150000000000,
      },
    );

    // Give ruling
    await contractAsSignerJuror.giveRuling(
      0, // _disputeID
      1, // Ruling for the receiver
    );

    await network.provider.send('evm_increaseTime', [42]);
    await network.provider.send('evm_mine');

    // Execute ruling
    await contractAsSignerJuror.giveRuling(
      0, // _disputeID
      1, // Ruling for the receiver
    );

    const newBalanceReceiver4Expected = new ethers.BigNumber.from(
      '10000000000000000000000',
    )
      .sub(gasFeeClaimTx)
      .sub('20000000000000000');

    expect((await provider.getBalance(receiver4.address)).toString()).to.equal(
      newBalanceReceiver4Expected.toString(),
    );
  });

  it('Should give the amount of the total deposit to the claimer after a successful appeal', async function () {
    const createTransferTx = await contractAsSignerERC20Deployer.transfer(
      sender6.address,
      100,
    );

    await createTransferTx.wait();

    const createAllowERC20Tx = await contractAsSender6ERC20Deployer.approve(
      featureERC20.address,
      100,
    );

    await createAllowERC20Tx.wait();

    const createTransactionTx = await contractAsSignerSender6.createTransaction(
      arbitrator.address,
      0x00,
      erc20Mock.address,
      100,
      '100000000000000000', // _deposit for claim : 0.1eth => 10% of amount
      '864000', // _timeoutPayment => 10 days
      '259200', // _challengePeriod => 3 days
      '', // _metaEvidence
    );

    // Claim
    const claimTx = await contractAsSignerReceiver5.claim(
      0, // _transactionID
      'https://github.com/feature-sh/bot/pull/190',
      {
        value: '120000000000000000', // 0.12eth
        gasPrice: 150000000000,
      },
    );

    // Wait until the transaction is mined
    const transactionMinedClaimTx = await claimTx.wait();

    const gasFeeClaimTx = transactionMinedClaimTx.gasUsed
      .valueOf()
      .mul(150000000000);

    // Challenge claim
    const challengeClaimTx = await contractAsSignerChallenger2.challengeClaim(
      0, // _claimID
      {
        value: '120000000000000000', // 0.12eth
        gasPrice: 150000000000,
      },
    );

    await challengeClaimTx.wait();

    // Give ruling
    const giveRulingTx = await contractAsSignerJuror.giveRuling(
      0, // _disputeID
      2, // Ruling for the challenger
    );

    // Appeal
    const appealTx = await contractAsSignerReceiver5.appeal(
      0, // _claimID
      {
        value: '20000000000000000', // 0.2eth
        gasPrice: 150000000000,
      },
    );

    expect((await contractAsSignerJuror.disputes(0)).status).to.equal(1);
    expect((await contractAsSignerJuror.disputes(0)).isAppealed).to.true;

    // Wait until the transaction is mined
    const transactionMinedAppealTx = await appealTx.wait();

    const gasFeeAppealTx = transactionMinedAppealTx.gasUsed
      .valueOf()
      .mul(150000000000);

    await network.provider.send('evm_increaseTime', [42]);
    await network.provider.send('evm_mine'); // this one will have 100s more

    // Execute ruling
    await contractAsSignerJuror.giveRuling(
      0, // _disputeID
      1, // Ruling for the receiver
    );

    expect((await contractAsSignerJuror.disputes(0)).status).to.equal(2);
    expect((await contractAsSignerJuror.disputes(0)).ruling).to.equal(1);

    const newBalanceReceiver5Expected = new ethers.BigNumber.from(
      '10000000000000000000000',
    )
      .sub(gasFeeClaimTx)
      .sub(gasFeeAppealTx)
      .sub('40000000000000000');

    expect((await provider.getBalance(receiver5.address)).toString()).to.equal(
      newBalanceReceiver5Expected.toString(),
    );
  });

  // Scenario: 2 claimers, the first one get the reward.
  it('Should give the amount of the first claimer who claim in multiple successful claims', async function () {
    const createTransferTx = await contractAsSignerERC20Deployer.transfer(
      sender7.address,
      100,
    );

    await createTransferTx.wait();

    const createAllowERC20Tx = await contractAsSender7ERC20Deployer.approve(
      featureERC20.address,
      100,
    );

    await createAllowERC20Tx.wait();

    const createTransactionTx = await contractAsSignerSender7.createTransaction(
      arbitrator.address,
      0x00,
      erc20Mock.address,
      100,
      '100000000000000000', // _deposit for claim : 0.1eth => 10% of amount
      '864000', // _timeoutPayment => 10 days
      '259200', // _challengePeriod => 3 days
      '', // _metaEvidence
    );

    // 1st claim
    const claimTx1 = await contractAsSignerReceiver6.claim(
      0, // _transactionID
      'https://github.com/feature-sh/bot/pull/190',
      {
        value: '120000000000000000', // 0.12eth
        gasPrice: 150000000000,
      },
    );

    // Wait until the transaction is mined
    const transactionMinedClaimTx1 = await claimTx1.wait();
    const gasFeeClaimTx1 = transactionMinedClaimTx1.gasUsed
      .valueOf()
      .mul(150000000000);

    // 2nd claim
    const claimTx2 = await contractAsSignerReceiver7.claim(
      0, // _transactionID
      'https://github.com/feature-sh/bot/pull/190',
      {
        value: '120000000000000000', // 0.12eth
        gasPrice: 150000000000,
      },
    );

    // Wait until the transaction is mined
    const transactionMinedClaimTx2 = await claimTx2.wait();
    const gasFeeClaimTx2 = transactionMinedClaimTx2.gasUsed
      .valueOf()
      .mul(150000000000);

    // Wait until the challenge period is over
    await network.provider.send('evm_increaseTime', [259200]);
    await network.provider.send('evm_mine');

    // Pay the first claimer
    const payTx = await contractAsSignerDeployer.pay(
      0, // _claimID
    );

    const newBalanceReceiver6Expected = new ethers.BigNumber.from(
      '10000000000000000000000',
    ).sub(gasFeeClaimTx1);

    const newBalanceReceiver7Expected = new ethers.BigNumber.from(
      '10000000000000000000000',
    )
      .sub(gasFeeClaimTx2)
      .sub(ethers.BigNumber.from('120000000000000000')); // Claim value

    // First claimer should receive the payment
    expect((await provider.getBalance(receiver6.address)).toString()).to.equal(
      newBalanceReceiver6Expected.toString(),
    );

    // Second claimer must not receive the payment
    expect((await provider.getBalance(receiver7.address)).toString()).to.equal(
      newBalanceReceiver7Expected.toString(),
    );
  });
});
