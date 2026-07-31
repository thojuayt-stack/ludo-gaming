import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import {
  migrateLibrarySchema,
  migrateWishlistToLibrary,
  migrateFinishedPlatformToArray,
} from "./lib/library.js";
import "./styles/globals.css";

async function bootstrap() {
  await migrateLibrarySchema();
  await migrateWishlistToLibrary();
  await migrateFinishedPlatformToArray();
  createRoot(document.getElementById("root")).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

bootstrap();
