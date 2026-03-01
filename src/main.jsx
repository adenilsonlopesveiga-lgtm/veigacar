import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./contexts/AuthContext";
import { EmpresaProvider } from "./contexts/EmpresaContext";
import { GpsProvider } from "./contexts/GpsContext";
import "leaflet/dist/leaflet.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <EmpresaProvider>
          <GpsProvider>
            <App />
          </GpsProvider>
        </EmpresaProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
