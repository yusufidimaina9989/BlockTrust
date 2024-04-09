import React, { useEffect, useState } from "react";
import {
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
} from "@mui/material";
import { Register } from "./contracts/inscription";

interface ItemProps {
  item: any;
  idx: number;
  onList: (idx: number, priceSats: number) => void;
}

const ItemViewWallet: React.FC<ItemProps> = ({ item, idx, onList }) => {
  const [textData, setTextData] = useState<any | null>(null);
  const [isListing, setIsListing] = useState(false);
  const [price, setPrice] = useState("0.345");
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    if (item.origin.data.insc.file.type === "text/plain") {
      const url = `https://testnet.ordinals.gorillapool.io/content/${item.origin.outpoint}`;
      fetch(url)
        .then((response) => response.json())
        .then((data) => setTextData(data))
        .catch((error) => {
          console.error("Error fetching text data:", error);
          setTextData({});
        });
    }

    const timer = setTimeout(() => {
      setShowAlert(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, [item]);

  const handleListForSale = () => {
    if (isListing) {
      const priceFloat = parseFloat(price);
      if (!isNaN(priceFloat) && priceFloat >= 0.00000001) {
        const priceSats = Math.floor(priceFloat * 10 ** 8);
        onList(idx, priceSats);
        setIsListing(false);
        setPrice("");
      } else {
        console.error("Invalid price entered");
      }
    } else {
      setIsListing(true);
    }
  };

  return (
    <>
      {showAlert && (
        <div
          style={{
            backgroundColor: "red",
            color: "white",
            padding: "10px",
            position: "fixed",
            bottom: 0,
            left: 0,
            width: "100%",
            textAlign: "center",
          }}>
          <b>Note</b> : This wallet only display Real Estate Tokens (Ordinals)
          inscribed here at BlockTrust ⚠️
        </div>
      )}

      {textData &&
        textData.id &&
        textData.desc &&
        textData.cord &&
        textData.add && (
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
                width: "95%",
                height: "90%",
              }}>
              <div>
                <img
                  id="imagePreview"
                  style={{ maxWidth: 250 }}
                  src={`data:image/jpg;base64,${textData.img}`}
                  alt={`Image #${item.origin.num}`}
                />
                <Typography variant="body1" component="div">
                  <b>ID :</b> {textData.id}
                </Typography>
                <Typography variant="body1" component="div">
                  <b>desc : </b>
                  {textData.desc}
                </Typography>
                <Typography variant="body1" component="div">
                  <b>Location: </b>
                  <a
                    href={`https://earth.google.com/web/@${textData.cord}?viewaction=pan&dz=-10`}
                    target="_blank"
                    rel="noopener noreferrer">
                    View on Map
                  </a>
                </Typography>

                <Typography variant="body1" component="div">
                  <b>address : </b>
                  {textData.add}
                </Typography>
                <hr />
              </div>

              {item.origin.num ? (
                <Typography variant="body2" color="text.secondary">
                  <b>#{item.origin.num}</b>
                </Typography>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Pending...
                </Typography>
              )}
              <Button
                variant="contained"
                style={{ backgroundColor: "rgba(0, 128, 0, 0.5)" }}
                onClick={handleListForSale}>
                {isListing ? "Confirm" : "List For Sale"}
              </Button>

              {isListing && (
                <TextField
                  label="Set Price (BSV)"
                  variant="outlined"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  type="number"
                  inputProps={{ step: "0.01" }}
                  style={{ marginTop: 10 }}
                />
              )}
            </CardContent>
          </Card>
        )}
    </>
  );
};

export default ItemViewWallet;
