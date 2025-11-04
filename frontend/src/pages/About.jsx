import { motion } from 'framer-motion';
import { FaLightbulb, FaRocket, FaCoins } from 'react-icons/fa';

export default function About() {
  return (
    <div className="max-w-4xl mx-auto text-white py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-amber-300">
          About TradeHub
        </h1>
        <p className="text-xl text-gray-300 mt-4">
          A revolutionary marketplace designed to solve real-world problems with innovative thinking
        </p>
      </motion.div>

      <div className="space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-lg bg-gray-800/60 backdrop-blur ring-1 ring-white/10 p-8"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center flex-shrink-0">
              <FaLightbulb className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-3">Our Vision</h2>
              <p className="text-gray-300 leading-relaxed">
                TradeHub creates a more efficient, transparent, and rewarding trading experience. 
                We leverage cutting-edge technology to revolutionize campus marketplaces and peer-to-peer commerce.
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-lg bg-gray-800/60 backdrop-blur ring-1 ring-white/10 p-8"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-600 flex items-center justify-center flex-shrink-0">
              <FaCoins className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-3">Coin Reward System</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                Our innovative reward system incentivizes active participation:
              </p>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-indigo-400">✓</span>
                  <span><strong className="text-white">100 Coins</strong> - Welcome bonus for new users</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-400">✓</span>
                  <span><strong className="text-white">25 Coins</strong> - For posting your first item</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-400">✓</span>
                  <span><strong className="text-white">150 Coins</strong> - Bonus for your first sale</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-400">✓</span>
                  <span><strong className="text-white">200 Coins</strong> - Referral rewards for both you and your friend</span>
                </li>
              </ul>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-lg bg-gray-800/60 backdrop-blur ring-1 ring-white/10 p-8"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-fuchsia-500 to-pink-600 flex items-center justify-center flex-shrink-0">
              <FaRocket className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-3">Future Innovation</h2>
              <p className="text-gray-300 leading-relaxed">
                TradeHub is constantly exploring new ways to solve real-world problems with innovative thinking. 
                Our roadmap includes advanced features and expansion into new markets.
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-12 pt-8 border-t border-white/10 text-center"
      >
        <p className="text-gray-400 mb-2">Founded by Ramveer Choudhary</p>
        <p className="text-gray-500 text-sm">© 2025 TradeHub. All rights reserved.</p>
      </motion.div>
    </div>
  );
}
