import React, { useState, useEffect } from 'react';
import { Menu, X, ChevronRight, Linkedin, ChevronDown, HelpCircle, Eraser, Sparkles, Check } from 'lucide-react';

interface Props {
  onLogoClick?: () => void;
}

export const Header: React.FC<Props> = ({ onLogoClick }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [isFAQOpen, setIsFAQOpen] = useState(false);

  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [openFAQIndex, setOpenFAQIndex] = useState<number | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (isMenuOpen || isAboutOpen || isPricingOpen || isFAQOpen) {
        setIsVisible(true);
        return;
      }
      if (currentScrollY < 10) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, isMenuOpen, isAboutOpen, isPricingOpen, isFAQOpen]);

  useEffect(() => {
    if (isMenuOpen || isAboutOpen || isPricingOpen || isFAQOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMenuOpen, isAboutOpen, isPricingOpen, isFAQOpen]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onLogoClick) {
      onLogoClick();
      setIsMenuOpen(false);
      setIsAboutOpen(false);
      setIsPricingOpen(false);
      setIsFAQOpen(false);
    }
  };

  const handleAboutClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsAboutOpen(true);
    setIsPricingOpen(false);
    setIsFAQOpen(false);
    setIsMenuOpen(false);
  };

  const handlePricingClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsPricingOpen(true);
    setIsAboutOpen(false);
    setIsFAQOpen(false);
    setIsMenuOpen(false);
  };

  const handleFAQClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsFAQOpen(true);
    setIsPricingOpen(false);
    setIsAboutOpen(false);
    setIsMenuOpen(false);
  };

  const toggleFAQ = (index: number) => {
    setOpenFAQIndex(openFAQIndex === index ? null : index);
  };

  const faqItems = [
    { q: "Is this actually free?", a: "Yes, for now I've made this app available with my own processing limits." },
    { q: "What watermarks does this remove?", a: "Only for Google Gemini (Nano Banana pro) watermarks." },
    { q: "Will it remove watermarks from all images?", a: "No, it is optimised only for ✦ Gemini watermarks." },
    { q: "Is my data safe?", a: "Yes, images are processed in your browser session and through the API. We do not store them." },
    { q: "Support?", a: "You can contact me on:" }
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 px-6 md:px-12 py-6 md:py-8 flex justify-between items-center bg-[#F7F6F3]/80 backdrop-blur-md z-[2000] transition-transform duration-500 ease-in-out border-b border-black/5 ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}
      >
        <div
          className="flex items-center gap-3 cursor-pointer z-[3005] group"
          onClick={handleLogoClick}
          role="button"
          aria-label="Home"
        >
          <div className="w-9 h-9 bg-black rounded-[10px] flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
            <Eraser className="w-5 h-5 text-white stroke-[2.5px]" />
          </div>
          <span className="font-bold text-[22px] tracking-tight text-black">NanoErase</span>
        </div>

        <nav className="hidden md:flex items-center gap-12 text-[15px] font-medium text-gray-700">
          <a href="#" onClick={handlePricingClick} className="hover:text-black transition-colors">Pricing</a>
          <a href="#" onClick={handleFAQClick} className="hover:text-black transition-colors">FAQ</a>
          <a href="#" onClick={handleAboutClick} className="hover:text-black transition-colors">About</a>
        </nav>

        <button
          className="md:hidden p-2.5 z-[3005] bg-white rounded-full shadow-md border border-black/5 active:scale-90 transition-transform"
          onClick={toggleMenu}
        >
          {isMenuOpen ? <X className="w-6 h-6 text-black" /> : <Menu className="w-6 h-6 text-black" />}
        </button>
      </header>

      <div
        className={`fixed inset-0 z-[1900] flex flex-col pt-32 px-10 transition-all duration-500 md:hidden bg-[#F7F6F3] ${isMenuOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}
      >
        <div className="flex flex-col gap-10 h-full overflow-y-auto pb-10">
          <a href="#" onClick={handlePricingClick} className="text-3xl font-black border-b border-black/5 pb-6 flex justify-between items-center text-black">
            Pricing <ChevronRight className="w-6 h-6 text-gray-300" />
          </a>
          <a href="#" onClick={handleFAQClick} className="text-3xl font-black border-b border-black/5 pb-6 flex justify-between items-center text-black">
            FAQ <ChevronRight className="w-6 h-6 text-gray-300" />
          </a>
          <a href="#" onClick={handleAboutClick} className="text-3xl font-black border-b border-black/5 pb-6 flex justify-between items-center text-black">
            About <ChevronRight className="w-6 h-6 text-gray-300" />
          </a>
        </div>
      </div>

      {isPricingOpen && (
        <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={() => setIsPricingOpen(false)}></div>
          <div className="relative bg-white rounded-[32px] p-6 md:p-10 max-w-lg w-full shadow-2xl overflow-y-auto max-h-[90vh] border border-white/50">
            <button onClick={() => setIsPricingOpen(false)} className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 transition-colors z-10">
              <X className="w-6 h-6 text-gray-500" />
            </button>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black text-black mb-2 tracking-tight">Simple Pricing</h2>
              <p className="text-gray-500 font-medium">Enjoy unlimited clean images.</p>
            </div>
            <div className="bg-[#F7F6F3] rounded-[24px] p-8 border border-black/5 relative overflow-hidden group hover:shadow-lg transition-all duration-300">
              <h3 className="text-xl font-black text-black mb-2">Student Budget Plan</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-5xl font-black text-black">₹0</span>
              </div>
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-700 mt-0.5" />
                  <span className="font-medium text-gray-700 leading-tight">Bulk Gemini watermark removal</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-700 mt-0.5" />
                  <span className="font-medium text-gray-700 leading-tight">One-click usage</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-700 mt-0.5" />
                  <span className="font-medium text-gray-700 leading-tight">Zero ads begging you to upgrade</span>
                </div>
              </div>
              <p className="text-sm text-gray-500 font-medium mb-6 text-center">Enjoy it FREE while my API credits are alive 🕯️</p>
              <button onClick={() => setIsPricingOpen(false)} className="w-full py-4 bg-black text-white rounded-xl font-bold hover:scale-[1.02] transition-all">Start Now</button>
            </div>
          </div>
        </div>
      )}

      {isFAQOpen && (
        <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={() => setIsFAQOpen(false)}></div>
          <div className="relative bg-white rounded-[32px] p-8 md:p-10 max-w-lg w-full shadow-2xl overflow-y-auto max-h-[90vh] border border-white/50">
            <button onClick={() => setIsFAQOpen(false)} className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 transition-colors z-10">
              <X className="w-6 h-6 text-gray-500" />
            </button>
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-black text-black mb-2 flex items-center justify-center gap-3">
                <HelpCircle className="w-8 h-8 text-black" /> FAQ
              </h2>
            </div>
            <div className="flex flex-col gap-2">
              {faqItems.map((item, idx) => (
                <div key={idx} className="border-b border-gray-100 last:border-0">
                  <button onClick={() => toggleFAQ(idx)} className="w-full text-left py-4 flex justify-between items-center group">
                    <span className="font-bold text-[16px] md:text-[17px] text-gray-600 group-hover:text-black">{item.q}</span>
                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${openFAQIndex === idx ? 'rotate-180 text-black' : ''}`} />
                  </button>
                  {openFAQIndex === idx && (
                    <div className="pb-4 text-gray-500 font-medium text-sm">
                      {item.a}
                      {idx === 4 && (
                        <div className="mt-3">
                          <a href="https://linkedin.com/in/suryakant17155/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0077b5] text-white rounded-lg font-bold text-sm">
                            <Linkedin className="w-4 h-4 fill-white" /> Connect on LinkedIn
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {isAboutOpen && (
        <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={() => setIsAboutOpen(false)}></div>
          <div className="relative bg-white rounded-[32px] p-8 md:p-10 max-w-2xl w-full shadow-2xl overflow-y-auto max-h-[90vh] border border-white/50">
            <button onClick={() => setIsAboutOpen(false)} className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 transition-colors z-10">
              <X className="w-6 h-6 text-gray-500" />
            </button>
            <div className="prose prose-lg max-w-none text-gray-600">
              <h2 className="text-3xl font-black text-black mb-4">You don't like watermarks, right?</h2>
              <p className="mb-4 font-medium">That's why you're here. Congratulations, you clicked correctly.</p>
              <p className="mb-4">Every time I create an image with Google Gemini, that bloody star-shaped watermark ⭐ shows up and ruins an otherwise perfect image. Like bro, I made this, not you.</p>
              <p className="mb-2 font-semibold text-black">So I did what every Indian student does.</p>
              <p className="mb-4">I Googled: <em>"FREE watermark remover"</em>.</p>
              <p className="mb-1 font-semibold text-black">Free?</p>
              <p className="mb-4">Nothing is free. Ever.</p>
              <p className="mb-3">Most tools either:</p>
              <ul className="list-disc list-inside mb-4 space-y-1 text-gray-600">
                <li>Put limits on the free plan</li>
                <li>Don't support bulk removal</li>
                <li>Or suddenly ask for money like it was always the plan 💸</li>
              </ul>
              <p className="mb-4">If you're a student, freelancer, or content creator using Gemini to generate lots of images, you already know the pain. Bulk images + watermark = no truly free solution.</p>
              <p className="mb-2 font-semibold text-black text-lg">So I built one.</p>
              <ul className="list-none mb-4 space-y-1">
                <li>✅ Completely free (for now)</li>
                <li>✅ One-click bulk watermark removal</li>
                <li>✅ Optimized only for Gemini watermarks</li>
                <li>✅ No login. No subscription. No nonsense.</li>
              </ul>
              <p className="mb-4">This tool will stay free until my API free limits are over. If it stops working due to high usage, I'll update it here instead of pretending nothing happened. Transparency is rare. Enjoy it.</p>
              <p className="font-semibold text-black">Until then, it's all yours. Use it well 🫡</p>
              <div className="flex flex-col items-center gap-4 border-t border-gray-100 pt-6 mt-8">
                <span className="font-bold text-gray-400 text-sm tracking-wide uppercase">Created by Surya Kant</span>
                <a href="https://linkedin.com/in/suryakant17155/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-6 py-3 bg-[#0077b5] text-white rounded-full font-bold text-sm shadow-lg">
                  <Linkedin className="w-4 h-4 fill-white" /> Let's Connect
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="h-[88px] md:h-[104px]"></div>
    </>
  );
};
