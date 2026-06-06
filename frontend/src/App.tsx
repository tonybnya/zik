import { BrowserRouter, Route, Routes } from "react-router-dom";

import { LandingPage } from "./pages/LandingPage";
import { NotFoundPage } from "./pages/NotFoundPage";

/**
 * Top-level route table. Phase 12 will add the favorites/preferences routes;
 * for now the app has just the landing page and a 404 catch-all.
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
