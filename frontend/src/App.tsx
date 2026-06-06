import './App.css';
import { motion } from "motion/react";
import { HugeiconsIcon } from '@hugeicons/react';
import { Notification03Icon } from '@hugeicons/core-free-icons';

function App() {
  return (
    <>
      <HugeiconsIcon icon={Notification03Icon} size={24} color="currentColor" strokeWidth={1.5} />

      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}   // Starting state
        animate={{ opacity: 1, scale: 1 }}     // Target animation
        transition={{ duration: 0.5 }}          // Timing setup
      >
        <h1 class="text-3xl font-bold underline">
          Hello world!
        </h1>
      </motion.div>
    </>
  )
}

export default App;
