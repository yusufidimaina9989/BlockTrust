import React from "react";
import { Button, Card, CardContent, Checkbox, Typography } from "@mui/material";
import { Inspector } from "./contracts/manageInspectors";
import { PersonRemoveAlt1 } from "@mui/icons-material";
interface ItemProps {
  inspector: Inspector;
  idx: number;
  onCompleted: (idx: number) => void;
}

const InspectorView: React.FC<ItemProps> = ({
  inspector,
  idx,
  onCompleted,
}) => (
  <Card
    sx={{
      minWidth: 325,
      m: 1,
      color: "ash",
      bgcolor: "rgba(255, 255, 255, 0.5)",
    }}>
    <CardContent>
      <Typography variant="h6" onClick={() => onCompleted(idx)} component="div">
        <strong>Name : </strong>{" "}
        {Buffer.from(inspector.name, "hex").toString("utf8")}
        <br />
        <strong>PubKey : </strong> {inspector.pubkey.toString()}
        <br />
        <strong>Physical Address : </strong>{" "}
        {Buffer.from(inspector.address, "hex").toString("utf8")}
        <br />
        <br />
        <Button
          color="warning"
          variant="contained"
          size="large"
          startIcon={<PersonRemoveAlt1 />}>
          Remove
        </Button>
      </Typography>
    </CardContent>
  </Card>
);

export default InspectorView;
