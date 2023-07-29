require("dotenv").config();
const fs = require("fs");
const formidable = require("formidable");
const router = require("express").Router();
const validUrl = require("valid-url");

const mongoose = require("mongoose");
const Bundle = mongoose.model("Bundle");
const Account = mongoose.model("Account");

const Logger = require("../services/logger");
const auth = require("./middleware/auth");

const pinataSDK = require("@pinata/sdk");

const axios = require('axios');
const sleep = require('ko-sleep');

const toLowerCase = require("../utils/utils");

const extractAddress = require("../services/address.utils");
const service_auth = require("./middleware/auth.tracker");

// const ipfsUris = ["https://artion.mypinata.cloud/ipfs/", "https://artion1.mypinata.cloud/ipfs/", "https://artion2.mypinata.cloud/ipfs/", "https://artion3.mypinata.cloud/ipfs/", "https://artion4.mypinata.cloud/ipfs/", "https://artion5.mypinata.cloud/ipfs/", "https://artion6.mypinata.cloud/ipfs/", "https://artion7.mypinata.cloud/ipfs/", "https://artion8.mypinata.cloud/ipfs/", "https://artion9.mypinata.cloud/ipfs/", "https://artion10.mypinata.cloud/ipfs/", "https://artion11.mypinata.cloud/ipfs/", "https://artion12.mypinata.cloud/ipfs/", "https://artion13.mypinata.cloud/ipfs/"];
const ipfsUris = ["https://blush-rare-tiglon-705.mypinata.cloud/ipfs/", "https://blush-rare-tiglon-705.mypinata.cloud/ipfs/"];
const uploadPath = process.env.UPLOAD_PATH;
const pinata = pinataSDK(
  process.env.PINATA_API_KEY,
  process.env.PINATA_SECRET_API_KEY
);

const checkResult = async (func) => {
  let times = 0;
  while(times < 100) {
    const ipfsUri = ipfsUris[Math.floor(Math.random() * ipfsUris.length)];
    try {
      console.log('upload to ipfs...');
      let ret = await func();
      let ipfsData = ipfsUri + ret.IpfsHash;
      console.log('verify ipfs', ipfsData);
      let test = await axios.get(ipfsData);
      if (test.data === '') {
        console.log('verify ipfs failed', ipfsData);
        throw new Error("verify ipfs failed, retry after 5s");
      } else {
        return ret;
      }
    } catch (error) {
      console.log(error);
      times++;
      await sleep(5000);
    }
  }
}

// pin image file for NFT creation
const pinFileToIPFS = async (
  fileName,
  address,
  name,
  symbol,
  royalty,
  xtraUrl
) => {
  const options = {
    pinataMetadata: {
      name: name,
      keyvalues: {
        symbol: symbol,
        royalty: royalty,
        IP_Rights: xtraUrl,
        recipient: address,
      },
    },
    pinataOptions: {
      cidVersion: 0,
      wrapWithDirectory: true
    },
  };
  const readableStreamForFile = fs.createReadStream(uploadPath + fileName);

  try {
    return await checkResult(async () => {
      let result = await pinata.pinFileToIPFS(readableStreamForFile, options);
      return result;
    })
  } catch (error) {
    Logger.error(error);
    return "failed to pin file to ipfs";
  }
};

// pin image for bundle
const pinBundleFileToIPFS = async (fileName, name, address) => {
  const options = {
    pinataMetadata: {
      name: name,
      keyvalues: {
        bundleName: name,
        address: address,
      },
    },
    pinataOptions: {
      cidVersion: 0,
    },
  };
  const readableStreamForFile = fs.createReadStream(uploadPath + fileName);

  try {
    return await checkResult(async () => {
      let result = await pinata.pinFileToIPFS(readableStreamForFile, options);
      return result;
    });
  } catch (error) {
    return "failed to pin file to ipfs";
  }
};

// pin banner image
const pinBannerFileToIPFS = async (fileName, address) => {
  const options = {
    pinataMetadata: {
      name: address,
      keyvalues: {},
    },
    pinataOptions: {
      cidVersion: 0,
    },
  };
  const readableStreamForFile = fs.createReadStream(uploadPath + fileName);

  try {
    return await checkResult(async () => {
      let result = await pinata.pinFileToIPFS(readableStreamForFile, options);
      return result;
    });
  } catch (error) {
    Logger.error(error);
    return "failed to pin file to ipfs";
  }
};

// pin media image
const pinMediaFileToIPFS = async (fileName, address) => {
  const options = {
    pinataMetadata: {
      name: address,
      keyvalues: {},
    },
    pinataOptions: {
      cidVersion: 0,
      wrapWithDirectory: true
    },
  };
  const readableStreamForFile = fs.createReadStream(uploadPath + fileName);

  try {
    return await checkResult(async () => {
      let result = await pinata.pinFileToIPFS(readableStreamForFile, options);
      return result;
    });
  } catch (error) {
    Logger.error(error);
    return "failed to pin file to ipfs";
  }
};

// pin image for collection
const pinCollectionFileToIPFS = async (fileName, name, address) => {
  const options = {
    pinataMetadata: {
      name: name,
      keyvalues: {
        bundleName: name,
        address: address,
      },
    },
    pinataOptions: {
      cidVersion: 0,
    },
  };
  const readableStreamForFile = fs.createReadStream(uploadPath + fileName);

  try {
    return await checkResult(async () => {
      let result = await pinata.pinFileToIPFS(readableStreamForFile, options);
      return result;
    });
  } catch (error) {
    Logger.error(error);
    return "failed to pin file to ipfs";
  }
};
// pin json to ipfs for NFT
const pinJsonToIPFS = async (jsonMetadata) => {
  const options = {
    pinataMetadata: {
      name: jsonMetadata.name,
      keyvalues: {
        address: jsonMetadata.properties.address,
      },
    },
    pinataOptions: {
      cidVersion: 0,
    },
  };

  try {
    return await checkResult(async () => {
      let result = await pinata.pinJSONToIPFS(jsonMetadata, options);
      return result;
    });
  } catch (error) {
    Logger.error(error);
    return "failed to pin json to ipfs";
  }
};
// pin json to ipfs for bundle
const pinBundleJsonToIPFS = async (jsonMetadata) => {
  const options = {
    pinataMetadata: {
      name: jsonMetadata.name,
      keyvalues: {
        bundleName: jsonMetadata.name,
      },
    },
    pinataOptions: {
      cidVersion: 0,
    },
  };

  try {
    return await checkResult(async () => {
      let result = await pinata.pinJSONToIPFS(jsonMetadata, options);
      return result;
    });
  } catch (error) {
    Logger.error(error);
    return "failed to pin json to ipfs";
  }
};

router.get("/ipfstest", async (req, res) => {
  pinata
    .testAuthentication()
    .then((result) => {
      res.send({
        result: result,
      });
    })
    .catch((err) => {
      Logger.error(err);
      res.send({
        result: "failed",
      });
    });
});
router.get("/test", service_auth, async (req, res) => {
  return res.json({
    apistatus: "running",
  });
});

router.post("/uploadImage2Server", auth, async (req, res) => {
  let form = new formidable.IncomingForm({
    maxFileSize: 200 * 1024 * 1024,
    maxFieldsSize: 300 * 1024 * 1024,
  });
  try {
    form.parse(req, async (err, fields, files) => {
      if (err) {
        Logger.error("uploadToIPFSerr: ", err);
        return res.status(400).json({
          status: "failed",
        });
      } else {
        const ipfsUri = ipfsUris[Math.floor(Math.random() * ipfsUris.length)];
        let imgData = fields.image;
        let name = fields.name;
        // let address = fields.account;
        // address = toLowerCase(address);

        /* change getting address from auth token */
        let address = extractAddress(req, res);

        let description = fields.description;
        let symbol = fields.symbol;
        let royalty = fields.royalty;
        let animation_url = fields.animation_url;
        let xtraUrl = fields.xtra;
        if (xtraUrl && !validUrl.isUri(xtraUrl)) {
          return res.status(400).json({
            status: "failed",
          });
        }
        let attributes= fields.attributes;
        let extension = imgData.substring(
          "data:image/".length,
          imgData.indexOf(";base64")
        );
        let random = generateRandomName();
        let imageFileName =
          address + "_" + random + "_" + Date.now() + "." + extension;

        imgData = imgData.replace(`data:image\/${extension};base64,`, "");

        fs.writeFile(uploadPath + imageFileName, imgData, "base64", async (err) => {
          if (err) {
            Logger.error("uploadToIPFSerr: ", err);
            return res.status(400).json({
              status: "failed to save an image file",
              err,
            });
          } else {
            let filePinStatus = await pinFileToIPFS(
              imageFileName,
              address,
              name,
              symbol,
              royalty,
              animation_url,
              xtraUrl
            );



            // remove file once pinned
            try {
              fs.unlinkSync(uploadPath + imageFileName);
            } catch (error) {
            }

            if (!filePinStatus.IpfsHash) {
              return res.json({
                status: "failed",
              });
            }

            let now = new Date();
            let currentTime = now.toUTCString();

            let metaData = {
              name: name,
              image: ipfsUri + filePinStatus.IpfsHash + '/' + imageFileName,
              animation_url: animation_url,
              description: description,
              properties: {
                symbol: symbol,
                address: address,
                royalty: royalty,
                recipient: address,
                IP_Rights: xtraUrl,
                createdAt: currentTime
              },
            };

            // Attributes //

            if (attributes)
            {
              attributes = attributes.replace(/"text"/gi,'"string"');

              attributes = attributes.replace(/trait_value/gi,'value');

              let parsed = JSON.parse(attributes);
              if (parsed.length > 0)
              {
                metaData.attributes = parsed;
              }
            }

            let jsonPinStatus = await pinJsonToIPFS(metaData);
            if (!jsonPinStatus.IpfsHash) {
              return res.json({
                status: "failed",
              });
            }
            return res.send({
              status: "success",
              uploadedCounts: 2,
              fileHash: ipfsUri + filePinStatus.IpfsHash + '/' + imageFileName,
              jsonHash: ipfsUri + jsonPinStatus.IpfsHash,
            });
          }
        });
      }
    });
  } catch (error) {
    Logger.error(error);
    return res.json({
      status: "failed",
    });
  }
});

router.post("/uploadBundleImage2Server", auth, async (req, res) => {
  let form = new formidable.IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(400).json({
        status: "failedParsingForm",
      });
    } else {
      const ipfsUri = ipfsUris[Math.floor(Math.random() * ipfsUris.length)];
      let imgData = fields.imgData;
      let name = fields.name;
      let description = fields.description;
      let address = fields.address;
      address = toLowerCase(address);
      let extension = imgData.substring(
        "data:image/".length,
        imgData.indexOf(";base64")
      );
      let imageFileName = address + name.replace(" ", "") + "." + extension;
      imgData = imgData.replace(`data:image\/${extension};base64,`, "");
      fs.writeFile(uploadPath + imageFileName, imgData, "base64", (err) => {
        if (err) {
          Logger.error(err);
          return res.status(400).json({
            status: "failed to save an image file",
            err,
          });
        }
      });

      let filePinStatus = await pinBundleFileToIPFS(
        imageFileName,
        name,
        address
      );
      // remove file once pinned
      try {
        fs.unlinkSync(uploadPath + imageFileName);
      } catch (error) {
        Logger.error(error);
      }

      if (!filePinStatus.IpfsHash) {
        return res.json({
          status: "failed",
        });
      }

      let bundle = new Bundle();
      bundle.bundleName = name;
      bundle.description = description;
      bundle.imageHash = ipfsUri + filePinStatus.IpfsHash;
      bundle.address = address;

      try {
        let saveStatus = await bundle.save();
        if (saveStatus) {
          return res.send({
            status: "success",
            bundle: saveStatus,
          });
        } else {
          return res.status(400).json({
            status: "failedSavingToDB",
          });
        }
      } catch (error) {
        Logger.error(error);
        return res.status(400).json({
          status: "failedOutSave",
        });
      }
    }
  });
});

const generateRandomName = () => {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
};
// pin banner image
router.post("/uploadBannerImage2Server", auth, async (req, res) => {
  let form = new formidable.IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) {
      Logger.error(err);
      return res.status(400).json({
        status: "failedParsingForm",
      });
    } else {
      let imgData = fields.imgData;

      /* change getting address from auth token */
      let address = extractAddress(req, res);
      let name = generateRandomName();

      let extension = imgData.substring(
        "data:image/".length,
        imgData.indexOf(";base64")
      );
      let imageFileName = address + name.replace(" ", "") + "." + extension;
      imgData = imgData.replace(`data:image\/${extension};base64,`, "");
      fs.writeFile(uploadPath + imageFileName, imgData, "base64", (err) => {
        if (err) {
          Logger.error(err);
          return res.status(400).json({
            status: "failed to save an image file",
            err,
          });
        }
      });

      let filePinStatus = await pinBannerFileToIPFS(imageFileName, address);
      // remove file once pinned
      if (!filePinStatus.IpfsHash) {
        try {
          fs.unlinkSync(uploadPath + imageFileName);
        } catch (error) {
          Logger.error(error);
        }
        return res.json({
          status: "failed",
        });
      }
      try {
        let account = await Account.findOne({
          address: address,
        });
        if (account) {
          account.bannerHash = filePinStatus.IpfsHash;
          await account.save();
        } else {
          let _account = new Account();
          _account.address = address;
          _account.bannerHash = filePinStatus.IpfsHash;
          await _account.save();
        }
      } catch (error) {
        Logger.error(error);
      }
      try {
        fs.unlinkSync(uploadPath + imageFileName);
      } catch (error) {
        Logger.error(error);
      }
      return res.json({
        status: "success",
        data: filePinStatus.IpfsHash,
      });
    }
  });
});

// pin collection image
router.post("/uploadCollectionImage2Server", auth, async (req, res) => {
  let form = new formidable.IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) {
      Logger.error(err);
      return res.status(400).json({
        status: "failedParsingForm",
      });
    } else {
      let imgData = fields.imgData;
      let name = fields.collectionName;
      // let address = fields.erc721Address;
      // address = toLowerCase(address);

      // change getting address from auth token
      let address = extractAddress(req, res);

      let extension = imgData.substring(
        "data:image/".length,
        imgData.indexOf(";base64")
      );
      let imageFileName = address + name.replace(" ", "") + "." + extension;
      imgData = imgData.replace(`data:image\/${extension};base64,`, "");
      fs.writeFile(uploadPath + imageFileName, imgData, "base64", (err) => {
        if (err) {
          Logger.error(err);
          return res.status(400).json({
            status: "failed to save an image file",
            err,
          });
        }
      });

      let filePinStatus = await pinCollectionFileToIPFS(
        imageFileName,
        name,
        address
      );
      // remove file once pinned
      try {
        fs.unlinkSync(uploadPath + imageFileName);
      } catch (error) { }

      if (!filePinStatus.IpfsHash) {

        return res.json({
          status: "failed",
        });
      }

      return res.json({
        status: "success",
        data: filePinStatus.IpfsHash,
      });
    }
  });
});

// pin media
function getFilesizeInBytes(filename) {
  var stats = fs.statSync(filename);
  var fileSizeInBytes = stats.size;
  return fileSizeInBytes;
}
router.post("/uploadMedia2Server", auth, async (req, res) => {
  let form = new formidable.IncomingForm({
    maxFileSize: 200 * 1024 * 1024,
    maxFieldsSize: 300 * 1024 * 1024,
  });
  try {
    form.parse(req, async (err, fields, files) => {
      if (err) {
        Logger.error(err);
        return res.status(400).json({
          status: "failedParsingForm",
        });
      } else {
        let mediaData = fields.media;
        let mediaExt = fields.mediaExt;
        let mediaSize = fields.mediaSize;
        /* change getting address from auth token */
        let address = extractAddress(req, res);
        let name = generateRandomName();
        const ipfsUri = ipfsUris[Math.floor(Math.random() * ipfsUris.length)];

        let imageFileName = address + '_' + name + "." + mediaExt;
        mediaData = mediaData.split("base64,")[1];
        let filesize = 0;
        fs.writeFile(uploadPath + imageFileName, mediaData, "base64", async (err) => {
          if (err) {
            Logger.error(err);
            return res.status(400).json({
              status: "failed to save a media file",
              err,
            });
          }
          filesize = getFilesizeInBytes(uploadPath + imageFileName);
          //console.log(filesize);
          if (Number(filesize) !== Number(mediaSize)) {
            console.log("Size is mismatch desc:" + filesize + '- ori:' + mediaSize);
            try {
              fs.unlinkSync(uploadPath + imageFileName);
            } catch (error) {
              Logger.error(error);
            }
            return res.status(400).json({
              status: "Size is mismatch" + (filesize + 1) + '-' + mediaSize,
            });
          }

          let filePinStatus = await pinMediaFileToIPFS(imageFileName, name.replace(" ", ""));
          // remove file once pinned

          try {
            fs.unlinkSync(uploadPath + imageFileName);
          } catch (error) {
            Logger.error(error);
          }
          console.log('original filesize', filesize);
          console.log('after pinnned', filePinStatus.PinSize);
          if (filePinStatus.PinSize < filesize) {
            return res.json({
              status: "failed",
            });
          }

          return res.json({
            status: "success",
            data: ipfsUri + filePinStatus.IpfsHash + '/' + imageFileName,
          });

        });

      }
    });
  } catch (error) {
    Logger.error(error);
    return res.json({
      status: "failed",
    });
  }
});

module.exports = router;
