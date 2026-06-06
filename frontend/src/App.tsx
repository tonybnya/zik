import { lazy, Suspense } from "react";
import { AnimatePresence } from "motion/react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";

import { PageSkeleton, PageTransition } from "./components/PageTransition";

// Code-split pages (Task 12.4). Each page ships in its own chunk; the
// `PageSkeleton` shows while a chunk resolves on first navigation.
const LandingPage = lazy(() => import("./pages/LandingPage").then((m) => ({ default: m.LandingPage })));
const FavoritesPage = lazy(() =>
  import("./pages/FavoritesPage").then((m) => ({ default: m.FavoritesPage })),
);
const NotFoundPage = lazy(() =>
  import("./pages/NotFoundPage").then((m) => ({ default: m.NotFoundPage })),
);

/**
 * Animated router shell (Tasks 12.3 + 12.4). Wraps the route table in:
 *   - Suspense: shows a PageSkeleton while a lazy page chunk resolves.
 *   - AnimatePresence (mode="wait"): chains exit/enter transitions between
 *     routes keyed by pathname. Each page wraps itself in <PageTransition>.
 */
function AnimatedRoutes() {
  const location = useLocation();
  return (
    <Suspense fallback={<PageSkeleton />}>
      <AnimatePresence mode="wait" initial={false}>
        <Routes location={location} key={location.pathname}>
          <Route
            path="/"
            element={
              <PageTransition>
                <LandingPage />
              </PageTransition>
            }
          />
          <Route
            path="/favorites"
            element={
              <PageTransition>
                <FavoritesPage />
              </PageTransition>
            }
          />
          <Route
            path="*"
            element={
              <PageTransition>
                <NotFoundPage />
              </PageTransition>
            }
          />
        </Routes>
      </AnimatePresence>
    </Suspense>
  );
}

/**
 * Top-level app. BrowserRouter + AnimatedRoutes gives the SPA shell:
 * animated page transitions, lazy page chunks, and the 404 catch-all.
 */
function App() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  );
}

export default App;
