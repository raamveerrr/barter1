import { motion } from 'framer-motion';

export default function SplashScreen() {
  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-gradient-to-b from-gray-900 via-gray-900 to-black"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-600/30 via-fuchsia-500/20 to-transparent" />

      {/* Coin animation: start bottom center, flip up, settle center */}
      <div className="flex flex-col items-center">
        <motion.div
          style={{ perspective: 1000 }}
          className="will-change-transform"
          initial={{ y: 200, opacity: 0.95 }}
          animate={{ y: [200, -90, 0], opacity: 1 }}
          transition={{ duration: 1.0, times: [0, 0.5, 1], ease: ['easeOut', 'easeInOut', 'easeOut'] }}
        >
          {/* 3D coin with two faces to avoid disappearing at 90deg */}
          <motion.div
            className="relative h-28 w-28 transform-gpu"
            style={{ transformStyle: 'preserve-3d' }}
            initial={{ rotateY: 0, scale: 0.94 }}
            animate={{ rotateY: [0, 720, 1440], scale: [0.94, 1.04, 1] }}
            transition={{ duration: 1.0, times: [0, 0.5, 1], ease: ['easeOut', 'easeInOut', 'easeOut'] }}
          >
            <img
              src={import.meta.env.BASE_URL + 'coin.png'}
              alt="Coin front"
              className="absolute inset-0 h-full w-full drop-shadow-[0_0_40px_rgba(251,191,36,0.45)]"
              style={{ backfaceVisibility: 'hidden' }}
            />
            <img
              src={import.meta.env.BASE_URL + 'coin.png'}
              alt="Coin back"
              className="absolute inset-0 h-full w-full drop-shadow-[0_0_40px_rgba(251,191,36,0.45)]"
              style={{ transform: 'rotateY(180deg)', backfaceVisibility: 'hidden' }}
            />
          </motion.div>
        </motion.div>

        {/* Tagline centered below coin */}
        <motion.div
          className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-fuchsia-300 to-amber-300"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut', delay: 0.45 }}
        >
          Trade On
        </motion.div>
      </div>
    </motion.div>
  );
}


