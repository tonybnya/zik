import { BrowserRouter, Route, Routes } from "react-router-dom";

import { FavoritesPage } from "./pages/FavoritesPage";
import { LandingPage } from "./pages/LandingPage";
import { NotFoundPage } from "./pages/NotFoundPage";

/**
 * Top-level route table. Phase 12 owns the shell; Phase 11 adds the
 * favorites surface.
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
