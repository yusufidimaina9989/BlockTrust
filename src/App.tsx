import React, { useEffect, useRef, useState } from "react";
import InspectorList from "./InspectorList";
import NewInspector from "./NewInspector";
import {
  Addr,
  Constants,
  ContractCalledEvent,
  MethodCallOptions,
  PandaSigner,
  PubKey,
  Scrypt,
  ScryptProvider,
  SignTransactionOptions,
  SignatureRequest,
  SignatureResponse,
  StatefulNext,
  UTXO,
  Utils,
  bsv,
  byteString2Int,
  findSig,
  int2ByteString,
  reverseByteString,
  slice,
  toByteString,
} from "scrypt-ts";
import {
  OrdiMethodCallOptions,
  OrdiNFTP2PKH,
  OrdiProvider,
  ContentType,
} from "scrypt-ord";
import { Box, Button, Tab, Tabs, TextField } from "@mui/material";
import ItemViewWallet from "./ItemViewWallet";
import { Item, Market } from "./contracts/market";
import ItemViewMarket from "./ItemViewMarket";
import { Register } from "./contracts/inscription";
import { House, ManageAccounts, Wallet } from "@mui/icons-material";
import LocalGroceryStoreIcon from "@mui/icons-material/LocalGroceryStore";
import PersonIcon from "@mui/icons-material/Person";
import MapComponent from "./mapComponent";
import { Inspector, ManageInspectors } from "./contracts/manageInspectors";
import backgroundImage from "./assets/image.gif";

const contract_id = {
  /** The deployment transaction id */
  txId: "01e1c8a8948f7dced7b7aea5b09415df90ba8737ed52f46019a1426caf0cbda4",
  /** The output index */
  outputIndex: 0,
};
const market_contract_id = {
  /** The deployment transaction id */
  txId: "f247c0c3a5c494b4d1a2105488c361001c6abdc5b50988d0eecbb92cd5820c10",
  /** The output index */
  outputIndex: 0,
};

const App: React.FC = () => {
  const signerRef = useRef<PandaSigner>();
  const signerRef1 = useRef<PandaSigner>();
  const [isConnected, setIsConnected] = useState(false);
  const [marketInstance, setMarket] = useState<Market>();
  const [connectedPayAddress, setConnectedPayAddress] = useState(undefined);
  const [connectedOrdiAddress, setConnectedOrdiAddress] = useState(undefined);

  const [walletItems, setWalletItems] = useState([]);
  const [marketItems, setMarketItems] = useState([]);

  const [activeTab, setActiveTab] = useState(0);
  const [image, setimage] = useState<string>("");
  const [instanceData, setInstanceData] = useState<Register | null>(null);
  const [formData, setFormData] = useState({
    propertyID: "",
    description: "",
    address: "",
    coordinates: "",
    wallet: "",
  });
  const [contractInstance, setContract] = useState<ManageInspectors>();

  useEffect(() => {
    const signer = signerRef1.current as PandaSigner;

    fetchContract();

    const subscription = Scrypt.contractApi.subscribe(
      {
        clazz: ManageInspectors,
        id: contract_id,
      },
      (event: ContractCalledEvent<ManageInspectors>) => {
        setContract(event.nexts[0]);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const signer = signerRef1.current as PandaSigner;

    fetchMarketContract();

    const marketSubscription = Scrypt.contractApi.subscribe(
      {
        clazz: Market,
        id: market_contract_id,
      },
      (event: ContractCalledEvent<Market>) => {
        setMarket(event.nexts[0]);
      }
    );

    return () => {
      marketSubscription.unsubscribe();
    };
  }, []);

  const getCurrentBackgroundImage = () => {
    return backgroundImage;
  };

  async function fetchContract() {
    try {
      const instance = await Scrypt.contractApi.getLatestInstance(
        ManageInspectors,
        contract_id
      );
      setContract(instance);
    } catch (error: any) {
      alert("Error Fetching the Contract ");
      console.error("fetchContract error: ", error);
    }
  }

  async function fetchMarketContract() {
    try {
      const marketinstance = await Scrypt.contractApi.getLatestInstance(
        Market,
        market_contract_id
      );
      setMarket(marketinstance);
    } catch (error: any) {
      alert("Error Fetching the Contract ");
      console.error("fetchContract error: ", error);
    }
  }

  const handleCompleted = async (idx: number) => {
    const signer = signerRef1.current as PandaSigner;
    if (contractInstance && signer) {
      const { isAuthenticated, error } = await signer.requestAuth();
      const owner = await signer.getDefaultPubKey();
      if (!isAuthenticated) {
        throw new Error(error);
      }

      await contractInstance.connect(signer);

      // Create the next instance from the current.
      const nextInstance = contractInstance.next();
      // Set empty slot for next instance.
      nextInstance.inspectors[idx].isRemoved = true;

      // Call the method of current instance to apply the updates on chain.
      contractInstance.methods
        .inspectorRemoved(BigInt(idx), {
          changeAddress: await signer.getDefaultAddress(),
          next: {
            instance: nextInstance,
            balance: contractInstance.balance,
          },
        } as MethodCallOptions<ManageInspectors>)
        .then((result) => {
          console.log(` Land Inspector Removed Successfully: ${result.tx.id}`);
        })
        .catch((e) => {
          console.error("Error in Removing the Inspector: ", e);
        });
    }
  };

  const handleAdd = async (newItem: {
    name: string;
    pubkey: string;
    address: string;
  }) => {
    const signer = signerRef1.current as PandaSigner;
    const Address = await signer.getDefaultAddress();
    // setAddress(toHex(Address));
    if (contractInstance && signer) {
      const { isAuthenticated, error } = await signer.requestAuth();
      if (!isAuthenticated) {
        throw new Error(error);
      }

      await contractInstance.connect(signer);

      // Create the next instance from the current.
      const nextInstance = contractInstance.next();

      // Construct new item object.
      const toAdd: Inspector = {
        name: toByteString(newItem.name, true),
        pubkey: newItem.pubkey,
        address: toByteString(newItem.address, true),
        isRemoved: false,
      };

      let itemIdx = undefined;
      for (let i = 0; i < ManageInspectors.MAX_INSPECTORS; i++) {
        const item = contractInstance.inspectors[i];
        if (item.isRemoved) {
          itemIdx = BigInt(i);
          nextInstance.inspectors[i] = toAdd;
          break;
        }
      }

      if (itemIdx === undefined) {
        console.error("All Inspector slots are filled.");
        return;
      }

      // Call the method of current instance to apply the updates on chain.
      contractInstance.methods
        .addInspector(toAdd, itemIdx, {
          next: {
            instance: nextInstance,
            balance: contractInstance.balance,
          },
        })
        .then((result) => {
          console.log(`Land Inspector Added: ${result.tx.id}`);
        })
        .catch((e) => {
          console.error("Error in Adding Inspector : ", e);
        });
    }
  };

  useEffect(() => {
    loadWalletItems();
  }, [connectedOrdiAddress]);

  async function loadWalletItems() {
    const signer = signerRef.current as PandaSigner;

    if (signer) {
      try {
        const connectedOrdiAddressStr = await signer.getOrdAddress();
        const url = `https://testnet.ordinals.gorillapool.io/api/txos/address/${connectedOrdiAddressStr}/unspent?bsv20=false`;

        const response = await fetch(url);
        const data = await response.json();

        const filteredData = data.filter(
          (e) => e.origin.data.insc.file.type !== "application/bsv-20"
        );

        if (contractInstance) {
          const filteredDataNoMarket = [];
          filteredData.map((dataItem, idx) => {
            const isOnMarket =
              marketInstance.items.filter((marketItem) => {
                if (marketItem.isEmptySlot) {
                  return false;
                }
                const txId = reverseByteString(
                  slice(marketItem.outpoint, 0n, Constants.TxIdLen),
                  32n
                );
                const vout = byteString2Int(
                  slice(
                    marketItem.outpoint,
                    Constants.TxIdLen,
                    Constants.OutpointLen
                  )
                );
                const outpointStr = `${txId}_${vout.toString()}`;
                return outpointStr == dataItem.outpoint;
              }).length > 0;
            if (!isOnMarket) {
              filteredDataNoMarket.push(dataItem);
            }
          });
          setWalletItems(filteredDataNoMarket);
        } else {
          setWalletItems(filteredData);
        }
      } catch (error) {
        console.error("Error fetching wallet items:", error);
      }
    }
  }

  async function connect() {
    const provider = new OrdiProvider(bsv.Networks.testnet);
    const signer = new PandaSigner(provider);
    const signer1 = new PandaSigner(new ScryptProvider());

    signerRef.current = signer;
    signerRef1.current = signer1;
    const { isAuthenticated, error } = await signer.requestAuth();
    if (!isAuthenticated) {
      throw new Error(`Unauthenticated: ${error}`);
    }

    setConnectedPayAddress(await signer.getDefaultAddress());
    setConnectedOrdiAddress(await signer.getOrdAddress());
    setIsConnected(true);
  }

  const handleList = async (idx: number, priceSats: number) => {
    const signer = signerRef.current as PandaSigner;

    const { isAuthenticated, error } = await signer.requestAuth();
    if (!isAuthenticated) {
      throw new Error(error);
    }

    const item = walletItems[idx];
    const outpoint = item.outpoint;

    await marketInstance.connect(signer);

    // Create the next instance from the current.
    const nextInstance = marketInstance.next();

    // Construct new item object.
    const sellerAddr = Addr(connectedOrdiAddress.toByteString());
    const outpointBS =
      reverseByteString(
        toByteString(outpoint.slice(0, 64)),
        Constants.TxIdLen
      ) + int2ByteString(BigInt(outpoint.slice(66)), 4n);

    const toAdd: Item = {
      outpoint: outpointBS,
      price: BigInt(priceSats),
      sellerAddr,
      isEmptySlot: false,
      hasRequestingBuyer: false,
      requestingBuyer: Addr(
        toByteString("0000000000000000000000000000000000000000")
      ),
    };

    // Find first empty slot and insert new item data.
    let itemIdx = undefined;
    for (let i = 0; i < Market.ITEM_SLOTS; i++) {
      const item = marketInstance.items[i];
      if (item.isEmptySlot) {
        itemIdx = BigInt(i);
        nextInstance.items[i] = toAdd;
        break;
      }
    }

    if (itemIdx === undefined) {
      console.error("Error addding new Items.");
      return;
    }

    // Call the method of current instance to apply the updates on chain.
    marketInstance.methods
      .listItem(toAdd, itemIdx, {
        next: {
          instance: nextInstance,
          balance: marketInstance.balance,
        },
      })
      .then((result) => {
        console.log(`Listed successfully: ${result.tx.id}`);
        fetchContract();
      })
      .catch((e) => {
        console.error("Error in Listing Item: ", e);
      });
  };

  const handleBuyRequest = async (itemIdx: number) => {
    const signer = signerRef.current as PandaSigner;
    await marketInstance.connect(signer);

    const itemPrice = Number(marketInstance.items[itemIdx].price);
    const myAddr = Addr(connectedOrdiAddress.toByteString());

    // Create the next instance from the current.
    const nextInstance = marketInstance.next();
    nextInstance.items[itemIdx].hasRequestingBuyer = true;
    nextInstance.items[itemIdx].requestingBuyer = myAddr;

    // Call the method of current instance to apply the updates on chain.
    marketInstance.methods
      .requestBuy(BigInt(itemIdx), myAddr, {
        next: {
          instance: nextInstance,
          balance: contractInstance.balance + itemPrice,
        },
      })
      .then((result) => {
        console.log(`Buy request sent: ${result.tx.id}`);
        fetchContract();
      })
      .catch((e) => {
        console.error("Error requesting Buy: ", e);
      });
  };

  const handleBuyConfirm = async (itemIdx: number) => {
    const signer = signerRef.current as PandaSigner;

    await marketInstance.connect(signer);

    // Fetch ordinal TX and extract UTXO.
    const outpoint = marketInstance.items[itemIdx].outpoint;
    const ordinalTxid = reverseByteString(
      slice(outpoint, 0n, Constants.TxIdLen),
      Constants.TxIdLen
    );
    const ordinalVout = Number(
      byteString2Int(slice(outpoint, Constants.TxIdLen, Constants.OutpointLen))
    );

    const tx = await signer.provider!.getTransaction(ordinalTxid);
    const out = tx.outputs[ordinalVout];

    const ordinalUTXO: UTXO = {
      address: marketInstance.items[itemIdx].sellerAddr,
      txId: ordinalTxid,
      outputIndex: ordinalVout,
      script: out.script.toHex(),
      satoshis: out.satoshis,
    };

    // Create the next instance from the current.
    const nextInstance = marketInstance.next();

    // Bind custom call tx builder
    marketInstance.bindTxBuilder(
      "confirmBuy",
      async (current: Market, options: MethodCallOptions<Market>) => {
        const unsignedTx: bsv.Transaction = new bsv.Transaction();

        // Add input that unlocks ordinal UTXO.
        unsignedTx
          .addInput(
            new bsv.Transaction.Input({
              prevTxId: ordinalUTXO.txId,
              outputIndex: ordinalUTXO.outputIndex,
              script: bsv.Script.fromHex("00".repeat(34)), // Dummy script
            }),
            bsv.Script.fromHex(ordinalUTXO.script),
            ordinalUTXO.satoshis
          )
          .addInput(current.buildContractInput());

        // Build ordinal destination output.
        unsignedTx
          .addOutput(
            new bsv.Transaction.Output({
              script: bsv.Script.fromHex(
                Utils.buildPublicKeyHashScript(
                  current.items[itemIdx].requestingBuyer
                )
              ),
              satoshis: 1,
            })
          )
          // Build seller payment output.
          .addOutput(
            new bsv.Transaction.Output({
              script: bsv.Script.fromHex(
                Utils.buildPublicKeyHashScript(
                  current.items[itemIdx].sellerAddr
                )
              ),
              satoshis: current.utxo.satoshis,
            })
          );

        if (options.changeAddress) {
          unsignedTx.change(options.changeAddress);
        }

        return Promise.resolve({
          tx: unsignedTx,
          atInputIndex: 1,
          nexts: [],
        });
      }
    );

    let contractTx = await marketInstance.methods.confirmBuy(BigInt(itemIdx), {
      changeAddress: await signer.getDefaultAddress(),
      partiallySigned: true,
      exec: false, // Do not execute the contract yet, only get the created calling transaction.
    } as MethodCallOptions<Market>);

    // If we would like to broadcast, here we need to sign ordinal UTXO input.
    const sigRequest: SignatureRequest = {
      prevTxId: ordinalUTXO.txId,
      outputIndex: ordinalUTXO.outputIndex,
      inputIndex: 0,
      satoshis: ordinalUTXO.satoshis,
      address: await signer.getOrdAddress(),
      scriptHex: ordinalUTXO.script,
      sigHashType: bsv.crypto.Signature.ANYONECANPAY_SINGLE,
    };
    const signedTx = await signer.signTransaction(contractTx.tx, {
      sigRequests: [sigRequest],
      address: await signer.getOrdAddress(),
    } as SignTransactionOptions);

    // Bind tx builder, that just simply re-uses the tx we created above.
    marketInstance.bindTxBuilder(
      "confirmBuy",
      async (current: Market, options: MethodCallOptions<Market>) => {
        return Promise.resolve({
          tx: signedTx,
          atInputIndex: 1,
          nexts: [],
        });
      }
    );

    marketInstance.methods
      .confirmBuy(itemIdx, {
        changeAddress: await signer.getDefaultAddress(),
      } as MethodCallOptions<Market>)
      .then((result) => {
        console.log(`Buy confirm call tx: ${result.tx.id}`);
        fetchContract();
      })
      .catch((e) => {
        console.error("Buy confirm call error: ", e);
      });
  };

  const handleBuyCancel = async (itemIdx: number) => {
    const signer = signerRef.current as PandaSigner;
    await marketInstance.connect(signer);

    const itemPrice = Number(marketInstance.items[itemIdx].price);

    // Create the next instance from the current.
    const nextInstance = marketInstance.next();
    nextInstance.items[itemIdx].hasRequestingBuyer = false;
    nextInstance.items[itemIdx].requestingBuyer = Addr(
      toByteString("0000000000000000000000000000000000000000")
    );

    // Bind custom call tx builder.
    marketInstance.bindTxBuilder(
      "cancelBuy",
      async (current: Market, options: MethodCallOptions<Market>) => {
        const unsignedTx: bsv.Transaction = new bsv.Transaction();

        const next = options.next as StatefulNext<Market>;

        unsignedTx
          .addInput(current.buildContractInput())
          .addOutput(
            new bsv.Transaction.Output({
              script: next.instance.lockingScript,
              satoshis: current.utxo.satoshis - itemPrice,
            })
          )
          // Build buyer refund output.
          .addOutput(
            new bsv.Transaction.Output({
              script: bsv.Script.fromHex(
                Utils.buildPublicKeyHashScript(
                  current.items[itemIdx].requestingBuyer
                )
              ),
              satoshis: itemPrice,
            })
          );

        if (options.changeAddress) {
          unsignedTx.change(options.changeAddress);
        }

        return Promise.resolve({
          tx: unsignedTx,
          atInputIndex: 0,
          nexts: [],
        });
      }
    );

    // Call the method of current instance to apply the updates on chain.
    const myPublicKey = await signer.getDefaultPubKey();
    marketInstance.methods
      .cancelBuy(
        BigInt(itemIdx),
        PubKey(myPublicKey.toByteString()),
        (sigResps: SignatureResponse[]) => findSig(sigResps, myPublicKey),
        {
          pubKeyOrAddrToSign: myPublicKey,
          changeAddress: myPublicKey.toAddress(),
          next: {
            instance: nextInstance,
            balance: contractInstance.balance - itemPrice,
          },
        } as MethodCallOptions<Market>
      )
      .then((result) => {
        console.log(`Buy request cancel: ${result.tx.id}`);
        fetchContract();
      })
      .catch((e) => {
        console.error("Error in Cancelling Buy Request: ", e);
      });
  };

  const handleCancelListing = async (itemIdx: number) => {
    const signer = signerRef.current as PandaSigner;

    const { isAuthenticated, error } = await signer.requestAuth();
    if (!isAuthenticated) {
      throw new Error(error);
    }

    await marketInstance.connect(signer);

    const seller = await signer.getOrdPubKey();
    const sellerPubKey = PubKey(seller.toByteString());

    // Create the next instance from the current.
    const nextInstance = marketInstance.next();
    nextInstance.items[itemIdx].isEmptySlot = true;

    // Call the method of current instance to apply the updates on chain.
    marketInstance.methods
      .cancelListing(
        itemIdx,
        sellerPubKey,
        (sigResp) => findSig(sigResp, seller),
        {
          pubKeyOrAddrToSign: seller,
          next: {
            instance: nextInstance,
            balance: marketInstance.balance,
          },
        } as MethodCallOptions<Market>
      )
      .then((result) => {
        console.log(`Cancel listing: ${result.tx.id}`);
        fetchContract();
      })
      .catch((e) => {
        console.error("Error in cancel listing: ", e);
      });
  };

  const handleConnect = async () => {
    try {
      await connect();
    } catch (error) {
      console.error("Error connecting:", error);
      alert("An error occurred while connecting: " + error.message);
    }
  };

  const handleTabChange = (e, tabIndex) => {
    if (tabIndex == 0) {
      loadWalletItems();
    } else if (tabIndex == 1) {
      fetchContract();
    }
    setActiveTab(tabIndex);
  };

  const landRegister = async () => {
    const signer = signerRef.current as PandaSigner;
    await signer.connect();
    const address = (await signer.getOrdAddress()).toByteString();
    let instance = instanceData;
    await instance.connect(signer);

    const data = {
      img: image,
      id: formData.propertyID.toLocaleUpperCase(),
      desc: formData.description.toLocaleUpperCase(),
      add: formData.address.toLocaleUpperCase(),
      cord: formData.coordinates,
      wallet: formData.wallet,
    };
    const inscriptionTx = await instance.inscribeText(JSON.stringify(data));

    console.log("Inscription TXID : ", inscriptionTx.id);

    // 5-second delay before transferring
    setTimeout(async () => {
      const { tx: transferTx } = await instance.methods.transfer(
        Addr(address),
        {
          transfer: new OrdiNFTP2PKH(
            Addr(bsv.Address.fromString(formData.wallet).toByteString())
          ),
        } as OrdiMethodCallOptions<Register>
      );

      console.log("Transferred NFT: ", transferTx.id);
    }, 5000); // 5000 milliseconds = 5 seconds
  };

  const handleFileInput = (event) => {
    const file = event.target.files[0];

    if (file) {
      const reader = new FileReader();

      reader.onload = (e) => {
        if (e.target.result instanceof ArrayBuffer) {
          const uint8Array = new Uint8Array(e.target.result);
          const base64Data = btoa(String.fromCharCode.apply(null, uint8Array));
          // Now, 'base64Data' contains the base64-encoded image data
          console.log(base64Data);
          setimage(base64Data);
          const imageElement = document.getElementById(
            "imagePreview"
          ) as HTMLImageElement;
          imageElement.src = `data:image/jpg;base64, ${base64Data}`;
        } else {
          console.error("Unsupported data type");
        }
        // Update the state with the base64 data
      };

      reader.readAsArrayBuffer(file);
    }
  };

  const updateInstanceData = () => {
    // Create a new instance of Register with the form data
    const newInstance = new Register(
      toByteString(formData.propertyID, true),
      toByteString(formData.description, true),
      toByteString(formData.address, true),
      toByteString(formData.coordinates, true)
    );

    // Set the instance data
    setInstanceData(newInstance);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));

    // Update the instance data on every input change
    updateInstanceData();
  };

  return (
    <div
      style={{
        backgroundImage: `url(${getCurrentBackgroundImage()})`,
        backgroundSize: "cover",
        minHeight: "100vh",
        minWidth: "100vw",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}>
      {" "}
      <div style={{ padding: "25px" }}>
        <Box
          sx={{
            display: "flex",
            width: "100%",
            flexDirection: "column",
            alignItems: "center",
          }}>
          <Tabs
            orientation="horizontal"
            variant="scrollable"
            value={activeTab}
            onChange={handleTabChange}
            sx={{
              "& .MuiTab-root": {
                margin: "0 8px",
              },
            }}>
            <Tab
              label="My Assets"
              icon={<House />}
              sx={{
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                color: "white",
                borderRadius: "8px",
                fontWeight: "bold",
                padding: "8px",
                cursor: "pointer",
                "&.Mui-selected": {
                  backgroundColor: "rgba(0, 0, 0, 0)",
                  color: "white",
                },
              }}
            />
            <Tab
              label="Real Estate Market"
              icon={<LocalGroceryStoreIcon />}
              sx={{
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                color: "white",
                borderRadius: "8px",
                fontWeight: "bold",
                padding: "8px",
                cursor: "pointer",
                "&.Mui-selected": {
                  backgroundColor: "rgba(0, 0, 0, 0)",
                  color: "white",
                },
              }}
            />
            <Tab
              label="Real Estate Inspector's Tab"
              icon={<PersonIcon />}
              sx={{
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                color: "white",
                borderRadius: "8px",
                fontWeight: "bold",
                padding: "8px",
                cursor: "pointer",
                "&.Mui-selected": {
                  backgroundColor: "rgba(0, 0, 0, 0)",
                  color: "white",
                },
              }}
            />
            <Tab
              label="Manage Inspectors"
              icon={<ManageAccounts />}
              sx={{
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                color: "white",
                borderRadius: "8px",
                fontWeight: "bold",
                padding: "8px",
                cursor: "pointer",
                "&.Mui-selected": {
                  backgroundColor: "rgba(0, 0, 0, 0)",
                  color: "white",
                },
              }}
            />
          </Tabs>
        </Box>
        <hr />
        <br />

        {activeTab === 0 && (
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
            }}>
            {isConnected ? (
              walletItems.map((item, idx) => {
                console.log(item);
                return (
                  <ItemViewWallet
                    key={idx}
                    item={item}
                    idx={idx}
                    onList={handleList}
                  />
                );
              })
            ) : (
              <h3 style={{ color: "white" }}>Connect Your Wallet</h3>
            )}
          </Box>
        )}

        {activeTab === 1 && (
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
            }}>
            {marketInstance &&
              marketInstance.items.map((item, idx) => {
                if (!item.isEmptySlot) {
                  return (
                    <ItemViewMarket
                      key={idx}
                      marketItem={item}
                      myAddr={Addr(connectedOrdiAddress.toByteString())}
                      idx={idx}
                      onBuyRequest={handleBuyRequest}
                      onBuyConfirm={handleBuyConfirm}
                      onBuyCancel={handleBuyCancel}
                      onCancel={handleCancelListing}
                    />
                  );
                }
              })}
          </Box>
        )}

        {activeTab === 2 && (
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
            }}>
            <div>
              {isConnected ? (
                <>
                  <TextField
                    name="propertyID"
                    label="Property ID : "
                    variant="standard"
                    value={formData.propertyID}
                    onChange={handleInputChange}
                    sx={{
                      width: "100%",
                      marginBottom: 2,
                      color: "white",
                      bgcolor: "rgba(255, 255, 255, 0.2)",
                    }}
                    InputProps={{ style: { color: "white" } }}
                    InputLabelProps={{ style: { color: "white" } }}
                    fullWidth
                    margin="normal"
                    required
                  />
                  <TextField
                    name="description"
                    label="description and size : "
                    variant="standard"
                    value={formData.description}
                    onChange={handleInputChange}
                    sx={{
                      width: "100%",
                      marginBottom: 2,
                      color: "white",
                      bgcolor: "rgba(255, 255, 255, 0.2)",
                    }}
                    InputProps={{ style: { color: "white" } }}
                    InputLabelProps={{ style: { color: "white" } }}
                    fullWidth
                    margin="normal"
                    required
                  />
                  <TextField
                    name="address"
                    label="Physical Address : "
                    variant="standard"
                    value={formData.address}
                    onChange={handleInputChange}
                    sx={{
                      width: "100%",
                      marginBottom: 2,
                      color: "white",
                      bgcolor: "rgba(255, 255, 255, 0.2)",
                    }}
                    InputProps={{ style: { color: "white" } }}
                    InputLabelProps={{ style: { color: "white" } }}
                    fullWidth
                    margin="normal"
                    required
                  />
                  <TextField
                    name="coordinates"
                    label="Coordinates : "
                    variant="standard"
                    value={formData.coordinates}
                    onChange={handleInputChange}
                    sx={{
                      width: "100%",
                      marginBottom: 2,
                      color: "white",
                      bgcolor: "rgba(255, 255, 255, 0.2)",
                    }}
                    InputProps={{ style: { color: "white" } }}
                    InputLabelProps={{ style: { color: "white" } }}
                    fullWidth
                    margin="normal"
                    required
                  />
                  <TextField
                    name="wallet"
                    label="Wallet Address : "
                    variant="standard"
                    value={formData.wallet}
                    onChange={handleInputChange}
                    sx={{
                      width: "100%",
                      marginBottom: 2,
                      color: "white",
                      bgcolor: "rgba(255, 255, 255, 0.2)",
                    }}
                    InputProps={{ style: { color: "white" } }}
                    InputLabelProps={{ style: { color: "white" } }}
                    fullWidth
                    margin="normal"
                    required
                  />
                  <MapComponent />
                  <br />
                  <br />
                  <input type="file" onChange={handleFileInput} />
                  <br />
                  <img
                    id="imagePreview"
                    alt="preview"
                    height={400}
                    width={350}
                  />
                  <br />
                  <Button
                    variant="contained"
                    style={{ backgroundColor: "rgba(0, 128, 0, 0.5)" }}
                    color="success"
                    onClick={landRegister}
                    sx={{ marginTop: 2 }}>
                    Inscribe it !
                  </Button>
                </>
              ) : (
                <h3 style={{ color: "white" }}>Connect Your Wallet</h3>
              )}
            </div>
          </Box>
        )}
        {activeTab === 3 && (
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
            }}>
            <div>
              {isConnected ? (
                <>
                  <NewInspector onAdd={handleAdd} />
                  <InspectorList
                    inspectors={contractInstance.inspectors as Inspector[]}
                    onCompleted={handleCompleted}
                  />
                </>
              ) : (
                <h3 style={{ color: "white" }}>Connect Your Wallet</h3>
              )}
            </div>
          </Box>
        )}
      </div>
      <div
        style={{
          position: "absolute",
          top: 90,
          right: 10,
          padding: "25px",
        }}>
        {!isConnected && (
          <Button
            startIcon={<Wallet />}
            variant="contained"
            size="large"
            onClick={handleConnect}
            sx={{
              backgroundColor: "red",
              "&:hover": {
                backgroundColor: "darkred",
              },
              color: "white",
            }}>
            Connect Your's Wallet
          </Button>
        )}
      </div>
    </div>
  );
};

export default App;
