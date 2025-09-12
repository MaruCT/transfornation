import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { View, type User } from '../types';
import { UserCircleIcon, LogOutIcon, MenuIcon, XIcon, GlobeIcon } from './Icons';
import LogoNew from '/Logo_New.png';
import { useLanguage } from '../contexts/LanguageContext';

interface HeaderProps {
  setView: (view: View) => void;
  currentUser: User | null;
  onLogin: () => void;
  onLogout: () => void;
}

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'ru', name: 'Русский' },
  { code: 'zh', name: '中文' },
];

const Header: React.FC<HeaderProps> = ({ setView, currentUser, onLogin, onLogout }) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const { t, setLanguage, language } = useLanguage();

  const handleNav = (view: View) => {
    setView(view);
    setIsMobileMenuOpen(false);
  };

  const mobileMenuVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.07, delayChildren: 0.2 } },
    exit: { opacity: 0, y: -20 }
  };
  
  const mobileLinkVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <>
      <header className="bg-transparent backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div 
              className="flex items-center cursor-pointer group"
              onClick={() => handleNav(View.Landing)}
              aria-label="Go to homepage"
            >
              <img
                src={LogoNew}
                alt="Transfornation"
                className="h-10 md:h-12 w-auto transition-all duration-300 group-hover:scale-110"
              />
            </div>
            <div className="flex items-center">
              <nav className="hidden md:flex space-x-8 items-center">
                <button 
                  onClick={() => handleNav(View.Home)}
                  className="font-medium text-gray-300 hover:text-white transition-colors"
                >
                  {t('header.discover')}
                </button>
                 <button 
                  onClick={() => handleNav(View.Contest)}
                  className="font-medium text-gray-300 hover:text-white transition-colors"
                >
                  {t('header.contest')}
                </button>
                <button
                  onClick={() => handleNav(View.CreateProject)}
                  disabled={!currentUser}
                  className="font-medium text-gray-300 hover:text-white transition-colors disabled:text-gray-600 disabled:cursor-not-allowed"
                >
                  {t('header.create')}
                </button>
              </nav>

              <div className="flex items-center ml-4">
                 {/* Language Selector */}
                <div className="relative">
                  <button onClick={() => setIsLangMenuOpen(!isLangMenuOpen)} className="p-2 rounded-full text-gray-300 hover:bg-white/10 hover:text-white">
                     <GlobeIcon className="h-5 w-5" />
                  </button>
                   <AnimatePresence>
                      {isLangMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute right-0 mt-2 w-36 bg-[#001641]/80 backdrop-blur-lg border border-white/20 rounded-lg shadow-xl overflow-hidden"
                        >
                          <ul className="py-1">
                            {LANGUAGES.map(lang => (
                               <li key={lang.code}>
                                  <button 
                                      onClick={() => { setLanguage(lang.code as any); setIsLangMenuOpen(false); }} 
                                      className={`w-full text-left px-4 py-2 text-sm ${language === lang.code ? 'text-[#0057FF] font-bold' : 'text-gray-300 hover:bg-white/10'}`}
                                  >
                                    {lang.name}
                                  </button>
                               </li>
                            ))}
                          </ul>
                        </motion.div>
                      )}
                   </AnimatePresence>
                </div>

                {/* User Menu / Login */}
                <div className="flex items-center ml-2">
                {currentUser ? (
                  <div className="relative">
                    <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="block transition-transform duration-300 hover:scale-110">
                      <img className="h-10 w-10 rounded-full ring-2 ring-white/20" src={currentUser.avatar} alt={currentUser.name} />
                    </button>
                    <AnimatePresence>
                      {isUserMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute right-0 mt-2 w-48 bg-[#001641]/80 backdrop-blur-lg border border-white/20 rounded-lg shadow-xl overflow-hidden"
                        >
                          <div className="px-4 py-3 border-b border-white/10">
                              <p className="text-sm text-gray-400">{t('header.signedInAs')}</p>
                              <p className="text-sm font-medium text-white truncate">{currentUser.name}</p>
                          </div>
                          <div className="py-1">
                            <button onClick={() => { handleNav(View.Profile); setIsUserMenuOpen(false); }} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-white/10">
                              <UserCircleIcon className="h-5 w-5 mr-2" /> {t('header.myHub')}
                            </button>
                            <button onClick={() => { onLogout(); setIsUserMenuOpen(false); }} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-white/10">
                              <LogOutIcon className="h-5 w-5 mr-2" /> {t('header.logout')}
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <button
                    onClick={onLogin}
                    className="hidden md:inline-flex relative items-center justify-center px-6 py-2.5 border border-transparent text-sm font-semibold rounded-full text-white bg-gradient-to-r from-[#0057FF] to-[#004AD8] hover:from-[#0057FF] hover:to-[#004AD8] shadow-lg shadow-[#0057FF]/30 hover:shadow-[#0057FF]/40 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-[#0057FF]/50"
                  >
                    <span className="relative">{t('header.login')}</span>
                  </button>
                )}
                </div>

                {/* Mobile Menu Button */}
                <div className="md:hidden ml-2">
                    <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 rounded-full text-gray-300 hover:bg-white/10 hover:text-white">
                        {isMobileMenuOpen ? <XIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
                    </button>
                </div>

              </div>
            </div>
          </div>
        </div>
      </header>

       {/* Mobile Menu */}
      <AnimatePresence>
          {isMobileMenuOpen && (
              <motion.div
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={mobileMenuVariants}
                className="fixed inset-0 z-40 bg-[#00091B]/95 backdrop-blur-lg pt-20 md:hidden"
              >
                  <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center text-center space-y-6">
                      <motion.button variants={mobileLinkVariants} onClick={() => handleNav(View.Home)} className="text-2xl font-bold text-gray-300 hover:text-white">{t('header.discover')}</motion.button>
                      <motion.button variants={mobileLinkVariants} onClick={() => handleNav(View.Contest)} className="text-2xl font-bold text-gray-300 hover:text-white">{t('header.contest')}</motion.button>
                      <motion.button variants={mobileLinkVariants} onClick={() => handleNav(View.CreateProject)} disabled={!currentUser} className="text-2xl font-bold text-gray-300 hover:text-white disabled:text-gray-600">{t('header.create')}</motion.button>
                      
                      {!currentUser && (
                        <motion.div variants={mobileLinkVariants} className="pt-6">
                           <button
                              onClick={() => { onLogin(); setIsMobileMenuOpen(false); }}
                              className="relative inline-flex items-center justify-center px-8 py-3 border border-transparent text-lg font-semibold rounded-full text-white bg-gradient-to-r from-[#0057FF] to-[#004AD8]"
                            >
                              <span className="relative">{t('header.login')}</span>
                            </button>
                        </motion.div>
                      )}
                  </div>
              </motion.div>
          )}
      </AnimatePresence>
    </>
  );
};

export default Header;