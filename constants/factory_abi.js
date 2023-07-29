const CollectionFactoryContract = {
  MAINNET_721_PRIVATE: '0xDA1fB6597714bac00a8Db98Bd2CBFde122A4a3a4', //FantomNFTFactoryPrivate
  MAINNET_721_PUBLIC: '0xa9091494aEDA8Bd0B505D5f3a77B3f74c5c0b903', //FantomNFTFactory
  TESTNET_721_PRIVATE: '0xB628A26232F5E24B771D268C8680877DA9e8D209', //FantomNFTFactoryPrivate
  TESTNET_721_PUBLIC: '0x94e75dD5194b4Cd800fF8DB232dE2500ee3E785f', //FantomNFTFactory
  MAINNET_1155_PRIVATE: '0xDA1fB6597714bac00a8Db98Bd2CBFde122A4a3a4', //FantomNFTFactoryPrivate
  MAINNET_1155_PUBLIC: '0xa9091494aEDA8Bd0B505D5f3a77B3f74c5c0b903', //FantomNFTFactory
  TESTNET_1155_PRIVATE: '0xCaa6ff4Db9a762dcdc725D69DD5d9B392A66d933', //FantomArtFactoryPrivate
  TESTNET_1155_PUBLIC: '0x01C619F89247284268DA8837ffEE8fBb5a78eA22', //FantomArtFactory
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
