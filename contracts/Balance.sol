pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "./Allowance.sol";
import "./TRL.sol";
import "./Vault.sol";


contract Balance is Ownable {
    using SafeMath for uint256;

    TRL TRLInstance;
    Allowance AllowanceInstance;
    Vault VaultInstance;

    //        period              token             entity      balance  
    mapping (uint256 => mapping (address => mapping(address => uint256))) entityBalanceForPeriod;
    mapping (uint256 => mapping (address => uint256)) public balanceStage; // 0 -> unset , 1 -> set, 2 -> changed

    constructor (address _TRLContractAddress, address _allowanceContractAddress, address _vaultContractAddress) public {
        require(msg.sender == owner(), "Sender must be the owner");
        TRLInstance = TRL(_TRLContractAddress);
        AllowanceInstance = Allowance(_allowanceContractAddress);
        VaultInstance = Vault(_vaultContractAddress);
    }

    // anyone can call this function
    function setBalancesForEntities(address[] _entities, address _tokenAddress) external{
        // only allow 10 at most, more will probably be an input mistake
        require(_entities.length < 10,"Should not provide more than 10 entities");
        uint256 currentPeriod = TRLInstance.height();
        uint256 periodPool = VaultInstance.balance(currentPeriod,_tokenAddress);

        for(uint256 i = 0; i<_entities.length; i++){
            // balance(uint256 _vaultID, address _token)
            uint256 entityAllowance = AllowanceInstance.getEntityAllowance(_entities[i]);
            uint256 entityAbsoluteAllowance = _calculateBalance(entityAllowance, periodPool);
            entityBalanceForPeriod[currentPeriod][_tokenAddress][_entities[i]] = entityAbsoluteAllowance;
            balanceStage[currentPeriod][_tokenAddress] = 1;
        }
    }
    // updates the balance after a withdrawal
    function withdraw(address _entity, address _tokenAddress, uint256 ammountWithdrawn) external {
        require(msg.sender == owner() || msg.sender == _entity,"Only the owner can update this value");
        uint256 currentPeriod = TRLInstance.height();
        uint256 currentBalance = entityBalanceForPeriod[currentPeriod][_tokenAddress][_entity];
        require(ammountWithdrawn <= currentBalance, "Trying to withdraw more than the balance");

        entityBalanceForPeriod[currentPeriod][_tokenAddress][_entity] = currentBalance.sub(ammountWithdrawn);
        balanceStage[currentPeriod][_tokenAddress] = 2;
    }

    function getBalance (address _entity, address _tokenAddress) view external returns (uint256){
        uint256 currentPeriod = TRLInstance.height();
        return entityBalanceForPeriod[currentPeriod][_tokenAddress][_entity];
    }

    function getBalance (address _entity, address _tokenAddress, uint265 _period) view external returns (uint256){
        uint256 currentPeriod;
        if(!_period){
            currentPeriod = TRLInstance.height();
        }else{
            currentPeriod = _period;
        }
        return entityBalanceForPeriod[currentPeriod][_tokenAddress][_entity];
    }

    

    function _calculateBalance(uint256 _entityAllowance, uint256 _periodPool) public pure returns (uint256 allowance){
        uint256 stepCalculation = _entityAllowance.mul(_periodPool);
        return stepCalculation.div(100);
    }
}