pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "./cron/contracts/IPeriod.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";


/**
 * Transfers are only accessible via transferFrom
 */

contract VoteToken is IERC20, Ownable {
    using SafeMath for uint256;

    IPeriod public period; 
    
    mapping (uint256 => mapping (address => uint256)) private _balances;

    mapping (uint256 => mapping(address => mapping (address => uint256))) private _allowed;

    mapping (uint256 => uint256) private _totalSupply;

    mapping (uint256 => uint256) private _transferVolume; 


    function setPeriod(address _period) public {
        period  = IPeriod(_period); 
    }

    /**
    * @dev Total number of tokens in existence
    */
    function totalSupply() public view returns (uint256) {
        return _totalSupply[period.height()];
    }

    /**
    * @dev Gets the balance of the specified address.
    * @param _tokenOwner The address to query the balance of.
    * @return An uint256 representing the amount owned by the passed address.
    */
    function balanceOf(address _tokenOwner) public view returns (uint256) {
        return balanceAt(period.height(), _tokenOwner);
    }

    /**
    * @dev Gets the balance of the specified address.
    * @param _tokenOwner The address to query the balance of.
    * @return An uint256 representing the amount owned by the passed address.
    */
    function balanceAt(uint256 _epoch, address _tokenOwner) public view returns (uint256) {
        return _balances[_epoch][_tokenOwner];
    }

    /**
     * @dev Function to check the amount of tokens that an owner allowed to a spender.
     * @param _tokenOwner address The address which owns the funds.
     * @param _spender address The address which will spend the funds.
     * @return A uint256 specifying the amount of tokens still available for the spender.
     */
    function allowance(address _tokenOwner, address _spender) public view returns (uint256) {
        if(_spender == owner()) {
            return _balances[period.height()][_tokenOwner];
        }
        else {
            return 0;
        }
    }
    /**
    * @dev Not necessary for the case, included to keep ERC20 compliance
    */
    function transfer(address _to, uint256 _value) public returns (bool) {
        return false;
    }

    /**
     * @dev Not necessary for the case, included to keep ERC20 compliance
     * 
     */
    function approve(address _spender, uint256 _value) public returns (bool) { 
        return false;
    }

    /**
     * @dev Transfer tokens from one address to another
     * @param _from address The address which you want to send tokens from
     * @param _to address The address which you want to transfer to
     * @param _value uint256 the amount of tokens to be transferred
     */
    function transferFrom(address _from, address _to, uint256 _value) public returns (bool) {   
        _transfer(_from, _to, _value);
        return true;
    }

    /**
    * @dev Transfer token for a specified addresses
    * @param _from The address to transfer from.
    * @param _to The address to transfer to.
    * @param _value The amount to be transferred.
    */
    function _transfer(address _from, address _to, uint256 _value) internal {
        require(_to != address(0));

        _balances[period.height()][_from] = _balances[period.height()][_from].sub(_value);
        _balances[period.height()][_to] = _balances[period.height()][_to].add(_value);
        _transferVolume[period.height()] =  _transferVolume[period.height()].add(_value);
        emit Transfer(_from, _to, _value);
    }

    function mint(address _account, uint256 _value) public {
        require(msg.sender ==  owner());
        _mint(_account, _value);
    }

    /**
     * @dev Internal function that mints an amount of the token and assigns it to
     * an account. This encapsulates the modification of balances such that the
     * proper events are emitted.
     * @param _account The account that will receive the created tokens.
     * @param _value The amount that will be created.
     */
    function _mint(address _account, uint256 _value) internal {
        require(_account != address(0));

        _totalSupply[period.height()] = _totalSupply[period.height()].add(_value);
        _balances[period.height()][_account] = _balances[period.height()][_account].add(_value);
        emit Transfer(address(0), _account, _value);
    }
}