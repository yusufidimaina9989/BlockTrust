import React, { useEffect, useState } from "react";
import { Button, Card, CardContent, Typography } from "@mui/material";
import { Item } from "./contracts/market";
import {
  Addr,
  ByteString,
  byteString2Int,
  reverseByteString,
  slice,
} from "scrypt-ts";

interface ItemProps {
  marketItem: Item;
  idx: number;
  myAddr: Addr;
  onBuyRequest: (itemIdx: number) => void;
  onBuyConfirm: (itemIdx: number) => void;
  onBuyCancel: (itemIdx: number) => void;
  onCancel: (itemIdx: number) => void;
}

function outpointToString(outpoint: ByteString): string {
  const txId = reverseByteString(slice(outpoint, 0n, 32n), 32n);
  const vout = byteString2Int(slice(outpoint, 32n, 36n));
  return `${txId}_${vout.toString()}`;
}

const ItemViewMarket: React.FC<ItemProps> = ({
  marketItem,
  idx,
  myAddr,
  onBuyRequest,
  onBuyConfirm,
  onBuyCancel,
  onCancel,
}) => {
  const [fileType, setFileType] = useState<string | null>(null);
  const [num, setNum] = useState("Loading.....");
  const [data, setData] = useState<any | null>(null);
  const [origin, setOrigin] = useState<string | null>(null);
  const [isMyListing, setIsMyListing] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const url = `https://testnet.ordinals.gorillapool.io/api/inscriptions/${outpointToString(
          marketItem.outpoint
        )}`;
        const response = await fetch(url);
        const data = await response.json();

        setOrigin(data.origin.outpoint);
        setNum(data.origin.num);
        setFileType(data.origin.data.insc.file.type);

        const url1 = `https://testnet.ordinals.gorillapool.io/content/${data.origin.outpoint}`;
        const response1 = await fetch(url1);
        const data1 = await response1.json();
        setData(data1);

        setIsMyListing(marketItem.sellerAddr === myAddr);
      } catch (error) {
        console.error("Error fetching data:", error);
        // Handle errors here
      }
    };

    fetchData();
  }, [marketItem]);

  return (
    data &&
    data.id &&
    data.desc &&
    data.cord &&
    data.add && (
      <Card
        sx={{
          width: 350,
          height: 400,
          m: 2,
          color: "ash",
          bgcolor: "rgba(255, 255, 255, 0.5)",
          borderRadius: "10px",
        }}>
        <CardContent
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-end",
            width: "90%",
            height: "90%",
          }}>
          {data && (
            <div>
              <img
                id="imagePreview"
                style={{ maxWidth: 250 }}
                src={`data:image/jpg;base64,${data.img}`}
                alt={`Image `}
              />
              <Typography variant="body1" component="div">
                <b>ID :</b> {data.id}
              </Typography>
              <Typography variant="body1" component="div">
                <b>desc : </b>
                {data.desc}
              </Typography>
              <Typography variant="body1" component="div">
                <b>Location: </b>
                <a
                  href={`https://earth.google.com/web/@${data.cord}?viewaction=pan&dz=-10`}
                  target="_blank"
                  rel="noopener noreferrer">
                  View on Map
                </a>
              </Typography>

              <Typography variant="body1" component="div">
                <b>address : </b>
                {data.add}
              </Typography>
              <hr />
            </div>
          )}
          <Typography variant="body2" color="text.secondary">
            <b>#{num}</b>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <b>Price:</b> {Number(marketItem.price) / 10 ** 8} BSV
          </Typography>
          {isMyListing ? (
            marketItem.hasRequestingBuyer ? (
              <Button
                variant="contained"
                style={{ backgroundColor: "rgba(0, 128, 0, 0.5)" }}
                onClick={() => onBuyConfirm(idx)}>
                Confirm Buy Request
              </Button>
            ) : (
              <Button
                variant="contained"
                style={{ backgroundColor: "rgba(0, 128, 0, 0.5)" }}
                onClick={() => onCancel(idx)}>
                Cancel Listing
              </Button>
            )
          ) : marketItem.hasRequestingBuyer &&
            marketItem.requestingBuyer == myAddr ? (
            <Button
              variant="contained"
              style={{ backgroundColor: "rgba(0, 128, 0, 0.5)" }}
              onClick={() => onBuyCancel(idx)}>
              Cancel Buy Request
            </Button>
          ) : (
            <Button
              variant="contained"
              style={{ backgroundColor: "rgba(0, 128, 0, 0.5)" }}
              onClick={() => onBuyRequest(idx)}>
              Request Buy
            </Button>
          )}
        </CardContent>
      </Card>
    )
  );
};

export default ItemViewMarket;
