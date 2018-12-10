pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "@frontier-token-research/role-registries/contracts/OwnedRegistry.sol";
import "@frontier-token-research/role-registries/contracts/Registry.sol";
import "../Bank.sol";
import "../Vault.sol";
import "../TRLInterface.sol";
import "./IFeeEntity.sol";

contract MainSalaryEntity is Ownable, IFeeEntity {

  using SafeMath for uint256;

/*
TODOS

- make the whitelisted verification direclty on the owned registry contract
- create function to close trl for period, and then getting the total number of votes cast on that period
- create function to calculate the compensation for each user.
*/

  address vaultAddress;
  address balanceAddress;
  uint256 collectionEpochsLimit = 12;

  Bank BankInstance;
  Vault VaultInstance;
  OwnedRegistry candidateRegistry;
  TRL TRLInstance;

  // New storage

  //mapping (uint256 => mapping(address => uint256)) salaryAmountPerPeriod;

  //        epoch            user               token        paid
  mapping (uint256=> mapping(address => mapping(address => bool))) paidUsers;
  //        epoch            user               token        amount
  //mapping (uint256=> mapping(address => mapping(address => uint256))) salaryAmountPerEpochPerUser;

  constructor (address _vaultAddress, address _balanceAddress, address _trlAddress){   
    BankInstance = Bank(_balanceAddress);
    VaultInstance = Vault(_vaultAddress);
    TRLInstance = TRL(_trlAddress);
  }

  function setCandidateRegistry(address _candidateRegistryAddress) external {
    require(msg.sender == owner(), "Only the owner can call setCandidateRegistry");
    candidateRegistry = OwnedRegistry(_candidateRegistryAddress);
  }

 

  function calculatePaymentAmount(uint256 _entityBalance, uint256 _epoch, address _token, address _receiver, uint256 _userVotes, uint256 _totalVotes) public returns (uint256 amount){
    // shim function to implement the interface
    return 7;
  }

  function calculatePaymentAmount(uint256 _totalVotesCast, uint256 _votesReceived, uint256 _totalTokensToDistribute) public pure returns (uint256) {
      uint256 mulFactor = 1000000;
      uint256 votesReceivedBig = _votesReceived.mul(mulFactor);
      uint256 ratio = votesReceivedBig.div(_totalVotesCast);
      uint256 paymentAmountBig = ratio.mul(_totalTokensToDistribute);
      uint256 paymentAmountNormalized = paymentAmountBig.div(mulFactor);
      return paymentAmountNormalized;
    }

  function height() public view returns (uint256) {
    return TRLInstance.height();
  }

  /**
  * @dev Triggers the payment to a receiver. 
  * @param _destination Address of the receiver
  * @param _token Token for which the transfer is being triggered
  * @param _epoch Period for which the transfer is being triggered
  */

  /*
  
    We start by making sure that the period had already changed.
    The reason why we need to check that the period has passed it to 
    make sure that no more votes will be cast, which, in turn, allows
    us to get the definitive vote values directly from the votesAmmount. 
    
    For the task of allowing Helena to collect the remainder of the tokens
    we are going to prevent collections of funds after a certain time has passed.
    More precisely, the collectPayment function can only be called if

    height() - LIMIT < _epoch


    epoch > height
      21       20

    epoch > height - 12
      21        8

      height > epoch

      epoch > height - 12
        20      22     10  ok
        10      22     10  nop
        9       22     10  nop
  */

  
  function collectPayment(address _destination, address _token, uint256 _epoch) 
  external
  { // caching the height value
    uint256 currHeight = height();
    // checking that it's requesting the value from a previous epoch, and not
    // the current or future ones
    require(_epoch < currHeight);

    // set a deadline for collecting, like 12 epochs
    // this will allow us to collect from previous epochs
    if(currHeight >= collectionEpochsLimit){
      require(_epoch > currHeight - collectionEpochsLimit);
    }

    // check user is an allowed receiver, meaning it was whitelisted as a consumer
    // on that period
    
    require(candidateRegistry.wasWhitelisted(_destination,_epoch));

    // check that user has not been paid yet
    require(!paidUsers[_epoch][_destination][_token]);
    // check if the salary has been calculated for this epoch and token
    uint256 entityBalance = BankInstance.getStartingBalance(address(this), _token, _epoch);
    uint256 _userVotes = TRLInstance.getUserVotes(_epoch, _destination);
    uint256 _totalVotes = TRLInstance.getEpochTotalVotes(_epoch);

	// Calculate how much the user should receive
    //uint256 paymentAmount = calculatePaymentAmount(entityBalance, _epoch, _token, _destination, _userVotes, _totalVotes);
    uint256 paymentAmount = calculatePaymentAmount(_totalVotes, _userVotes, entityBalance);
    //paymentAmount = 100;
    // Transfer the funds, through the Bank contract
    BankInstance.makePayment(address(this), _destination, _token, paymentAmount, _epoch);
    // Update the user as having been paid
    paidUsers[_epoch][_destination][_token] = true;
    // emit event that the payment has been collected
    emit collectedPayment(_destination, _token, _epoch, paymentAmount);
  }

 //  function calculateMainSalaryForEpochForUser(uint256 _epoch, address _token, uint256 _entityBalance) public {
 //  // it has to be onlyOwner because we have no way of getting the list of users for a given period
 //  // the only alternative would be to only allow this value to be calculated for the "current period".
 //  // TODO: generalize role-registry to keep track of list members per period
 //   require(msg.sender == owner(), "can only be called by the owner");
   
 //   // we can remove the require owner if we index the candidates by epoch
 //   uint256 numberOfCandidates = candidateRegistry.listingCounter();

 //   uint256 basicSalaryForPeriod = _entityBalance.div(numberOfCandidates);
 //   salaryAmountPerPeriod[_epoch][_token] = basicSalaryForPeriod;
 // }
}
