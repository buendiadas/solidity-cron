pragma solidity 0.4.19;

import "../lib/Standard20Token.sol";
import "../lib/Owned.sol";

/**
* Generic Registry, used for Candidates and Voters
*
**/


contract Registry{

  mapping (bytes32 => bool) public isWhitelisted;
  uint256 maxNumListings;


  /**
  *@dev Allows a user to start an application. Takes tokens from user and sets apply stage end time.
  *@param _listingHash The hash of a potential listing a user is applying to add to the registry
  *@param _amount The number of ERC20 tokens a user is willing to potentially stake
  @param _data   Extra data relevant to the application. Think IPFS hashes.
  */

  function apply(bytes32 _listingHash, uint _amount, string _data) external {
      require(!isWhitelisted(_listingHash));
      require(!appWasMade(_listingHash));
      require(_amount >= parameterizer.get("minDeposit"));

      // Sets owner
      Listing storage listing = listings[_listingHash];
      listing.owner = msg.sender;

      // Transfers tokens from user to Registry contract
      require(token.transferFrom(listing.owner, this, _amount));

      // Sets apply stage end time
      listing.applicationExpiry = block.timestamp + parameterizer.get("applyStageLen");
      listing.unstakedDeposit = _amount;

      _Application(_listingHash, _amount, _data);
  }


  function whiteList(bytes32 listingHash) public{
      require(msg.sender==owner);
      isWhitelisted(listingHash)=true;

  }

  /**
  *@dev Allows a user to start an application. Takes tokens from user and sets apply stage end time.
  *@param _listingHash The hash of a potential listing a user is applying to add to the registry
  *@param _amount The number of ERC20 tokens a user is willing to potentially stake
  @param _data   Extra data relevant to the application. Think IPFS hashes.
  */
  function remove(bytes32 _listingHash, uint _amount, string _data) external {
      require(!isWhitelisted(_listingHash));
      require(!appWasMade(_listingHash));
      require(_amount >= parameterizer.get("minDeposit"));

      // Sets owner
      Listing storage listing = listings[_listingHash];
      listing.owner = msg.sender;

      // Transfers tokens from user to Registry contract
      require(token.transferFrom(listing.owner, this, _amount));

      // Sets apply stage end time
      listing.applicationExpiry = block.timestamp + parameterizer.get("applyStageLen");
      listing.unstakedDeposit = _amount;

      _Application(_listingHash, _amount, _data);
  }



}
