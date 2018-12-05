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

    IPeriod period; 
    
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
    * @dev Transfer token for a specified address
    * @param _to The address to transfer to.
    * @param _value The amount to be transferred.
    */
    function transfer(address _to, uint256 _value) public returns (bool) {
        require(msg.sender ==  owner());
        _transfer(msg.sender, _to, _value);
        return true;
    }

    /**
     * @dev Approve the passed address to spend the specified amount of tokens on behalf of msg.sender.
     * Beware that changing an allowance with this method brings the risk that someone may use both the old
     * and the new allowance by unfortunate transaction ordering. One possible solution to mitigate this
     * race condition is to first reduce the spender's allowance to 0 and set the desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     * @param _spender The address which will spend the funds.
     * @param _value The amount of tokens to be spent.
     */
    function approve(address _spender, uint256 _value) public returns (bool) {
        require(_spender != address(0));
        require(msg.sender ==  owner());
        _allowed[period.height()][msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
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

    /**
     * @dev Internal function that burns an amount of the token of a given
     * account.
     * @param _account The account whose tokens will be burnt.
     * @param _value The amount that will be burnt.
     */
    function _burn(address _account, uint256 _value) internal {
        require(_account != address(0));

        _totalSupply[period.height()] = _totalSupply[period.height()].sub(_value);
        _balances[period.height()][_account] = _balances[period.height()][_account].sub(_value);
        emit Transfer(_account, address(0), _value);
    }

    /**
     * @dev Internal function that burns an amount of the token of a given
     * account, deducting from the sender's allowance for said account. Uses the
     * internal burn function.
     * @param _account The account whose tokens will be burnt.
     * @param _value The amount that will be burnt.
     */
    function _burnFrom(address _account, uint256 _value) internal {
        _allowed[period.height()][_account][msg.sender] = _allowed[period.height()][_account][msg.sender].sub(_value);
        _burn(_account, _value);

    }
}