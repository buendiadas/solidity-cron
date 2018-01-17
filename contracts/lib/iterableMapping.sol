pragma solidity 0.4.18;


/**
 * @dev address -> bool mapping where it is possible to iterate over all keys.
 * insipred by https://github.com/ethereum/dapp-bin/blob/master/library/iterable_mapping.sol
 */
library IterableMapping {
    struct Itmap {
        mapping(address => IndexValue) data;
        KeyFlag[] keys;
        uint size;
    }

    struct IndexValue { uint keyIndex; bool value; }
    struct KeyFlag { address key; bool deleted; }

    function insert(Itmap storage self, address key, bool value) public returns (bool replaced) {
        uint keyIndex = self.data[key].keyIndex;
        self.data[key].value = value;
        if (keyIndex > 0)
            return true;
        else {
            keyIndex = self.keys.length++;
            self.data[key].keyIndex = keyIndex + 1;
            self.keys[keyIndex].key = key;
            self.size++;
            return false;
        }
    }

    function remove(Itmap storage self, address key) public returns (bool success) {
        uint keyIndex = self.data[key].keyIndex;
        if (keyIndex == 0)
            return false;
        delete self.data[key];
        self.keys[keyIndex - 1].deleted = true;
        self.size--;
    }

    function contains(Itmap storage self, address key) public constant returns (bool) {
        return self.data[key].keyIndex > 0;
    }

    function iterateStart(Itmap storage self) public constant returns (uint keyIndex) {
        return iterateNext(self, uint(-1));
    }

    function iterateValid(Itmap storage self, uint keyIndex) public constant returns (bool) {
        return keyIndex < self.keys.length;
    }

    function iterateNext(Itmap storage self, uint keyIndex) public constant returns (uint _keyIndex) {
        keyIndex++;
        while (keyIndex < self.keys.length && self.keys[keyIndex].deleted)
            keyIndex++;
        return keyIndex;
    }

    function iterateGet(Itmap storage self, uint keyIndex) public constant returns (address key, bool value) {
        key = self.keys[keyIndex].key;
        value = self.data[key].value;
    }
}



// How to use it:
contract User
{
  // Just a struct holding our data.
  IterableMapping.Itmap data;
  // Insert something
  function insert(uint k, uint v) returns (uint size)
  {
    // Actually calls itmap_impl.insert, auto-supplying the first parameter for us.
    IterableMapping.insert(data, k, v);
    // We can still access members of the struct - but we should take care not to mess with them.
    return data.size;
  }
  // Computes the sum of all stored data.
  function sum() returns (uint s)
  {
    for (var i = IterableMapping.iterateStart(data); IterableMapping.iterateValid(data, i); i = IterableMapping.iterateNext(data, i))
    {
        var (key, value) = IterableMapping.iterateGet(data, i);
        s += value;
    }
  }
}
