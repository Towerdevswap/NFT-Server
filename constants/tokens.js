const DISABLED_PAYTOKENS = process.env.NETWORK_CHAINID === "5001" ? [
    {
      address: '0x0000000000000000000000000000000000000000',
      name: 'Mantle',
      symbol: 'MNT',
      decimals: 18,
    }
  ] :
  [
    {
      address: '0x0000000000000000000000000000000000000000',
      name: 'Mantle',
      symbol: 'MNT',
      decimals: 18,
    }
  ]


const PAYTOKENS = process.env.NETWORK_CHAINID === "5001" ? [
    {
      address: '0x1eA7a2Dc8500ea292483ef6c775787851B019d82',
      name: 'LOTTO',
      symbol: 'LTO',
      decimals: 18,
    }
  ] :
  [
    {
      address: '0x2C6db4f138A1336dB50Ab698cA70Cf99a37e1198',
      name: 'Wrapped Mantle',
      symbol: 'WMNT',
      decimals: 18,
    },
    {
      address: '0x1eA7a2Dc8500ea292483ef6c775787851B019d82',
      name: 'LOTTO',
      symbol: 'LTO',
      decimals: 18,
    },
    // {
    //   address: '0x830053DABd78b4ef0aB0FeC936f8a1135B68da6f',
    //   name: 'WASP',
    //   symbol: 'WASP',
    //   decimals: 18,
    // },
    // {
    //   address: '0x3D5950287b45F361774E5fB6e50d70eEA06Bc167',
    //   name: 'wanUSDT',
    //   symbol: 'wanUSDT',
    //   decimals: 6,
    // },
    // {
    //   address: '0x7fF465746e4F47e1CbBb80c864CD7DE9F13337fE',
    //   name: 'wanUSDC',
    //   symbol: 'wanUSDC',
    //   decimals: 6,
    // },
    // {
    //   address: '0x48344649B9611a891987b2Db33fAada3AC1d05eC',
    //   name: 'wanETH',
    //   symbol: 'wanETH',
    //   decimals: 18,
    // },
  ]

module.exports = { PAYTOKENS, DISABLED_PAYTOKENS };
