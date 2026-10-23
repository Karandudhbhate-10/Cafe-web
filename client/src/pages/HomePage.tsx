import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, QrCode, Sparkles, Award, ShieldCheck } from 'lucide-react';
import { CoffeeCupScene } from '../components/3d/CoffeeCupScene';
import { Navbar } from '../components/common/Navbar';
import { Footer } from '../components/common/Footer';
import { ProductCard } from '../components/customer/ProductCard';
import { ProductCustomizerModal } from '../components/customer/ProductCustomizerModal';
import { CartDrawer } from '../components/customer/CartDrawer';
import { StickyCartBar } from '../components/customer/StickyCartBar';
import { FloatingCoffeeBeansBackground } from '../components/common/FloatingCoffeeBeansBackground';
import { useCart } from '../context/CartContext';
import { api } from '../services/api';
import { MenuItem } from '../types';

export const HomePage: React.FC = () => {
  const { tableNumber, addItem } = useCart();
  const [featuredItems, setFeaturedItems] = useState<MenuItem[]>([]);
  const [activeCustomizingItem, setActiveCustomizingItem] = useState<MenuItem | null>(null);

  useEffect(() => {
    // Load menu for featured showcase
    api.getMenu().then((res) => {
      const bestsellers = res.items.filter((i) => i.isFeatured || i.isBestseller).slice(0, 6);
      setFeaturedItems(bestsellers.length > 0 ? bestsellers : res.items.slice(0, 6));
    }).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-roast bg-dark-grain text-cream flex flex-col relative selection:bg-caramel selection:text-white overflow-hidden">
      {/* Dynamic Floating Coffee Seeds Parallax Layer for Whole Page */}
      <FloatingCoffeeBeansBackground />

      <Navbar theme="dark" />

      {/* Main Hero Section */}
      <section className="relative pt-28 sm:pt-36 pb-16 sm:pb-24 overflow-hidden z-20">
        {/* Soft atmospheric radial gradient glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] sm:w-[900px] h-[600px] bg-caramel/15 rounded-full blur-[160px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Editorial Headline & Actions */}
            <div className="lg:col-span-7 text-center lg:text-left space-y-6">
              <div className="inline-flex items-center space-x-2 bg-caramel/15 border border-caramel/30 px-4 py-1.5 rounded-full text-xs font-semibold text-caramel-light shadow-warm-sm">
                <Sparkles className="w-3.5 h-3.5 text-caramel" />
                <span>Specialty Micro-Roaster & Table-Side Dining</span>
              </div>

              <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.08]">
                Good Coffee. <br />
                <span className="italic font-normal text-caramel">Better Moments.</span>
              </h1>

              <p className="text-base sm:text-lg text-cream/75 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Slow-roasted single estate Arabica, hand-laminated viennoiserie, and seamless QR ordering from your table. No app downloads or registrations required.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                <Link
                  to="/menu"
                  className="w-full sm:w-auto bg-caramel hover:bg-caramel-dark text-espresso font-bold px-8 py-4 rounded-2xl text-sm tracking-wide shadow-warm-lg shadow-caramel/25 hover:shadow-caramel/40 transition-all flex items-center justify-center space-x-2 group active:scale-98"
                >
                  <QrCode className="w-4 h-4 text-espresso" />
                  <span>Explore Menu & Order</span>
                  <ArrowRight className="w-4 h-4 text-espresso transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-caramel/20 max-w-lg mx-auto lg:mx-0 text-left">
                <div>
                  <div className="font-serif text-xl sm:text-2xl font-bold text-caramel">
                    100%
                  </div>
                  <div className="text-xs text-cream/60">Single Estate Arabica</div>
                </div>
                <div>
                  <div className="font-serif text-xl sm:text-2xl font-bold text-caramel">
                    72-Layer
                  </div>
                  <div className="text-xs text-cream/60">Laminated Pastry</div>
                </div>
                <div>
                  <div className="font-serif text-xl sm:text-2xl font-bold text-caramel">
                    Instant
                  </div>
                  <div className="text-xs text-cream/60">Kitchen Table Sync</div>
                </div>
              </div>
            </div>

            {/* Right Column: 3D Animated Coffee Scene */}
            <div className="lg:col-span-5 relative flex items-center justify-center">
              <div className="relative w-full max-w-[480px]">
                <CoffeeCupScene />

                <div className="text-center mt-2">
                  <span className="text-[11px] text-caramel/70 tracking-wider uppercase font-semibold">
                    Interactive 3D Steam & Roast • Move Cursor to Tilt
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How QR Dining Works Section */}
      <section className="py-20 bg-roast-deep/80 border-y border-caramel/20 backdrop-blur-md relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-caramel">
              Effortless Hospitality
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white mt-1">
              How Table Ordering Works
            </h2>
            <p className="text-sm text-cream/70 mt-2">
              Sit down, scan, and let us take care of the rest.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/[0.04] hover:bg-white/[0.08] backdrop-blur-xl p-7 rounded-3xl border border-caramel/25 hover:border-caramel/50 transition-all duration-300 shadow-warm-lg space-y-4 group">
              <div className="w-12 h-12 rounded-2xl bg-caramel/20 border border-caramel/40 text-caramel-light flex items-center justify-center font-serif text-xl font-bold shadow-warm-sm">
                1
              </div>
              <h3 className="font-serif text-xl font-bold text-white group-hover:text-caramel-light transition-colors">
                Scan Café Master QR
              </h3>
              <p className="text-xs sm:text-sm text-cream/70 leading-relaxed">
                Scan the café QR stand with your phone's camera to browse our fresh artisanal menu and enter your table number at checkout.
              </p>
              <Link
                to="/menu"
                className="inline-flex items-center space-x-1.5 text-xs font-bold text-caramel-light hover:text-white pt-1 transition-colors"
              >
                <span>Browse Menu Online &rarr;</span>
              </Link>
            </div>

            <div className="bg-white/[0.04] hover:bg-white/[0.08] backdrop-blur-xl p-7 rounded-3xl border border-caramel/25 hover:border-caramel/50 transition-all duration-300 shadow-warm-lg space-y-4 group">
              <div className="w-12 h-12 rounded-2xl bg-caramel text-espresso flex items-center justify-center font-serif text-xl font-bold shadow-warm-sm">
                2
              </div>
              <h3 className="font-serif text-xl font-bold text-white group-hover:text-caramel-light transition-colors">
                Customize & Order
              </h3>
              <p className="text-xs sm:text-sm text-cream/70 leading-relaxed">
                Select your milk preference, espresso intensity, and add special instructions. Your order streams in real time straight to our barista screen.
              </p>
            </div>

            <div className="bg-white/[0.04] hover:bg-white/[0.08] backdrop-blur-xl p-7 rounded-3xl border border-caramel/25 hover:border-caramel/50 transition-all duration-300 shadow-warm-lg space-y-4 group">
              <div className="w-12 h-12 rounded-2xl bg-sage/30 border border-sage/40 text-sage-light flex items-center justify-center font-serif text-xl font-bold shadow-warm-sm">
                3
              </div>
              <h3 className="font-serif text-xl font-bold text-white group-hover:text-caramel-light transition-colors">
                Served To Your Table
              </h3>
              <p className="text-xs sm:text-sm text-cream/70 leading-relaxed">
                Track preparation progress on your phone in real time. We bring freshly brewed cups and warm food directly to your table. Pay at the counter when you're ready.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Menu Items Showcase */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-12 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-caramel">
              House Favorites
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white mt-1">
              Popular Brews & Bites
            </h2>
          </div>
          <Link
            to="/menu"
            className="text-xs font-bold text-caramel hover:text-caramel-light flex items-center space-x-1 underline-offset-4 hover:underline"
          >
            <span>Browse Full Menu</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {featuredItems.map((item) => (
            <ProductCard
              key={item._id}
              item={item}
              onOpenCustomizer={(itemToCustomize) => setActiveCustomizingItem(itemToCustomize)}
              onQuickAdd={(itemToAdd) => addItem(itemToAdd, [], 1)}
            />
          ))}
        </div>
      </section>



      <Footer />

      {/* Modals & Overlays */}
      <ProductCustomizerModal
        item={activeCustomizingItem}
        onClose={() => setActiveCustomizingItem(null)}
      />
      <CartDrawer />
      <StickyCartBar />
    </div>
  );
};
