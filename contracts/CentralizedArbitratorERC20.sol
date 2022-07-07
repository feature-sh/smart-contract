pragma solidity ^0.8.7;

interface IERC20 {
    function totalSupply() external view returns (uint256);

    function decimals() external view returns (uint8);

    function symbol() external view returns (string memory);

    function name() external view returns (string memory);

    function getOwner() external view returns (address);

    function balanceOf(address account) external view returns (uint256);

    function transfer(address recipient, uint256 amount) external returns (bool);

    function allowance(address _owner, address spender) external view returns (uint256);

    function approve(address spender, uint256 amount) external returns (bool);

    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external returns (bool);

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

abstract contract Arbitrator {
    enum DisputeStatus {
        Waiting,
        Appealable,
        Solved
    }

    modifier requireArbitrationFee() {
        require(
            IERC20(arbitrationToken()).allowance(msg.sender, address(this)) >= arbitrationCost(),
            "Allowance of token for arbitration cost too low"
        );
        require(
            IERC20(arbitrationToken()).balanceOf(msg.sender) >= arbitrationCost(),
            "Not enough tokens for arbitration cost."
        );
        _;
    }

    modifier requireAppealFee(uint256 _disputeID) {
        require(
            IERC20(arbitrationToken()).allowance(msg.sender, address(this)) >= appealCost(_disputeID),
            "Allowance of token for appeal cost too low"
        );
        require(
            IERC20(arbitrationToken()).balanceOf(msg.sender) >= appealCost(_disputeID),
            "Not enough tokens for appeal cost."
        );
        _;
    }

    /** @dev To be raised when a dispute is created.
     *  @param _disputeID ID of the dispute.
     *  @param _arbitrable The contract which created the dispute.
     */
    event DisputeCreation(uint256 indexed _disputeID, Arbitrable indexed _arbitrable);

    /** @dev To be raised when a dispute can be appealed.
     *  @param _disputeID ID of the dispute.
     *  @param _arbitrable The contract which created the dispute.
     */
    event AppealPossible(uint256 indexed _disputeID, Arbitrable indexed _arbitrable);

    /** @dev To be raised when the current ruling is appealed.
     *  @param _disputeID ID of the dispute.
     *  @param _arbitrable The contract which created the dispute.
     */
    event AppealDecision(uint256 indexed _disputeID, Arbitrable indexed _arbitrable);

    /** @dev Create a dispute. Must be called by the arbitrable contract.
     *  Must be paid at least arbitrationCost.
     *  @param _choices Amount of choices the arbitrator can make in this dispute.
     *  @return disputeID ID of the dispute created.
     */
    function createDispute(uint256 _choices) public virtual requireArbitrationFee returns (uint256 disputeID) {
        bool transfersucceed = IERC20(arbitrationToken()).transferFrom(msg.sender, address(this), arbitrationCost());
        require(transfersucceed, "Tokens not transferred");
    }

    function arbitrationCost() public view virtual returns (uint256 fee) {}

    function arbitrationToken() public view virtual returns (address token) {}

    /** @dev Appeal a ruling. Note that it has to be called before the arbitrator contract calls rule.
     *  @param _disputeID ID of the dispute to be appealed.
     */
    function appeal(uint256 _disputeID) public payable requireAppealFee(_disputeID) {
        emit AppealDecision(_disputeID, Arbitrable(msg.sender));
    }

    function appealCost(uint256 _disputeID) public view virtual returns (uint256 _fee);

    function appealPeriod(uint256 _disputeID) public view returns (uint256 start, uint256 end) {}

    function disputeStatus(uint256 _disputeID) public view virtual returns (DisputeStatus status);

    function currentRuling(uint256 _disputeID) public view virtual returns (uint256 ruling);
}

interface IArbitrable {
    /** @dev To be emmited when meta-evidence is submitted.
     *  @param _metaEvidenceID Unique identifier of meta-evidence.
     *  @param _evidence A link to the meta-evidence JSON.
     */
    event MetaEvidence(uint256 indexed _metaEvidenceID, string _evidence);

    /** @dev To be emmited when a dispute is created to link the correct meta-evidence to the disputeID
     *  @param _arbitrator The arbitrator of the contract.
     *  @param _disputeID ID of the dispute in the Arbitrator contract.
     *  @param _metaEvidenceID Unique identifier of meta-evidence.
     *  @param _evidenceGroupID Unique identifier of the evidence group that is linked to this dispute.
     */
    event Dispute(
        Arbitrator indexed _arbitrator,
        uint256 indexed _disputeID,
        uint256 _metaEvidenceID,
        uint256 _evidenceGroupID
    );

    /** @dev To be raised when evidence are submitted. Should point to the ressource (evidences are not to be stored on chain due to gas considerations).
     *  @param _arbitrator The arbitrator of the contract.
     *  @param _evidenceGroupID Unique identifier of the evidence group the evidence belongs to.
     *  @param _party The address of the party submiting the evidence. Note that 0x0 refers to evidence not submitted by any party.
     *  @param _evidence A URI to the evidence JSON file whose name should be its keccak256 hash followed by .json.
     */
    event Evidence(
        Arbitrator indexed _arbitrator,
        uint256 indexed _evidenceGroupID,
        address indexed _party,
        string _evidence
    );

    /** @dev To be raised when a ruling is given.
     *  @param _arbitrator The arbitrator giving the ruling.
     *  @param _disputeID ID of the dispute in the Arbitrator contract.
     *  @param _ruling The ruling which was given.
     */
    event Ruling(Arbitrator indexed _arbitrator, uint256 indexed _disputeID, uint256 _ruling);

    /** @dev Give a ruling for a dispute. Must be called by the arbitrator.
     *  The purpose of this function is to ensure that the address calling it has the right to rule on the contract.
     *  @param _disputeID ID of the dispute in the Arbitrator contract.
     *  @param _ruling Ruling given by the arbitrator. Note that 0 is reserved for "Not able/wanting to make a decision".
     */
    function rule(uint256 _disputeID, uint256 _ruling) external;
}

abstract contract Arbitrable is IArbitrable {
    Arbitrator public arbitrator;
    bytes public arbitratorExtraData; // Extra data to require particular dispute and appeal behaviour.

    modifier onlyArbitrator() {
        require(msg.sender == address(arbitrator), "Can only be called by the arbitrator.");
        _;
    }

    /** @dev Constructor. Choose the arbitrator.
     *  @param _arbitrator The arbitrator of the contract.
     *  @param _arbitratorExtraData Extra data for the arbitrator.
     */
    constructor(Arbitrator _arbitrator, bytes memory _arbitratorExtraData) {
        arbitrator = _arbitrator;
        arbitratorExtraData = _arbitratorExtraData;
    }

    /** @dev Give a ruling for a dispute. Must be called by the arbitrator.
     *  The purpose of this function is to ensure that the address calling it has the right to rule on the contract.
     *  @param _disputeID ID of the dispute in the Arbitrator contract.
     *  @param _ruling Ruling given by the arbitrator. Note that 0 is reserved for "Not able/wanting to make a decision".
     */
    function rule(uint256 _disputeID, uint256 _ruling) public onlyArbitrator {
        emit Ruling(Arbitrator(msg.sender), _disputeID, _ruling);

        executeRuling(_disputeID, _ruling);
    }

    /** @dev Execute a ruling of a dispute.
     *  @param _disputeID ID of the dispute in the Arbitrator contract.
     *  @param _ruling Ruling given by the arbitrator. Note that 0 is reserved for "Not able/wanting to make a decision".
     */
    function executeRuling(uint256 _disputeID, uint256 _ruling) internal virtual;
}

/** @title Centralized Arbitrator
 *  @dev This is a centralized arbitrator deciding alone on the result of disputes. No appeals are possible.
 */
contract CentralizedArbitrator is Arbitrator {
    address public owner = msg.sender;
    uint256 public arbitrationPrice; // Not public because arbitrationCost already acts as an accessor.
    address public ERC20contract;
    uint256 public constant NOT_PAYABLE_VALUE = (2**256 - 2) / 2; // High value to be sure that the appeal is too expensive.

    struct DisputeStruct {
        Arbitrable arbitrated;
        uint256 choices;
        uint256 fee;
        uint256 ruling;
        DisputeStatus status;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Can only be called by the owner.");
        _;
    }

    DisputeStruct[] public disputes;

    constructor(uint256 _arbitrationPrice, address _ERC20contract) public {
        arbitrationPrice = _arbitrationPrice;
        ERC20contract = _ERC20contract;
    }

    /** @dev Set the arbitration price. Only callable by the owner.
     *  @param _arbitrationPrice Amount to be paid for arbitration.
     */
    function setArbitrationPrice(uint256 _arbitrationPrice) public onlyOwner {
        arbitrationPrice = _arbitrationPrice;
    }

    function arbitrationCost() public view override returns (uint256 fee) {
        return arbitrationPrice;
    }

    function arbitrationToken() public view override returns (address token) {
        return ERC20contract;
    }

    function appealCost(uint256 _disputeID) public view override returns (uint256 fee) {
        return NOT_PAYABLE_VALUE;
    }

    function createDispute(uint256 _choices) public override returns (uint256 disputeID) {
        super.createDispute(_choices);
        disputes.push(
            DisputeStruct({
                arbitrated: Arbitrable(msg.sender),
                choices: _choices,
                fee: arbitrationPrice,
                ruling: 0,
                status: DisputeStatus.Waiting
            })
        ); // Create the dispute and return its number.
        emit DisputeCreation(disputeID, Arbitrable(msg.sender));
        return disputes.length - 1;
    }

    /** @dev Give a ruling. UNTRUSTED.
     *  @param _disputeID ID of the dispute to rule.
     *  @param _ruling Ruling given by the arbitrator. Note that 0 means "Not able/wanting to make a decision".
     */
    function _giveRuling(uint256 _disputeID, uint256 _ruling) internal {
        DisputeStruct storage dispute = disputes[_disputeID];
        require(_ruling <= dispute.choices, "Invalid ruling.");
        require(dispute.status != DisputeStatus.Solved, "The dispute must not be solved already.");

        dispute.ruling = _ruling;
        dispute.status = DisputeStatus.Solved;

        IERC20(ERC20contract).transfer(msg.sender, dispute.fee); // Avoid blocking.
        dispute.arbitrated.rule(_disputeID, _ruling);
    }

    /** @dev Give a ruling. UNTRUSTED.
     *  @param _disputeID ID of the dispute to rule.
     *  @param _ruling Ruling given by the arbitrator. Note that 0 means "Not able/wanting to make a decision".
     */
    function giveRuling(uint256 _disputeID, uint256 _ruling) public onlyOwner {
        return _giveRuling(_disputeID, _ruling);
    }

    /** @dev Return the status of a dispute.
     *  @param _disputeID ID of the dispute to rule.
     *  @return status The status of the dispute.
     */
    function disputeStatus(uint256 _disputeID) public view override returns (DisputeStatus status) {
        return disputes[_disputeID].status;
    }

    /** @dev Return the ruling of a dispute.
     *  @param _disputeID ID of the dispute to rule.
     *  @return ruling The ruling which would or has been given.
     */
    function currentRuling(uint256 _disputeID) public view override returns (uint256 ruling) {
        return disputes[_disputeID].ruling;
    }
}
