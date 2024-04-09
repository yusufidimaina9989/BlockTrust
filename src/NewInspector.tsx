import React, { useState } from "react";
import { TextField, Button, Box } from "@mui/material";
import PersonAddIcon from "@mui/icons-material/PersonAdd";

interface NewTaskProps {
  onAdd: (inspector: { name: string; pubkey: string; address: string }) => void;
}

const NewInspector: React.FC<NewTaskProps> = ({ onAdd }) => {
  const [name, setName] = useState("");
  const [pubkey, setpubkey] = useState("");
  const [address, setaddress] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onAdd({ name, pubkey, address });
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ m: 8 }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        <TextField
          id="name"
          label="Name : "
          variant="standard"
          sx={{
            color: "ash",
            bgcolor: "rgba(255, 255, 255, 0.1)",
            borderBlockEndStyle: "dashed",
          }}
          InputProps={{ style: { color: "white" } }}
          InputLabelProps={{ style: { color: "white" } }}
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          margin="normal"
          required
        />
      </div>

      <div style={{ display: "flex", alignItems: "center" }}>
        <TextField
          id="pubkey"
          label="Public Key : "
          variant="standard"
          sx={{ color: "ash", bgcolor: "rgba(255, 255, 255, 0.1)" }}
          InputProps={{ style: { color: "white" } }}
          InputLabelProps={{ style: { color: "white" } }}
          value={pubkey}
          onChange={(e) => setpubkey(e.target.value)}
          fullWidth
          margin="normal"
          required
        />
      </div>

      <div style={{ display: "flex", alignItems: "center" }}>
        <TextField
          id="address"
          label="Physical Address : "
          variant="standard"
          sx={{ color: "ash", bgcolor: "rgba(255, 255, 255, 0.1)" }}
          InputProps={{ style: { color: "white" } }}
          InputLabelProps={{ style: { color: "white" } }}
          value={address}
          onChange={(e) => setaddress(e.target.value)}
          fullWidth
          margin="normal"
          required
        />
      </div>
      <Button
        type="submit"
        variant="contained"
        startIcon={<PersonAddIcon />}
        sx={{ mt: 2, color: "ash", bgcolor: "rgba(255, 255, 255, 0.4)" }}>
        Add Land Inspector
      </Button>
    </Box>
  );
};

export default NewInspector;
