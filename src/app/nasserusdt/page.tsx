"use client";

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, User, KeyRound, Star, TrendingUp, ShieldCheck, Zap, Apple, Rocket, ChevronDown, CheckCircle, Smartphone, Instagram, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { database } from "@/lib/firebase";
import { ref, get } from "firebase/database";
import { cn } from '@/lib/utils';
import { forecastIncome } from '@/ai/flows/income-forecast';


// --- Motion Variants ---
const viewVariants = {
  initial: { opacity: 0, scale: 0.95, y: 20 },
  in: { opacity: 1, scale: 1, y: 0 },
  out: { opacity: 0, scale: 0.95, y: -20 },
};

// --- Mock Data ---
const reviews = [
  { name: "محمد", text: "أفضل تطبيق! أرباحي زادت بشكل لا يصدق.", rating: 5 },
  { name: "علي", text: "دقيق جدًا وموثوق، أنصح به بشدة.", rating: 5 },
  { name: "فاطمة", text: "سهل الاستخدام وفعال، شكرًا لكم.", rating: 5 },
  { name: "أحمد", text: "غير حياتي المالية، لا أستطيع أن أشكره بما فيه الكفاية.", rating: 5 },
  { name: "سارة", text: "نتائج مذهلة في وقت قصير جدًا!", rating: 5 },
];

const features = [
  { icon: TrendingUp, title: "تنبؤات دقيقة", desc: "نظام ذكاء اصطناعي متطور لتحليل الأنماط." },
  { icon: ShieldCheck, title: "آمن وموثوق", desc: "حماية كاملة لبياناتك وخصوصيتك." },
  { icon: Zap, title: "نتائج سريعة", desc: "احصل على توقعاتك في ثوانٍ معدودة." },
];

const casinos = ["1xBet", "MelBet", "LineBet"];
const games = [{ id: "apple", name: "تفاح الحظ", icon: Apple }, { id: "crash", name: "كراش", icon: Rocket }];
const plans = [
    { id: "1h", name: "ساعة واحدة", priceDZD: "4000 DZD", priceUSDT: "20 USDT" },
    { id: "2h", name: "ساعتان", priceDZD: "6000 DZD", priceUSDT: "30 USDT" },
];
const paymentMethods = [
    { id: "baridi", name: "BaridiMob", details: "RIP: 001122334455667788 | Name: N. Ahmed" },
    { id: "ccp", name: "CCP", details: "Account: 12345678 Key: 99 | Name: N. Ahmed" },
    { id: "usdt", name: "USDT", details: "Network: TRC20 | Address: TXYZ...abcd" },
];


// --- Sub-Components ---

const ReviewsCarousel = () => (
  <div className="w-full max-w-4xl mx-auto overflow-hidden">
    <div className="flex animate-scroll gap-4">
      {[...reviews, ...reviews].map((review, index) => (
        <Card key={index} className="bg-slate-800/50 border-cyan-500/20 w-60 flex-shrink-0">
          <CardContent className="p-4">
            <div className="flex items-center mb-2">
              <div className="flex text-yellow-400">
                {[...Array(review.rating)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
              </div>
              <p className="mr-auto font-bold text-cyan-300">{review.name}</p>
            </div>
            <p className="text-sm text-slate-300">{review.text}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

const SpotsLeftCounter = () => {
    const [spots, setSpots] = useState(800);
    useEffect(() => {
        const interval = setInterval(() => {
            setSpots(prev => {
                if (prev <= 10) return prev;
                return prev - Math.floor(Math.random() * 3 + 1);
            });
        }, 2500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="bg-cyan-900/50 border border-cyan-500/30 rounded-lg p-3 text-center">
            <p className="text-cyan-300 text-sm">الأماكن المتاحة محدودة</p>
            <p className="text-2xl font-bold text-white">{spots}</p>
            <p className="text-xs text-cyan-400">مكان متبقي فقط!</p>
        </div>
    );
};

const AppHeader = ({ onMenuClick }: { onMenuClick: (action: 'change_game' | 'logout') => void }) => (
    <header className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-20 bg-black/30 backdrop-blur-sm">
        <div className="w-12 h-12 rounded-full bg-cyan-500 flex items-center justify-center shadow-lg">
             <img src="https://i.ibb.co/6yv6W64/photo-2024-07-28-18-09-01-removebg-preview.png" alt="Logo" className="w-10 h-10 object-contain"/>
        </div>
        <div className="relative group">
            <Button variant="ghost" className="rounded-full h-12 w-12 p-0 text-white hover:bg-cyan-500/20">
                <ChevronDown />
            </Button>
            <div className="absolute top-full right-0 mt-2 w-48 bg-slate-800 border border-cyan-500/20 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                <button onClick={() => onMenuClick('change_game')} className="block w-full text-right px-4 py-2 text-sm text-slate-200 hover:bg-cyan-500/20">تغيير اللعبة</button>
                <button onClick={() => onMenuClick('logout')} className="block w-full text-right px-4 py-2 text-sm text-slate-200 hover:bg-cyan-500/20">تسجيل الخروج</button>
            </div>
        </div>
    </header>
);

// --- Main Views ---

const LandingView = ({ onNavigate }: { onNavigate: (view: string) => void }) => (
  <motion.div variants={viewVariants} initial="initial" animate="in" exit="out" className="w-full text-center space-y-12">
    <h1 className="text-5xl md:text-7xl font-black text-white text-shadow-cyan">NASSERUSDT</h1>
    
    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => onNavigate('main')} className="relative w-48 h-48 mx-auto cursor-pointer group">
      <div className="absolute inset-0 bg-cyan-500 rounded-full blur-2xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
      <div className="relative w-full h-full bg-slate-900 rounded-full border-2 border-cyan-500 flex items-center justify-center">
         <img src="https://i.ibb.co/6yv6W64/photo-2024-07-28-18-09-01-removebg-preview.png" alt="Logo" className="w-32 h-32 object-contain"/>
      </div>
    </motion.div>
    
    <Alert variant="destructive" className="max-w-2xl mx-auto text-right">
      <AlertTitle className="font-bold">تحذير هام</AlertTitle>
      <AlertDescription>
        لا ينبغي إرسال هذا التطبيق إلى أي شخص آخر، لأنه قد يتوقف عن العمل لجميع المستخدمين.
      </AlertDescription>
    </Alert>

    <div className="space-y-4">
        <h2 className="text-3xl font-bold text-white">شاهد كيف يعمل</h2>
        <div className="max-w-2xl mx-auto rounded-lg overflow-hidden border-2 border-cyan-500/30">
            <video src="https://videos.pexels.com/video-files/3254013/3254013-hd_1920_1080_25fps.mp4" autoPlay loop muted playsInline className="w-full h-full object-cover"></video>
        </div>
    </div>
    
    <div className="space-y-4">
      <h2 className="text-3xl font-bold text-white">تقييمات المستخدمين</h2>
      <ReviewsCarousel />
    </div>
  </motion.div>
);

const MainView = ({ onNavigate }: { onNavigate: (view: string) => void }) => {
    const [mode, setMode] = useState<'login' | 'signup'>('signup');
    const [casino, setCasino] = useState(casinos[0]);
    const [casinoId, setCasinoId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async () => {
        setIsLoading(true);
        setError(null);
        if (mode === 'signup') {
            if(!casinoId || !password) {
                 setError('يرجى ملء جميع الحقول.');
                 setIsLoading(false);
                 return;
            }
            // Mock signup
            setTimeout(() => {
                sessionStorage.setItem('nasser_auth', JSON.stringify({ casino, casinoId }));
                onNavigate('game');
            }, 1000);
        } else {
            try {
                const passwordsRef = ref(database, 'passwords');
                const snapshot = await get(passwordsRef);
                if (snapshot.exists()) {
                    const allPasswords = snapshot.val();
                    let isValid = false;
                    for (const key in allPasswords) {
                        if (allPasswords[key].password === password && allPasswords[key].userId === casinoId) {
                            isValid = true;
                            break;
                        }
                    }
                    if (isValid) {
                        sessionStorage.setItem('nasser_auth', JSON.stringify({ casino, casinoId }));
                        onNavigate('game');
                    } else {
                        setError('معرف الكازينو أو كلمة المرور غير صحيحة.');
                    }
                } else {
                    setError('خطأ في النظام: لا يمكن التحقق من البيانات.');
                }
            } catch (err) {
                 setError('خطأ في الشبكة. يرجى التحقق من اتصالك.');
            } finally {
                setIsLoading(false);
            }
        }
    };
    
    return (
        <motion.div variants={viewVariants} initial="initial" animate="in" exit="out" className="w-full max-w-4xl mx-auto space-y-12">
            <div className="grid md:grid-cols-3 gap-6">
                {features.map(f => (
                    <Card key={f.title} className="bg-slate-800/50 border-cyan-500/20 text-center">
                        <CardHeader>
                            <f.icon className="w-10 h-10 mx-auto text-cyan-400" />
                        </CardHeader>
                        <CardContent>
                            <CardTitle className="text-white">{f.title}</CardTitle>
                            <CardDescription className="text-slate-400">{f.desc}</CardDescription>
                        </CardContent>
                    </Card>
                ))}
            </div>

             <div className="space-y-4">
                <h2 className="text-3xl font-bold text-white text-center">تقييمات المستخدمين</h2>
                <ReviewsCarousel />
            </div>
            
            <div className="grid md:grid-cols-2 gap-8 items-center">
                 <SpotsLeftCounter />

                <Card className="bg-slate-900 border-cyan-500/30">
                    <CardHeader>
                        <div className="flex border-b border-cyan-500/30">
                            <button onClick={() => setMode('signup')} className={cn("flex-1 p-3 font-bold", mode === 'signup' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400')}>إنشاء حساب</button>
                            <button onClick={() => setMode('login')} className={cn("flex-1 p-3 font-bold", mode === 'login' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400')}>تسجيل الدخول</button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div className="space-y-2">
                             <label className="text-sm font-medium text-slate-300">اختر الكازينو</label>
                             <div className="flex gap-2">
                                 {casinos.map(c => <Button key={c} onClick={() => setCasino(c)} variant={casino === c ? 'default' : 'outline'} className={cn(casino === c ? 'bg-cyan-500' : 'border-cyan-800 text-slate-300 hover:bg-cyan-900/50')}>{c}</Button>)}
                             </div>
                         </div>
                         <div className="relative">
                            <User className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-cyan-400/70" />
                            <Input value={casinoId} onChange={e => setCasinoId(e.target.value)} type="text" placeholder="معرف الكازينو" className="bg-slate-800 border-cyan-700/50 pr-10"/>
                        </div>
                         <div className="relative">
                            <KeyRound className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-cyan-400/70" />
                            <Input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="كلمة المرور" className="bg-slate-800 border-cyan-700/50 pr-10"/>
                        </div>
                        {error && <p className="text-sm text-red-400 text-center">{error}</p>}
                        <Button onClick={handleSubmit} disabled={isLoading} className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-bold">
                            {isLoading ? <Loader2 className="animate-spin" /> : (mode === 'signup' ? 'إنشاء حساب' : 'تسجيل الدخول')}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </motion.div>
    );
};

const GameView = ({ onNavigate }: { onNavigate: (view: string, data?: any) => void }) => {
    return (
        <motion.div variants={viewVariants} initial="initial" animate="in" exit="out" className="w-full max-w-2xl mx-auto space-y-8 text-center">
            <h1 className="text-4xl font-bold text-white">اختر لعبتك</h1>
            <div className="grid grid-cols-2 gap-6">
                {games.map(game => (
                    <motion.div key={game.id} whileHover={{ y: -5 }} onClick={() => onNavigate('payment', { game })}
                        className="bg-slate-800/50 border-2 border-cyan-500/20 rounded-xl p-6 cursor-pointer hover:border-cyan-500 hover:bg-slate-800 transition-all">
                        <game.icon className="w-20 h-20 mx-auto text-cyan-400 mb-4" />
                        <h3 className="text-2xl font-bold text-white">{game.name}</h3>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
};

const PaymentView = ({ onNavigate, gameData }: { onNavigate: (view: string, data?: any) => void; gameData: any }) => {
    const [plan, setPlan] = useState<any | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<any | null>(null);
    const [proof, setProof] = useState<File | null>(null);
    const [predictedIncomes, setPredictedIncomes] = useState<Record<string, number | null>>({ "1h": null, "2h": null });

     useEffect(() => {
        const fetchPredictions = async () => {
            try {
                const oneHour = await forecastIncome({ duration: '1_hour', casino: gameData.casino });
                const twoHours = await forecastIncome({ duration: '2_hours', casino: gameData.casino });
                setPredictedIncomes({ "1h": oneHour.income, "2h": twoHours.income });
            } catch (error) {
                console.error("Failed to fetch income predictions:", error);
                setPredictedIncomes({ "1h": 150, "2h": 250 }); // Fallback
            }
        };
        fetchPredictions();
    }, [gameData]);

    const isReady = plan && paymentMethod && proof;
    
    return (
         <motion.div variants={viewVariants} initial="initial" animate="in" exit="out" className="w-full max-w-2xl mx-auto space-y-6 text-right">
             <h1 className="text-4xl font-bold text-white text-center">صفحة الدفع</h1>

            <Card className="bg-slate-800/50 border-cyan-500/20">
                <CardHeader>
                    <CardTitle className="text-white">تفاصيل طلبك</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-slate-300">
                    <p><strong>اللعبة:</strong> {gameData.game.name}</p>
                    <p><strong>الكازينو:</strong> {gameData.casino}</p>
                    <p><strong>المعرف:</strong> {gameData.casinoId}</p>
                </CardContent>
            </Card>

             <Card className="bg-slate-800/50 border-cyan-500/20">
                <CardHeader>
                    <CardTitle className="text-white">1. اختر الخطة</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                    {plans.map(p => {
                        const income = predictedIncomes[p.id];
                        return (
                            <div key={p.id} onClick={() => setPlan(p)} className={cn("p-4 rounded-lg border-2 cursor-pointer", plan?.id === p.id ? "border-cyan-400 bg-cyan-900/50" : "border-cyan-800")}>
                                <h4 className="font-bold text-lg text-white">{p.name}</h4>
                                <p className="text-slate-300">{p.priceDZD} / {p.priceUSDT}</p>
                                <p className="text-sm text-green-400 font-bold mt-2">
                                   الربح المتوقع: {income ? `~${income} USDT` : <Loader2 className="w-4 h-4 inline animate-spin" />}
                                </p>
                            </div>
                        )
                    })}
                </CardContent>
            </Card>

             <Card className="bg-slate-800/50 border-cyan-500/20">
                <CardHeader>
                    <CardTitle className="text-white">2. اختر طريقة الدفع</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                         {paymentMethods.map(m => <Button key={m.id} onClick={() => setPaymentMethod(m)} variant={paymentMethod?.id === m.id ? 'default' : 'outline'} className={cn(paymentMethod?.id === m.id ? 'bg-cyan-500' : 'border-cyan-800 text-slate-300 hover:bg-cyan-900/50')}>{m.name}</Button>)}
                    </div>
                     {paymentMethod && <Alert className="border-cyan-700 bg-cyan-900/30 text-cyan-200"><AlertDescription>{paymentMethod.details}</AlertDescription></Alert>}
                </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-cyan-500/20">
                <CardHeader>
                    <CardTitle className="text-white">3. ارفع إثبات الدفع</CardTitle>
                </CardHeader>
                <CardContent>
                    <Input type="file" onChange={(e) => setProof(e.target.files ? e.target.files[0] : null)} className="bg-slate-800 border-cyan-700/50 file:text-cyan-300" />
                </CardContent>
            </Card>

            <Button onClick={() => onNavigate('confirmation')} disabled={!isReady} className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-bold text-lg p-6">
                إرسال الطلب
            </Button>
         </motion.div>
    );
};

const ConfirmationView = ({ onNavigate }: { onNavigate: (view: string) => void }) => {
    useEffect(() => {
        const timer = setTimeout(() => onNavigate('game_final'), 3000);
        return () => clearTimeout(timer);
    }, [onNavigate]);

    return (
        <motion.div variants={viewVariants} initial="initial" animate="in" exit="out" className="w-full max-w-md mx-auto text-center space-y-6">
            <Card className="bg-slate-800/50 border-cyan-500/20 p-8">
                <CheckCircle className="w-20 h-20 text-green-400 mx-auto mb-4" />
                <h1 className="text-3xl font-bold text-white">تم استلام طلبك</h1>
                <p className="text-slate-300 mt-2">جاري تأكيد الدفع وتفعيل حسابك. سيتم توجيهك قريبًا...</p>
                 <div className="flex justify-center mt-4">
                    <Loader2 className="w-8 h-8 text-cyan-400 animate-spin"/>
                </div>
            </Card>
             <Card className="bg-slate-800/50 border-cyan-500/20 p-6">
                <CardHeader>
                    <CardTitle className="text-white">تحتاج مساعدة؟</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-slate-300">
                     <p>إذا واجهت أي مشكلة، تواصل معنا عبر:</p>
                     <p className="flex items-center justify-center gap-2"><Instagram size={18}/> <span>@nasserusdt</span></p>
                     <p className="flex items-center justify-center gap-2"><Smartphone size={18}/> <span>+213 123 456 789</span></p>
                </CardContent>
            </Card>
        </motion.div>
    );
};


const CrashGameView = ({ onMenuClick }: { onMenuClick: (action: 'change_game' | 'logout') => void }) => (
    <div className="w-full h-screen bg-black">
        <AppHeader onMenuClick={onMenuClick} />
        <iframe 
            src="https://1wovk.xyz/casino/play/1play_1play_crash" 
            className="w-full h-full border-0 pt-16"
            title="Crash Game"
        ></iframe>
    </div>
);


// --- Main App Component ---

export default function NasserusdtPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState('landing');
  const [viewData, setViewData] = useState<any>({});

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleNavigate = (targetView: string, data?: any) => {
    setViewData(data || {});
    setView(targetView);
  };
  
  const handleMenuAction = (action: 'change_game' | 'logout') => {
      if (action === 'logout') {
          sessionStorage.removeItem('nasser_auth');
          handleNavigate('main');
      } else {
          handleNavigate('game');
      }
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black" dir="rtl">
        <img src="https://i.postimg.cc/W3Z2C3ZW/loading.gif" alt="Loading..." className="w-48 h-48" />
      </div>
    );
  }

  const renderView = () => {
    switch (view) {
      case 'landing': return <LandingView onNavigate={handleNavigate} />;
      case 'main': return <MainView onNavigate={handleNavigate} />;
      case 'game': 
        const authData = JSON.parse(sessionStorage.getItem('nasser_auth') || '{}');
        return <GameView onNavigate={(v, d) => handleNavigate(v, { ...d, ...authData })} />;
      case 'payment': return <PaymentView onNavigate={handleNavigate} gameData={viewData} />;
      case 'confirmation': return <ConfirmationView onNavigate={handleNavigate} />;
      case 'game_final': return <CrashGameView onMenuClick={handleMenuAction}/>;
      default: return <LandingView onNavigate={handleNavigate} />;
    }
  };

  if (view === 'game_final') {
      return renderView();
  }

  return (
    <main className="min-h-screen bg-slate-900 text-white p-4 md:p-8 flex items-center justify-center" dir="rtl">
       <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap');
        body, html {
            font-family: 'Cairo', sans-serif;
            background-color: #020617;
        }
        .text-shadow-cyan {
            text-shadow: 0 0 15px rgba(34, 211, 238, 0.6), 0 0 30px rgba(34, 211, 238, 0.4);
        }
        @keyframes scroll {
            from { transform: translateX(0); }
            to { transform: translateX(-50%); }
        }
        .animate-scroll {
            animation: scroll 40s linear infinite;
        }
       `}</style>
      <AnimatePresence mode="wait">
        {renderView()}
      </AnimatePresence>
    </main>
  );
}
