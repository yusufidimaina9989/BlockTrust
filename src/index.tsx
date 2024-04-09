import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { Scrypt, bsv } from 'scrypt-ts';

import { Market } from "./contracts/market";
import artifact from "../artifacts/market.json";
import { Register } from "./contracts/inscription";
import artifact1 from "../artifacts/inscription.json";
import { ManageInspectors } from './contracts/manageInspectors';
import artifact2 from '../artifacts/manageInspectors.json';

Market.loadArtifact(artifact);
Register.loadArtifact(artifact1);
ManageInspectors.loadArtifact(artifact2)

Scrypt.init({
  // https://docs.scrypt.io/advanced/how-to-integrate-scrypt-service#get-your-api-key
  apiKey: process.env.REACT_APP_API_KEY || '',
  network: bsv.Networks.testnet
})
const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
