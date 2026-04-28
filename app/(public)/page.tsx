'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Playfair_Display, DM_Sans } from 'next/font/google';
import { useEffect, useState } from 'react';

const playfair = Playfair_Display({ subsets: ['latin'], weight: ['400', '700'] });
const dmSans = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '700'] });

const NAVY = '#0A0E1A';
const TEAL = '#00D4B8';
const GOLD = '#F4A922';

function AnimatedCounter({ value, prefix = '' }: { value: number, prefix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 2000;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3); // cubic ease out
      
      setCount(Math.floor(ease * value));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(value);
      }
    };
    
    requestAnimationFrame(animate);
  }, [value]);

  return <span>{prefix}{count.toLocaleString()}</span>;
}

export default function PublicHomePage() {
  const [charities, setCharities] = useState<any[]>([]);
  const [drawResults, setDrawResults] = useState<any[]>([]);
  
  useEffect(() => {
    // Fetch featured charities
    fetch('/api/charities').then(res => res.json()).then(data => {
      setCharities(data.filter((c: any) => c.is_featured).slice(0, 4));
    });
    
    // Fetch last 3 draws
    fetch('/api/draws/results').then(res => res.json()).then(data => {
      if(Array.isArray(data)) setDrawResults(data);
    });
  }, []);

  const sectionVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

  return (
    <div className={`min-h-screen bg-[${NAVY}] text-white ${dmSans.className}`} style={{ backgroundColor: NAVY }}>
      
      {/* 1. HERO SECTION */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 pb-20 px-4">
        {/* Animated Background Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00D4B8] rounded-full mix-blend-screen filter blur-[128px] opacity-20 animate-blob" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-[#F4A922] rounded-full mix-blend-screen filter blur-[128px] opacity-20 animate-blob animation-delay-2000" />
        
        <motion.div 
          initial="hidden" 
          whileInView="visible" 
          viewport={{ once: true }}
          variants={sectionVariants}
          className="relative z-10 max-w-5xl mx-auto text-center"
        >
          <h1 className={`text-5xl md:text-7xl font-bold mb-6 leading-tight ${playfair.className}`}>
            Play Golf. <span style={{ color: GOLD }}>Win Prizes.</span> <br/>
            Change Lives.
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-3xl mx-auto font-light leading-relaxed">
            The exclusive subscription club where your real-world golf scores enter you into monthly prize draws, all while generating vital funds for the charities you care about.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link 
              href="/signup" 
              className="px-8 py-4 rounded-full text-lg font-bold transition transform hover:scale-105 shadow-[0_0_20px_rgba(0,212,184,0.4)]"
              style={{ backgroundColor: TEAL, color: NAVY }}
            >
              Start Subscription
            </Link>
            <Link 
              href="#how-it-works" 
              className="px-8 py-4 rounded-full text-lg font-bold border-2 transition hover:bg-white/10"
              style={{ borderColor: TEAL, color: TEAL }}
            >
              How It Works
            </Link>
          </div>
        </motion.div>
      </section>

      {/* 2. HOW IT WORKS */}
      <section id="how-it-works" className="py-24 px-4 bg-black/20">
        <motion.div 
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={sectionVariants}
          className="max-w-6xl mx-auto"
        >
          <div className="text-center mb-16">
            <h2 className={`text-4xl md:text-5xl font-bold mb-4 ${playfair.className}`}>How It Works</h2>
            <div className="w-24 h-1 mx-auto" style={{ backgroundColor: GOLD }}></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { num: '01', title: 'Subscribe', desc: 'Join the club for €9.99/month. Choose a charity partner to receive your monthly contribution.' },
              { num: '02', title: 'Enter Your Scores', desc: 'Play your regular rounds. Enter up to 5 of your latest Stableford scores on your private dashboard.' },
              { num: '03', title: 'Win & Give', desc: 'Every month we draw 5 numbers. Match them to win massive cash prizes while supporting your charity.' }
            ].map((step, i) => (
              <div key={i} className="relative p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition">
                <div className="absolute -top-6 -left-6 text-7xl font-bold opacity-10" style={{ color: TEAL }}>{step.num}</div>
                <h3 className={`text-2xl font-bold mb-4 mt-4 ${playfair.className}`}>{step.title}</h3>
                <p className="text-gray-300 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* 3. PRIZE POOLS */}
      <section className="py-24 px-4 relative">
        <motion.div 
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={sectionVariants}
          className="max-w-6xl mx-auto"
        >
          <div className="text-center mb-16">
            <h2 className={`text-4xl md:text-5xl font-bold mb-4 ${playfair.className}`}>Monthly Prize Tiers</h2>
            <p className="text-gray-400 text-lg">The more subscribers, the bigger the pool.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl border-2 text-center transform md:-translate-y-4 shadow-2xl bg-gradient-to-b from-white/10 to-transparent" style={{ borderColor: GOLD }}>
              <h3 className={`text-2xl font-bold mb-2 ${playfair.className}`} style={{ color: GOLD }}>Jackpot (5-Match)</h3>
              <div className="text-sm uppercase tracking-widest text-gray-400 mb-6">40% of Prize Pool</div>
              <p className="text-5xl font-bold mb-4">
                <AnimatedCounter value={5000} prefix="€" />+
              </p>
              <p className="text-gray-400 text-sm">Rolls over if not won!</p>
            </div>
            
            <div className="p-8 rounded-3xl border border-white/20 text-center bg-white/5">
              <h3 className={`text-2xl font-bold mb-2 ${playfair.className}`}>4-Match</h3>
              <div className="text-sm uppercase tracking-widest text-gray-400 mb-6">35% of Prize Pool</div>
              <p className="text-4xl font-bold mb-4 text-white">
                <AnimatedCounter value={2500} prefix="€" />+
              </p>
              <p className="text-gray-400 text-sm">Shared among all 4-matchers</p>
            </div>

            <div className="p-8 rounded-3xl border border-white/20 text-center bg-white/5">
              <h3 className={`text-2xl font-bold mb-2 ${playfair.className}`}>3-Match</h3>
              <div className="text-sm uppercase tracking-widest text-gray-400 mb-6">25% of Prize Pool</div>
              <p className="text-4xl font-bold mb-4 text-white">
                <AnimatedCounter value={1000} prefix="€" />+
              </p>
              <p className="text-gray-400 text-sm">Shared among all 3-matchers</p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* 4. CHARITY IMPACT */}
      <section className="py-24 px-4 bg-white text-gray-900">
        <motion.div 
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={sectionVariants}
          className="max-w-6xl mx-auto"
        >
          <div className="flex flex-col md:flex-row gap-12 items-center">
            <div className="md:w-1/2">
              <h2 className={`text-4xl md:text-5xl font-bold mb-6 ${playfair.className}`}>Swing for a Cause.</h2>
              <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                A minimum of <strong style={{ color: TEAL }}>10% of every subscription</strong> goes directly to a charity of your choice. You have the power to increase your impact up to 100%.
              </p>
              <Link href="/charities" className="inline-flex items-center font-bold text-lg hover:underline" style={{ color: NAVY }}>
                Meet our Charity Partners &rarr;
              </Link>
            </div>
            <div className="md:w-1/2 grid grid-cols-2 gap-4">
              {charities.length > 0 ? charities.map(c => (
                <div key={c.id} className="relative h-48 rounded-2xl overflow-hidden group">
                  {c.image_url ? (
                    <img src={c.image_url} alt={c.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center p-4 text-center">{c.name}</div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-4">
                    <span className="text-white font-bold text-sm">{c.name}</span>
                  </div>
                </div>
              )) : (
                <div className="col-span-2 h-48 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-500">Loading charities...</div>
              )}
            </div>
          </div>
        </motion.div>
      </section>

      {/* 5. DRAW RESULTS */}
      <section className="py-24 px-4 border-t border-white/10">
        <motion.div 
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={sectionVariants}
          className="max-w-6xl mx-auto"
        >
          <div className="text-center mb-16">
            <h2 className={`text-4xl font-bold mb-4 ${playfair.className}`}>Recent Winners</h2>
            <p className="text-gray-400">See the results from our latest monthly draws.</p>
          </div>

          <div className="space-y-6">
            {drawResults.length > 0 ? drawResults.map(draw => (
              <div key={draw.id} className="bg-white/5 border border-white/10 p-6 md:p-8 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-8">
                <div>
                  <h3 className="text-xl font-bold text-gray-300 mb-4 uppercase tracking-widest text-center md:text-left">
                    {new Date(draw.draw_month).toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </h3>
                  <div className="flex gap-3 justify-center md:justify-start">
                    {draw.drawn_numbers.map((n: number) => (
                      <div key={n} className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold shadow-lg" style={{ backgroundColor: TEAL, color: NAVY }}>
                        {n}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex gap-8 text-center">
                  <div>
                    <div className="text-3xl font-bold" style={{ color: GOLD }}>{draw.prize_tiers['5-match'].winners}</div>
                    <div className="text-xs text-gray-400 uppercase tracking-widest">Jackpot Winners</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-white">{draw.prize_tiers['4-match'].winners}</div>
                    <div className="text-xs text-gray-400 uppercase tracking-widest">4-Match</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-white">{draw.prize_tiers['3-match'].winners}</div>
                    <div className="text-xs text-gray-400 uppercase tracking-widest">3-Match</div>
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center text-gray-500 py-12">No recent draw results to display.</div>
            )}
          </div>
        </motion.div>
      </section>

      {/* 6. CTA BANNER */}
      <section className="py-32 px-4 text-center relative overflow-hidden" style={{ backgroundColor: TEAL }}>
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent mix-blend-overlay"></div>
        <motion.div 
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={sectionVariants}
          className="relative z-10 max-w-3xl mx-auto"
        >
          <h2 className={`text-5xl font-bold mb-8 ${playfair.className}`} style={{ color: NAVY }}>Ready to Step on the Tee?</h2>
          <Link 
            href="/signup" 
            className="inline-block px-10 py-5 rounded-full text-xl font-bold transition transform hover:scale-105 shadow-2xl"
            style={{ backgroundColor: NAVY, color: 'white' }}
          >
            Join the Club Today
          </Link>
        </motion.div>
      </section>

      {/* 7. FOOTER */}
      <footer className="bg-black py-12 px-4 text-gray-400 text-sm">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <h3 className={`text-2xl font-bold text-white mb-4 ${playfair.className}`}>Golf Charity Draw</h3>
            <p className="max-w-sm">Combining the passion for golf with the power of giving back. Your scores, your impact, your rewards.</p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4 uppercase tracking-widest">Platform</h4>
            <ul className="space-y-2">
              <li><Link href="#how-it-works" className="hover:text-white transition">How It Works</Link></li>
              <li><Link href="/charities" className="hover:text-white transition">Our Charities</Link></li>
              <li><Link href="/login" className="hover:text-white transition">Member Login</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4 uppercase tracking-widest">Legal</h4>
            <ul className="space-y-2">
              <li><Link href="#" className="hover:text-white transition">Terms of Service</Link></li>
              <li><Link href="#" className="hover:text-white transition">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-white transition">Contact Us</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p>&copy; {new Date().getFullYear()} Golf Charity Platform. All rights reserved.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            {/* Social placeholders */}
            <div className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 cursor-pointer transition"></div>
            <div className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 cursor-pointer transition"></div>
            <div className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 cursor-pointer transition"></div>
          </div>
        </div>
      </footer>

      {/* Basic Keyframes for blobs injected into layout */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}} />
    </div>
  );
}
