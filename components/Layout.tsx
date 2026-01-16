import React, { useState, useEffect } from 'react';
import { BookOpen, Search, BarChart2, Settings, UploadCloud, X, Quote, Star } from 'lucide-react';
import { QUOTES } from '../constants';

interface LayoutProps {
  children: React.ReactNode;
  activeView: string;
  onChangeView: (view: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeView, onChangeView }) => {
  const [showFeatureTip, setShowFeatureTip] = useState(false);
  const [currentQuote, setCurrentQuote] = useState<{text: string, author: string} | null>(null);
  const [quoteVisible, setQuoteVisible] = useState(true);

  useEffect(() => {
    const isDismissed = localStorage.getItem('wordmaster_pro_tip_dismissed');
    if (!isDismissed) {
      setShowFeatureTip(true);
    } else {
      // Pick a random quote if the main tip is already dismissed
      const randomQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
      setCurrentQuote(randomQuote);
    }
  }, []);

  const handleDismissTip = () => {
    setShowFeatureTip(false);
    localStorage.setItem('wordmaster_pro_tip_dismissed', 'true');
    // Immediately switch to a quote
    const randomQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    setCurrentQuote(randomQuote);
  };

  const handleDismissQuote = () => {
    setQuoteVisible(false);
  };

  const navItems = [
    { id: 'home', label: '概览', icon: BarChart2 },
    { id: 'import', label: '导入文档', icon: UploadCloud },
    { id: 'favorites', label: '收藏本', icon: Star },
    { id: 'library', label: '词库管理', icon: Search },
    { id: 'settings', label: '设置', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-20 lg:w-64 bg-white border-r border-gray-200 flex flex-col justify-between transition-all duration-300">
        <div>
          <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b border-gray-100">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">W</div>
            <span className="ml-3 font-bold text-gray-800 hidden lg:block">WordMaster</span>
          </div>

          <nav className="mt-6 flex flex-col gap-2 px-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onChangeView(item.id)}
                className={`flex items-center p-3 rounded-xl transition-colors duration-200 ${
                  activeView === item.id
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <item.icon className="w-6 h-6" />
                <span className="ml-3 font-medium hidden lg:block">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
        
        {/* Pro Tip or Quote Area */}
        <div className="p-4 border-t border-gray-100 hidden lg:block">
          {showFeatureTip ? (
            <div className="bg-indigo-600 rounded-xl p-4 text-white relative shadow-lg shadow-indigo-200">
              <button 
                onClick={handleDismissTip}
                className="absolute top-2 right-2 text-white/50 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <p className="text-xs opacity-80 uppercase font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse"></span>
                Pro Tip
              </p>
              <p className="text-sm mt-2 font-medium leading-relaxed">导入你感兴趣的英文文章，AI 帮你生成专属词书。</p>
            </div>
          ) : (
            currentQuote && quoteVisible && (
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 relative">
                <button 
                  onClick={handleDismissQuote}
                  className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
                <div className="mb-2 text-indigo-500">
                  <Quote className="w-5 h-5 fill-current opacity-20" />
                </div>
                <p className="text-sm text-gray-600 italic leading-relaxed">"{currentQuote.text}"</p>
                <p className="text-xs text-gray-400 mt-2 font-medium text-right">— {currentQuote.author}</p>
              </div>
            )
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative">
        {children}
      </main>
    </div>
  );
};