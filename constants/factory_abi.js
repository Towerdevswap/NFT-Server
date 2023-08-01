const CollectionFactoryContract = {
  MAINNET_721_PRIVATE: '0xfa86e08b354e85325248275C9BE65022cB3ffa09', //FantomNFTFactoryPrivate
  MAINNET_721_PUBLIC: '0x5c8368097Ffe1C0B63954f5826C5270557e204C4', //FantomNFTFactory
  TESTNET_721_PRIVATE: '0xfa86e08b354e85325248275C9BE65022cB3ffa09', //FantomNFTFactoryPrivate
  TESTNET_721_PUBLIC: '0x5c8368097Ffe1C0B63954f5826C5270557e204C4', //FantomNFTFactory
  MAINNET_1155_PRIVATE: '0x4c9956e24CC0F720D44D4F6482f803e26c2E4537', //FantomNFTFactoryPrivate
  MAINNET_1155_PUBLIC: '0x59cf5dACe811646fa0d0b97acd714b1BA55E622d', //FantomNFTFactory
  TESTNET_1155_PRIVATE: '0x4c9956e24CC0F720D44D4F6482f803e26c2E4537', //FantomArtFactoryPrivate
  TESTNET_1155_PUBLIC: '0x59cf5dACe811646fa0d0b97acd714b1BA55E622d', //FantomArtFactory
  ABI: [
    {
      inputs: [{ internalType: 'address', name: '', type: 'address' }],
      name: 'exists',
      outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
      stateMutability: 'view',
      type: 'function'
    }
  ]
};

module.exports = CollectionFactoryContract;
