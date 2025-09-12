import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckIcon, DiamondIcon } from './Icons';
import { useLanguage } from '../contexts/LanguageContext';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectTitle: string;
  pledgeAmount: number;
  isFounder: boolean;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);
};

const SuccessModal: React.FC<SuccessModalProps> = ({ isOpen, onClose, projectTitle, pledgeAmount, isFounder }) => {
  const { t } = useLanguage();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] overflow-y-auto p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, y: 50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, y: 50, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="bg-[#001641]/80 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-auto text-center flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {isFounder ? (
              <>
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg shadow-yellow-400/30 mb-6">
                  <DiamondIcon className="h-14 w-14 text-white" strokeWidth={2} />
                </div>
                <h2 className="text-3xl font-extrabold text-white text-glow">{t('successModal.founderTitle')}</h2>
                <p className="mt-2 text-gray-300">
                  {t('successModal.founderDesc', { projectTitle: `"${projectTitle}"`, amount: formatCurrency(pledgeAmount) })}
                </p>
                <p className="mt-2 text-yellow-200/80 text-sm">{t('successModal.founderSub')}</p>
              </>
            ) : (
              <>
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-[#0057FF] to-[#3385FF] flex items-center justify-center shadow-lg shadow-[#0057FF]/30 mb-6">
                  <CheckIcon className="h-16 w-16 text-white" strokeWidth={3} />
                </div>
                <h2 className="text-3xl font-extrabold text-white text-glow">{t('successModal.successTitle')}</h2>
                <p className="mt-2 text-gray-300">
                  {t('successModal.successDesc', { amount: formatCurrency(pledgeAmount), projectTitle: `"${projectTitle}"` })}
                </p>
                <p className="mt-2 text-gray-400 text-sm">{t('successModal.successSub')}</p>
              </>
            )}
            <button
              onClick={onClose}
              className="mt-8 w-full px-6 py-3 text-base font-semibold text-white bg-white/10 rounded-full hover:bg-white/20 border border-white/10 transition-colors"
            >
              {t('successModal.button')}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SuccessModal;