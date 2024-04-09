import React from "react";
import { Box } from "@mui/material";
import InspectorView from "./InspectorView";
import { Inspector } from "./contracts/manageInspectors";

interface ItemListProps {
  inspectors: Inspector[];
  onCompleted: (idx: number) => void;
}

const ItemList: React.FC<ItemListProps> = ({ inspectors, onCompleted }) => (
  <Box sx={{ display: "flex", flexWrap: "wrap",  m : 6.8 }}>
    {inspectors.map(
      (inspector, idx) =>
        !inspector.isRemoved && (
          <InspectorView key={idx} inspector={inspector} idx={idx} onCompleted={onCompleted} />
        )
    )}
  </Box>
);

export default ItemList;
