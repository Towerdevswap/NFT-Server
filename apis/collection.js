require('dotenv').config();
const { default: axios } = require('axios');
const router = require('express').Router();

const ethers = require('ethers');

const mongoose = require('mongoose');
const Collection = mongoose.model('Collection');
const Category = mongoose.model('Category');
const ERC1155CONTRACT = mongoose.model('ERC1155CONTRACT');
const ERC721CONTRACT = mongoose.model('ERC721CONTRACT');
const ERC1155HOLDING = mongoose.model('ERC1155HOLDING');
const NFTAttribute = mongoose.model('NFTAttribute');
const NFTItem = mongoose.model('NFTITEM');
const auth = require('./middleware/auth');
const admin_auth = require('./middleware/auth.admin');
const toLowerCase = require('../utils/utils');
const isValidERC1155 = require('../utils/1155_validator');
const isvalidERC721 = require('../utils/721_validator');
const extractAddress = require('../services/address.utils');
const applicationMailer = require('../mailer/reviewMailer');
const FactoryUtils = require('../services/factory.utils');
const validateSignature = require('../apis/middleware/auth.sign');

const MarketplaceContractABI = require('../constants/marketplaceabi');
const MarketplaceContractAddress = process.env.MARKETPLACE_ADDRESS;

const ftmScanApiKey = process.env.FTM_SCAN_API_KEY;

const Logger = require('../services/logger');
const { getSymbol } = require('../services/price.feed');
// to sign txs
const provider = new ethers.providers.JsonRpcProvider(
  process.env.NETWORK_RPC,
  parseInt(process.env.NETWORK_CHAINID)
);
const ownerWallet = new ethers.Wallet(process.env.ROYALTY_PK, provider);

const marketplaceSC = new ethers.Contract(
  MarketplaceContractAddress,
  MarketplaceContractABI,
  ownerWallet
);


router.post('/collectiondetails', auth, async (req, res) => {
  let erc721Address = req.body.erc721Address;
  erc721Address = toLowerCase(erc721Address);

  let owner = extractAddress(req, res);
  let signature = req.body.signature;
  let retrievedAddr = req.body.signatureAddress;

  if (!ethers.utils.isAddress(erc721Address))
    return res.json({
      status: 'failed',
      data: 'NFT Contract Address invalid'
    });

  let isValidsignature = await validateSignature(
    owner,
    signature,
    retrievedAddr
  );
  if (!isValidsignature)
    return res.status(400).json({
      status: 'failed',
      data: 'Invalid signature from user'
    });

  // validate to see whether the contract is either 721 or 1155, otherwise, reject

  try {
    let is721 = await isvalidERC721(erc721Address);
    if (!is721) {
      let is1155 = await isValidERC1155(erc721Address);
      if (!is1155)
        return res.status(400).json({
          status: 'failed',
          data: 'Invalid NFT Collection Address'
        });
    }
  } catch (error) {
    Logger.error(error);
    return res.status(400).json({
      status: 'failed',
      data: ''
    });
  }

  let collectionName = req.body.collectionName;
  let description = req.body.description;
  let categories = req.body.categories;
  categories = categories.split(',');
  let logoImageHash = req.body.logoImageHash;
  let siteUrl = req.body.siteUrl;
  let discord = req.body.discord;
  let twitterHandle = req.body.twitterHandle;
  let mediumHandle = req.body.mediumHandle;
  let telegram = req.body.telegram;
  let instagram = req.body.instagramHandle;
  let email = req.body.email;
  let attribute_template = req.body.attribute_template;

  let feeRecipient = req.body.feeRecipient
    ? toLowerCase(req.body.feeRecipient)
    : '';
  let royalty = req.body.royalty ? parseFloat(req.body.royalty) : 0;

  let collection = await Collection.findOne({ erc721Address: erc721Address });
  // verify if 1155 smart contracts
  let is1155 = await isValidERC1155(erc721Address);

  let isInternal = await FactoryUtils.isInternalCollection(
    erc721Address,
    !is1155
  );
  // this is for editing a collection
  if (collection) {
    // disable modifying an existing collection
    return res.json({
      status: 'failed',
      data: 'NFT Contract Address already exists'
    });

    //collection.erc721Address = erc721Address;
    //collection.collectionName = collectionName;
    //collection.description = description;
    //collection.categories = categories;
    //collection.logoImageHash = logoImageHash;
    //collection.siteUrl = siteUrl;
    //collection.discord = discord;
    //collection.twitterHandle = twitterHandle;
    //collection.mediumHandle = mediumHandle;
    //collection.telegram = telegram;
    //collection.instagramHandle = instagram;
    //collection.email = email;
    //collection.feeRecipient = feeRecipient;
    //collection.royalty = royalty;

    //let _collection = await collection.save();
    //if (_collection)
    //  return res.send({
    //    status: "success",
    //    data: _collection.toJson(),
    //  });
    //else
    //  return res.send({
    //    status: "failed",
    // });
  } else {
    /* this is for new collection review */
    if (is1155) {
      // need to add a new 1155 collection
      let sc_1155 = new ERC1155CONTRACT();
      sc_1155.address = erc721Address;
      sc_1155.name = collectionName;
      let symbol = await getSymbol(erc721Address);
      Logger.debug('symbol is', symbol);
      sc_1155.symbol = symbol || 'Symbol';
      sc_1155.isVerified = true;
      sc_1155.isAppropriate = true;
      await sc_1155.save();
      // save new category
      let category = new Category();
      category.minterAddress = erc721Address;
      category.type = 1155;
      await category.save();
    } else {
      // check existing deployed ERC721 contract //
      let ifExists = await ERC721CONTRACT.findOne({
        address: erc721Address
      });
      // Existed Contract //
      if (!ifExists) {
        let sc_721 = new ERC721CONTRACT();
        sc_721.address = erc721Address;
        sc_721.name = collectionName;
        let symbol = await getSymbol(erc721Address);
        sc_721.symbol = symbol || 'Symbol';
        sc_721.isVerified = true;
        sc_721.isAppropriate = true;
        await sc_721.save();
      }


      // Category checking ... //
      let categoryExists = await Category.findOne({
        minterAddress: erc721Address
      });

      if (!categoryExists) {
        let category = new Category();
        category.minterAddress = erc721Address;
        category.type = 721;
        await category.save();
      } else {
        return res.json({
          status: 'failed',
          data: 'Category minter address already exists!'
        });
      }
    }
    // add a new collection
    let _collection = new Collection();
    _collection.erc721Address = erc721Address;
    _collection.owner = owner;
    _collection.collectionName = collectionName;
    _collection.description = description;
    _collection.attribute_template = attribute_template;
    _collection.categories = categories;
    _collection.logoImageHash = logoImageHash;
    _collection.siteUrl = siteUrl;
    _collection.discord = discord;
    _collection.twitterHandle = twitterHandle;
    _collection.mediumHandle = mediumHandle;
    _collection.telegram = telegram;
    _collection.instagramHandle = instagram;

    _collection.isInternal = isInternal[0];
    if (isInternal[0]) {
      _collection.isOwnerble = isInternal[1];
      _collection.status = true;
    } else _collection.status = false;
    _collection.email = email;
    _collection.feeRecipient = feeRecipient;
    _collection.royalty = royalty;
    _collection.signature = signature;
    _collection.signatureAddress = retrievedAddr;

    let newCollection = await _collection.save();
    if (newCollection) {
      // notify admin about a new External contract
      if (!isInternal[0]) {
        applicationMailer.notifyAdminForNewCollectionApplication(); //notify admin
        applicationMailer.notifyInternalCollectionDeployment(
          erc721Address,
          email
        ); // notify register
      }
      return res.send({
        status: 'success',
        data: newCollection.toJson()
      });
    } else
      return res.send({
        status: 'failed'
      });
  }
});

router.post('/getMintableCollections', auth, async (req, res) => {
  try {
    let address = extractAddress(req, res);
    let internalCollections = await Collection.find({
      isInternal: true,
      isOwnerble: false,
      isAppropriate: true
    });
    let myCollections = await Collection.find({
      owner: address,
      isInternal: true,
      isOwnerble: true,
      isAppropriate: true
    });
    let collections = [...internalCollections, ...myCollections];
    let tokenTypeMap = new Map();
    let promise = collections.map(async (collection) => {
      let category = await Category.findOne({
        minterAddress: toLowerCase(collection.erc721Address)
      });

      if (category) {
        tokenTypeMap.set(collection.erc721Address, category.type);
      }
    });
    await Promise.all(promise);
    let data = collections.map((collection) => ({
      collectionName: collection.collectionName,
      erc721Address: collection.erc721Address,
      logoImageHash: collection.logoImageHash,
      attribute_template: collection.attribute_template,
      type: tokenTypeMap.get(collection.erc721Address)
    }));
    return res.json({
      status: 'success',
      data: data
    });
  } catch (error) {
    Logger.error(error);
    return res.json({
      status: 'failed'
    });
  }
});

router.post('/getReviewApplications', admin_auth, async (req, res) => {
  try {
    let applications = await Collection.find({ status: false });
    return res.json({
      status: 'success',
      data: applications
    });
  } catch (error) {
    Logger.error(error);
    return res.json({
      status: 'failed'
    });
  }
});

// need to update the smart contract with royalty

router.post('/reviewApplication', admin_auth, async (req, res) => {
  try {
    let contractAddress = toLowerCase(req.body.contractAddress);
    if (!ethers.utils.isAddress(contractAddress))
      return res.json({
        status: 'failed',
        data: 'NFT Contract Address invalid'
      });
    let status = parseInt(req.body.status);
    let collection = await Collection.findOne({
      erc721Address: contractAddress
    });
    if (!collection)
      return res.json({
        status: 'failed'
      });

    let email = collection.email;
    if (status == 0) {
      // deny -- remove from collection and send email
      let reason = req.body.reason;
      await collection.remove();
      // send deny email
      applicationMailer.sendApplicationDenyEmail({
        to: email,
        subject: 'Collection Registration Failed!',
        reason: `${reason}`
      });
      return res.json({
        status: 'success'
      });
    } else if (status == 1) {
      // update smart contract for royalty
      let feeRecipient = toLowerCase(collection.feeRecipient);
      let royalty = parseInt(collection.royalty * 100);
      let creator = collection.owner;

      // validate fee receipient to be a valid erc20 address
      if (!ethers.utils.isAddress(feeRecipient)) {
        // deny -- remove from collection and send email
        let reason = 'Fee recipient Address Invalid.';
        await collection.remove();
        // send deny email
        applicationMailer.sendApplicationDenyEmail({
          to: email,
          subject: 'Collection Registration Failed!',
          reason: `${reason}`
        });
        return res.json({
          status: 'success'
        });
      }
      // validate royalty to range in o to 100
      if (royalty > 10000 || royalty < 0) {
        // deny -- remove from collection and send email
        let reason = 'Royalty should be in range of 0 to 100';
        await collection.remove();
        // send deny email
        applicationMailer.sendApplicationDenyEmail({
          to: email,
          subject: 'Collection Registration Failed!',
          reason: `${reason}`
        });
        return res.json({
          status: 'success'
        });
      }

      try {
        // now update the collection fee
        await marketplaceSC.registerCollectionRoyalty(
          contractAddress,
          creator,
          royalty,
          feeRecipient,
          { gasLimit: 60000000 }
        );
      } catch (error) {
        Logger.debug('error in setting collection royalty');
        Logger.error(error);
        return res.json({
          status: 'failed'
        });
      }
      // approve -- udpate collection and send email
      collection.status = true;
      await collection.save();
      // now update isAppropriate
      try {
        await ERC721CONTRACT.updateOne(
          {
            address: contractAddress
          },
          { isAppropriate: true }
        );
      } catch (error) { }
      try {
        await ERC1155CONTRACT.updateOne(
          {
            address: contractAddress
          },
          { isAppropriate: true }
        );
      } catch (error) { }
      // send email
      applicationMailer.sendApplicationReviewedEmail({
        to: email,
        subject: 'Collection Registerd Successfully!'
      });
      return res.json({
        status: 'success'
      });
    } else {
      return res.json({
        status: 'failed'
      });
    }
  } catch (error) {
    Logger.error(error);
    return res.json({
      status: 'failed'
    });
  }
});

router.post('/searchCollection', auth, async (req, res) => {
  let erc721Address = req.body.erc721Address;
  if (!ethers.utils.isAddress(erc721Address))
    return res.json({
      status: 'failed',
      data: 'NFT Contract Address Invalid'
    });
  erc721Address = toLowerCase(erc721Address);
  let collection = await Collection.findOne({
    erc721Address: erc721Address,
    isAppropriate: true
  });
  if (collection)
    return res.send({
      status: 'success',
      data: collection.toJson()
    });
  else
    return res.send({
      status: 'failed'
    });
});

router.get('/fetchAllCollections', auth, async (req, res) => {
  let all = await Collection.find({ isAppropriate: true }).sort({
    collectionName: 1
  });
  return res.json({
    status: 'success',
    data: all
  });
});


router.post('/getCollectionStatistic', async (req, res) => {
  let address = toLowerCase(req.body.contractAddress);
  if (!ethers.utils.isAddress(address))
    return res.json({
      status: 'failed',
      data: 'NFT Contract Address Invalid'
    });


  const NFTITEM = mongoose.model('NFTITEM');
  // Count NFT //
  let countNFT = await NFTITEM.countDocuments({ contractAddress: address })
  // Count Owner //
  let countOwner = await NFTITEM.aggregate([
    {
      $match: { contractAddress: address }
    },
    {
      $group: {
        _id: "$owner", count: { $sum: 1 }
      },
    },
    {
      $facet: { totalCount: [{ $count: 'ownerCount' }] }
    }
  ]);
  if (countOwner.length > 0 && countOwner[0].totalCount[0]?.ownerCount) {
    countOwner = countOwner[0].totalCount[0].ownerCount;
  }
  else {
    countOwner = 0;
  }

  // Count Owner from 1155 //
  //let countOwner1155 = await ERC1155HOLDING.countDocuments({ contractAddress: address });
  let countOwner1155 = await ERC1155HOLDING.aggregate([{ $match: { contractAddress: address } }, { "$group": { _id: "$holderAddress" } }])
  if (countOwner1155.length > 0) {
    countOwner = countOwner1155.length;
  }


  // Floor Price //
  let floorPriceNFT = await NFTITEM.find({ contractAddress: address, priceInUSD: { $gt: 0 }, listedAt: {$gte:  new Date(new Date().setDate(new Date().getDate() - 150))} }).sort({ priceInUSD: 1 }).limit(1)
  //console.log(floorPriceNFT[0].priceInUSD);
  let floorPrice = 0;
  if (floorPriceNFT.length > 0) {
    floorPrice = floorPriceNFT[0].priceInUSD;
  }

  // Vol traded //
  //db.tradehistories.aggregate([{$match:{collectionAddress:"0x35b0b5c350b62ddee9be102b7567c4dabe52cf4f"}},{$group:{_id:null,sum: {$sum:"$priceInUSD"}}}])
  const TradeHistory = mongoose.model('TradeHistory');

  let volumeTradedAuction = await TradeHistory.find({
    collectionAddress: address,
    isAuction: true,
  });
  let volumeTradedSold = await TradeHistory.aggregate([
    {
      $match: { collectionAddress: address, isAuction: false }
    },
    {
      $group: {
        _id: null, sum: { $sum: "$priceInUSD" }
      },
    }
  ]);
  let voltraded = 0;
  if (volumeTradedAuction.length > 0) {

    volumeTradedAuction.map(item => {
      voltraded += item.priceInUSD * item.price;
    });
  }
  if (volumeTradedSold.length > 0) {
    voltraded += volumeTradedSold[0].sum;
  }

  //console.log(volumeTraded);

  //console.log(countOwner[0].totalCount[0].ownerCount);
  return res.json({
    status: 'success',
    data: {
      countNFT: countNFT,
      countOwner: countOwner,
      floorPrice: floorPrice,
      volumeTraded: voltraded
    }
  });
});

router.post('/getCollectionInfo', async (req, res) => {
  let address = toLowerCase(req.body.contractAddress);
  if (!ethers.utils.isAddress(address))
    return res.json({
      status: 'failed',
      data: 'NFT Contract Address Invalid'
    });
  let collection = await Collection.findOne({ erc721Address: address });
  if (collection)
    return res.json({
      status: 'success',
      data: { ...minifyCollection(collection) }//, isVerified: true }
    });

  collection = await ERC721CONTRACT.findOne({
    address: address
  });
  if (collection)
    return res.json({
      status: 'success',
      data: minifyCollection(collection)
    });
  collection = await ERC1155CONTRACT.findOne({
    address: address
  });
  if (collection)
    return res.json({
      status: 'success',
      data: minifyCollection(collection)
    });
});

router.post('/isValidated', auth, async (req, res) => {
  try {
    let erc721Address = req.body.erc721Address;
    if (!ethers.utils.isAddress(erc721Address))
      return res.json({
        status: 'failed',
        data: 'NFT Contract Address Invalid'
      });
    erc721Address = toLowerCase(erc721Address);
    let request = `https://api.ftmscan.com/api?module=contract&action=getsourcecode&address=${erc721Address}&apikey=${ftmScanApiKey}`;
    let response = await axios.get(request);
    if (
      response.status != '1' ||
      response.result.ABI == 'Contract source code not verified'
    )
      return res.json({
        status: 'success',
        isValidated: 'no'
      });
    return res.json({
      status: 'success',
      isValidated: 'yes'
    });
  } catch (error) {
    return res.json({
      status: 'failed'
    });
  }
});

router.get("/:contractAddress/:tokenID/updateAttributes", auth, async (req, res) => {

  const randomIpfsEndpoint = (tokenURI) => {

    if (!['ipfs://', '/ipfs/'].some(x => tokenURI.includes(x)))
      return tokenURI;

    const endpoints = [
      'openzoo',
      'openzoo2',
      'openzoo3'
    ];

    const endpoint = `https://${endpoints[Math.floor(Math.random() * endpoints.length)]}.mypinata.cloud/ipfs/`;
    const path = tokenURI.split(tokenURI.includes('ipfs://') ? 'ipfs://' : '/ipfs/')[1];
    return `${endpoint}${path}`;
  }

  let attribute = null;

  try {
    const { contractAddress, tokenID } = req.params;
    const { _id, tokenURI } = await NFTItem.findOne({ contractAddress, tokenID }).exec();
    const { attributes, ...ipfsRecord } = await axios.get(randomIpfsEndpoint(tokenURI)).then(response => response.data);

    attribute = await NFTAttribute.findOne({ contractAddress, tokenID }).exec();
    attribute = attribute ?? new NFTAttribute({
      contractAddress,
      tokenID,
      tokenURI,
      _nftItemId: _id,
    });

    await attribute.set({
      attributes,
      ipfsRecord,
      updatedAt: Date.now(),
      isRemoteHasAttributes: !!attributes,
    })
      .save();

    return res.sendStatus(200);
  } catch (error) {
    if (attribute) {
      await attribute.set({
        errorCode: error?.response?.status ?? 1,
        errorMessage: JSON.stringify(error.stack),
        updatedAt: Date.now()
      }).save();
    }

    return res.sendStatus(500);
  }
});

router.get("/:contractAddress/attributeFilter", auth, async (req, res) => {
  try {
    const { contractAddress } = req.params;
    const attributes = await NFTAttribute.aggregate([
      { $match: { contractAddress } },
      {
        $project: { "attributes.trait_type": 1, "attributes.value": 1, _id: 0 },
      },
      { $unwind: "$attributes" },
      {
        $group: {
          _id: {
            trait_type: "$attributes.trait_type",
            value: "$attributes.value",
          },
          count: { $count: {} },
        },
      },
      { $sort: { "_id.value": 1 } },
      {
        $group: {
          _id: "$_id.trait_type",
          value: {
            $push: { value: "$_id.value", count: "$count" },
          },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 1,
          isNumeric: {
            $cond: {
              if: { $isNumber: { $first: "$value.value" } },
              then: true,
              else: false,
            },
          },
          value: {
            $cond: {
              if: { $isNumber: { $first: "$value.value" } },
              then: {
                min: { $min: "$value.value" },
                max: { $max: "$value.value" },
              },
              else: "$value",
            },
          },
        },
      },
    ]);

    return res.json({
      status: "success",
      data: attributes,
    });
  } catch (error) {
    return res.json({
      status: "failed",
    });
  }
});

router.get("/:contractAddress/attributeFilter/exists", auth, async (req, res) => {
  try {
    const { contractAddress } = req.params;
    const exists = await NFTAttribute.find({ contractAddress }).limit(1).count(true);
    return res.sendStatus(exists ? 200 : 404);
  } catch (error) {
    return res.sendStatus(500);
  }
});

router.post("/update", async function (req, res) {
  const collection = req.body.collection;
  try {
    let owner = extractAddress(req, res);
    let signature = req.body.signature;
    let retrievedAddr = req.body.signatureAddress;

    if (!ethers.utils.isAddress(collection.erc721Address))
      return res.json({
        status: 'failed',
        data: 'NFT Contract Address invalid'
      });

    let isValidsignature = await validateSignature(
      owner,
      signature,
      retrievedAddr
    );
    if (!isValidsignature)
      return res.status(400).json({
        status: 'failed',
        data: 'Invalid signature from user'
      });

    const exists = await Collection.exists({ erc721Address: collection.erc721Address });
    if (!exists) {
      return res.sendStatus(404);
    }

    const values = {
      description: collection.description,
      siteUrl: collection.siteUrl,
      twitterHandle: collection.twitterHandle,
      discord: collection.discord,
      instagramHandle: collection.instagramHandle,
      mediumHandle: collection.mediumHandle,
      telegram: collection.telegram,
      logoImageHash: collection.logoImageHash,
      categories: collection.categories,
    };

    const result = await Collection.findOneAndUpdate({ erc721Address: collection.erc721Address }, { $set: values });
    return res.sendStatus(!!result ? 200 : 500);
  } catch (err) {
    return res.sendStatus(500);
  }
});


const minifyCollection = (collection) => {
  return {
    ...(collection.address ? { address: collection.address } : {}),
    ...(collection.isVerified
      ? { isVerified: collection.isVerified }
      : { isVerified: false }),
    ...(collection.name ? { name: collection.name } : {}),
    ...(collection.symbol ? { symbol: collection.symbol } : {}),

    ...(collection.categories ? { categories: collection.categories } : {}),
    ...(collection.collectionName
      ? { collectionName: collection.collectionName }
      : {}),
    ...(collection.description ? { description: collection.description } : {}),
    ...(collection.discord ? { discord: collection.discord } : {}),
    ...(collection.email ? { email: collection.email } : {}),
    ...(collection.erc721Address
      ? { erc721Address: collection.erc721Address }
      : {}),
    ...(collection.isInternal ? { isInternal: collection.isInternal } : {}),
    ...(collection.isOwnerble ? { isOwnerble: collection.isOwnerble } : {}),
    ...(collection.logoImageHash
      ? { logoImageHash: collection.logoImageHash }
      : {}),
    ...(collection.mediumHandle
      ? { mediumHandle: collection.mediumHandle }
      : {}),
    ...(collection.owner ? { owner: collection.owner } : {}),
    ...(collection.siteUrl ? { siteUrl: collection.siteUrl } : {}),
    ...(collection.status ? { status: collection.status } : {}),
    ...(collection.telegram ? { telegram: collection.telegram } : {}),
    ...(collection.twitterHandle
      ? { twitterHandle: collection.twitterHandle }
      : {}),
    ...(collection.instagramHandle
      ? { instagramHandle: collection.instagramHandle }
      : {}),
    isInternal: collection.isInternal,
    isOwnerble: collection.isOwnerble,
    isAppropriate: collection.isAppropriate
  };
};

const updateMarketplaceRoyalty = async (collection, receipient, fee) => {
  fee = fee * 100;
};

const updateAuctionRoyalty = async (collection, receipient, fee) => {
  fee = fee * 100;
};

module.exports = router;
