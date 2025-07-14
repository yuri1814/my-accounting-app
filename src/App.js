import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, onSnapshot, query, doc, deleteDoc, updateDoc, serverTimestamp, writeBatch, getDocs } from 'firebase/firestore';
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { Plus, Trash2, X, TrendingUp, Landmark, CreditCard, Wallet, MoreHorizontal, Home, Repeat, ArrowDown, ArrowUp, Smartphone, Shuffle, AlertTriangle, PieChart as PieChartIcon, BarChart2, LogIn, LogOut, Settings, Tag } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: process.env.REACT_APP_API_KEY,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_PROJECT_ID,
  storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_APP_ID
};

// --- Firebase Initialization ---
let app;
let db;
let auth;
let firebaseError = null;

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  firebaseError = "Firebase 設定錯誤：環境變數未正確設定。請檢查 Netlify 的設定。";
} else {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
  } catch (e) {
    console.error("Firebase Initialization Error:", e);
    firebaseError = `Firebase 初始化失敗: ${e.message}`;
  }
}

// --- Custom Icons ---
const UtensilsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3z"/></svg>;
const ShoppingCartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.16"/></svg>;
const CarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><path d="M14 17H9"/><path d="M9 11h4"/><path d="m5 17-1 4"/><path d="m19 17 1 4"/><circle cx="6.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>;
const Gamepad2Icon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="6" x2="10" y1="12" y2="12"/><line x1="8" x2="8" y1="10" y2="14"/><path d="M17.5 15a3.5 3.5 0 0 0 0-7h-9a3.5 3.5 0 0 0-3.5 3.5v1A3.5 3.5 0 0 0 8.5 16H11"/><path d="M14.5 12H16"/></svg>;
const ReceiptIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h6"/><path d="M12 17.5v-11"/></svg>;
const BriefcaseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>;
const StarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;

// --- Default Data & Icons ---
const ICONS = { UtensilsIcon, ShoppingCartIcon, CarIcon, Gamepad2Icon, HomeIcon: Home, ReceiptIcon, BriefcaseIcon, StarIcon, TrendingUp, MoreHorizontal, Shuffle, Tag };
const ICON_NAMES = Object.keys(ICONS);
const COLORS = ['#0EA5E9', '#22C55E', '#F97316', '#8B5CF6', '#EC4899', '#FACC15', '#64748B', '#14B8A6'];

const DEFAULT_EXPENSE_CATEGORIES = [
  { name: '伙食', icon: 'UtensilsIcon', color: COLORS[0] },
  { name: '購物', icon: 'ShoppingCartIcon', color: COLORS[1] },
  { name: '交通', icon: 'CarIcon', color: COLORS[2] },
  { name: '娛樂', icon: 'Gamepad2Icon', color: COLORS[3] },
  { name: '租屋相關', icon: 'HomeIcon', color: COLORS[4] },
  { name: '月費', icon: 'ReceiptIcon', color: COLORS[5] },
  { name: '其他支出', icon: 'MoreHorizontal', color: COLORS[6] },
];
const DEFAULT_INCOME_CATEGORIES = [
  { name: '薪資', icon: 'BriefcaseIcon', color: COLORS[1] },
  { name: '獎金', icon: 'StarIcon', color: COLORS[5] },
  { name: '其他收入', icon: 'MoreHorizontal', color: COLORS[6] },
];

const DynamicIcon = ({ name, className }) => {
    const IconComponent = ICONS[name] || MoreHorizontal;
    return <IconComponent className={className} />;
};

// --- Main App Component ---
export default function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [incomeCategories, setIncomeCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const [activePage, setActivePage] = useState('home');
  const [modal, setModal] = useState(null); 
  const [editingItem, setEditingItem] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);

  // --- Authentication Handling ---
  useEffect(() => {
    if (firebaseError) {
      setIsLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);
  
  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Google 登入失敗:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error("登出失敗:", error);
    }
  };

  // --- Data Fetching & Default Category Creation ---
  useEffect(() => {
    if (!user || firebaseError) {
        setExpenseCategories([]);
        setIncomeCategories([]);
        setAccounts([]);
        setTransactions([]);
        return;
    }

    const setupDefaultCategories = async (uid) => {
        const expenseCatRef = collection(db, `users/${uid}/expenseCategories`);
        const incomeCatRef = collection(db, `users/${uid}/incomeCategories`);
        
        const expenseSnap = await getDocs(expenseCatRef);
        if (expenseSnap.empty) {
            const batch = writeBatch(db);
            DEFAULT_EXPENSE_CATEGORIES.forEach(cat => {
                const newDocRef = doc(expenseCatRef);
                batch.set(newDocRef, cat);
            });
            await batch.commit();
        }

        const incomeSnap = await getDocs(incomeCatRef);
        if (incomeSnap.empty) {
            const batch = writeBatch(db);
            DEFAULT_INCOME_CATEGORIES.forEach(cat => {
                const newDocRef = doc(incomeCatRef);
                batch.set(newDocRef, cat);
            });
            await batch.commit();
        }
    };

    setupDefaultCategories(user.uid);

    const collectionsToFetch = [
        { name: 'expenseCategories', setter: setExpenseCategories },
        { name: 'incomeCategories', setter: setIncomeCategories },
        { name: 'accounts', setter: setAccounts },
        { name: 'transactions', setter: setTransactions },
    ];
    
    const unsubs = collectionsToFetch.map(({ name, setter }) => {
        const collPath = `users/${user.uid}/${name}`;
        const q = query(collection(db, collPath));
        return onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id, ...doc.data(),
                date: doc.data().date?.toDate(), createdAt: doc.data().createdAt?.toDate()
            }));
            if (name.includes('Categories')) {
                setter(data);
            } else {
                data.sort((a, b) => (b.date || 0) - (a.date || 0));
                setter(data);
            }
        });
    });
    
    return () => { unsubs.forEach(unsub => unsub()); };
  }, [user]);

  // All other logic... (Calculations, Handlers, Render functions)
  
  return (
    <div className="bg-slate-50 font-sans antialiased">
      {/* ... App UI ... */}
    </div>
  );
}
