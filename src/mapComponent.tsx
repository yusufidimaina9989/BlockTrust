import React, { useEffect, useRef, useState } from "react";
import { Button } from "@mui/material";
import FileCopyIcon from "@mui/icons-material/FileCopy";
import DoneIcon from "@mui/icons-material/Done";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

interface MapComponentProps {
  onLocationSelected?: (coordinates: [number, number]) => void;
}

function MapComponent({ onLocationSelected = () => {} }: MapComponentProps) {
  const mapRef = useRef(null);
  const [selectedCoordinates, setSelectedCoordinates] = useState<
    [number, number] | null
  >(null);
  const [copyIcon, setCopyIcon] = useState(<FileCopyIcon />);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (!mapRef.current) {
      const mapInstance = L.map("map").setView([9.060736, 7.487354], 6);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(
        mapInstance
      );

      mapInstance.on("click", (e) => {
        const coordinates: [number, number] = [e.latlng.lat, e.latlng.lng];
        onLocationSelected(coordinates);
        setSelectedCoordinates(coordinates);
        setIsCopied(false); // Reset isCopied when new coordinates are selected
      });

      mapRef.current = mapInstance; // Store the map instance in the ref
    }
  }, [onLocationSelected]);

  const handleCopyCoordinates = () => {
    if (selectedCoordinates) {
      const formattedCoordinates = formatCoordinates(selectedCoordinates);
      navigator.clipboard
        .writeText(formattedCoordinates)
        .then(() => {
          setCopyIcon(<DoneIcon />);
          setIsCopied(true);
        })
        .catch((error) => {
          console.error("Error copying coordinates:", error);
        });
    }
  };

  function formatCoordinates(coordinates) {
    const latitude = coordinates[0].toFixed(8);
    const longitude = coordinates[1].toFixed(8);
    return `${latitude},${longitude}`;
  }

  return (
    <div>
      <div id="map" style={{ width: "100%", height: "500px" }}></div>
      {selectedCoordinates && (
        <div>
          <p style={{ color: "white" }}>
            {formatCoordinates(selectedCoordinates)}
          </p>
          <Button
            variant="contained"
            color="success"
            onClick={handleCopyCoordinates}
            startIcon={copyIcon}
            disabled={isCopied}>
            {isCopied ? "Copied" : "Copy"}
          </Button>
        </div>
      )}
    </div>
  );
}

export default MapComponent;
