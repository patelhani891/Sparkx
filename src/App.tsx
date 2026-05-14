import { lazy, Suspense, useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import AuthGuard from "@/components/AuthGuard";
import SplashScreen from "@/components/SplashScreen";
import Auth from "./pages/Auth";

const Index = lazy(() => import("./pages/Index"));
const Poster = lazy(() => import("./pages/Poster"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 5 * 60 * 1000, retry: 1 } },
});

const BlackScreen = () => (
  <div className="fixed inset-0" style={{ background: "#000" }} />
);

const App = () => {
  const [splashDone, setSplashDone] = useState(false);

  return (
    <>
      <div className="fixed inset-0 -z-10" style={{ background: "#111111" }} />

      <AnimatePresence mode="wait">
        {!splashDone ? (
          <motion.div key="splash" className="fixed inset-0 z-50"
            exit={{ opacity: 0 }} transition={{ duration: 0.25, ease: "easeInOut" }}>
            <SplashScreen onComplete={() => setSplashDone(true)} />
          </motion.div>
        ) : (
          <motion.div key="app"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.25, ease: "easeOut" }}>
            <QueryClientProvider client={queryClient}>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <Suspense fallback={<BlackScreen />}>
                    <Routes>
                      <Route path="/auth" element={<Auth />} />
                      <Route path="/" element={<AuthGuard><Index /></AuthGuard>} />
                      <Route path="/poster" element={<Poster />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </BrowserRouter>
              </TooltipProvider>
            </QueryClientProvider>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default App;
