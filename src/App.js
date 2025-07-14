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

const accountTypes = {
  '銀行帳戶': { icon: <Landmark className="h-5 w-5" /> },
  '信用卡': { icon: <CreditCard className="h-5 w-5" /> },
  '現金': { icon: <Wallet className="h-5 w-5" /> },
  '電子支付': { icon: <Smartphone className="h-5 w-5" /> },
  '其他資產': { icon: <MoreHorizontal className="h-5 w-5" /> },
};


const DynamicIcon = ({ name, className }) => {
    const IconComponent = ICONS[name] || MoreHorizontal;
    return <IconComponent className={className} />;
};

// --- Helper & Item Components ---
const InputField = ({ label, as = 'input', children, ...props }) => {
  const Element = as;
  return (
    <div>
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <Element
        {...props}
        className="mt-1 w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500"
      >
        {children}
      </Element>
    </div>
  );
};

const CategorySelector = ({ categories, selected, onSelect, type }) => {
    const baseColor = type === 'expense' ? 'blue' : 'green';
    return(
        <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">分類</label>
            <div className="grid grid-cols-4 gap-2">
                 {categories.map(cat => (
                    <button type="button" key={cat.id} onClick={() => onSelect(cat.name)} className={`flex flex-col items-center justify-center p-2 rounded-lg border-2 ${selected === cat.name ? `border-${baseColor}-500 bg-${baseColor}-50` : 'border-transparent bg-gray-100'}`}>
                        <DynamicIcon name={cat.icon} className="h-5 w-5" />
                        <span className={`text-xs mt-1 ${selected === cat.name ? `text-${baseColor}-600` : 'text-gray-600'}`}>{cat.name}</span>
                    </button>
                 ))}
            </div>
        </div>
    );
}

const AccountTypeSelector = ({ selected, onSelect }) => (
    <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">類型</label>
        <div className="grid grid-cols-3 gap-2">
            {Object.keys(accountTypes).map(typeName => (
                <button type="button" key={typeName} onClick={() => onSelect(typeName)} className={`flex items-center justify-center flex-col p-3 rounded-lg border-2 ${selected === typeName ? 'border-blue-500 bg-blue-50' : 'border-transparent bg-gray-100'}`}>
                    {accountTypes[typeName].icon}
                    <span className={`text-xs mt-1 ${selected === typeName ? 'text-blue-600' : 'text-gray-700'}`}>{typeName}</span>
                </button>
            ))}
        </div>
    </div>
);

const TransactionItemWrapper = ({ children, onEdit, isEditable = true }) => (
    <motion.li 
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, transition: { duration: 0.1 } }}
        onClick={isEditable ? onEdit : undefined} 
        className={`flex items-center p-4 bg-white rounded-2xl shadow-sm border border-gray-100 ${isEditable ? 'hover:shadow-md transition-shadow cursor-pointer' : ''}`}
    >
        {children}
    </motion.li>
);

const TransactionItem = ({ transaction, account, onEdit, categories }) => {
    const isExpense = transaction.type === 'expense';
    const categoryInfo = categories.find(c => c.name === transaction.category) || { name: transaction.category, icon: 'MoreHorizontal', color: COLORS[6] };
    const isTransfer = transaction.category === '轉帳';

    return(
      <TransactionItemWrapper onEdit={onEdit} isEditable={!isTransfer}>
        <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center" style={{backgroundColor: categoryInfo.color.replace('600', '100'), color: categoryInfo.color}}>
          {isTransfer ? <Shuffle className="h-5 w-5" /> : <DynamicIcon name={categoryInfo.icon} className="h-5 w-5" />}
        </div>
        <div className="flex-grow ml-4">
          <p className="font-medium text-gray-800">{transaction.description}</p>
          <p className="text-xs text-gray-500">
            {account?.name || '未分類帳戶'} · {transaction.date ? transaction.date.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' }) : ''}
          </p>
        </div>
        <p className={`text-base font-semibold ${isTransfer ? 'text-gray-700' : (isExpense ? 'text-red-600' : 'text-green-600')}`}>
          {isExpense ? '- $' : '+ $'} {Number(transaction.amount).toLocaleString()}
        </p>
      </TransactionItemWrapper>
    );
};


// --- Modal Components ---

const ModalWrapper = ({ children, onClose, title }) => (
    <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" 
        onClick={onClose}
    >
        <motion.div 
            initial={{ y: 20, scale: 0.95, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 20, scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 relative" 
            onClick={e => e.stopPropagation()}
        >
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
            <h3 className="text-xl font-semibold mb-6 text-center text-gray-800">{title}</h3>
            {children}
        </motion.div>
    </motion.div>
);

const ConfirmDeleteModal = ({ onConfirm, onCancel, message }) => (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-modal-pop-in">
        <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg leading-6 font-medium text-gray-900 mt-4">確定要刪除嗎？</h3>
            <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">{message}</p>
            </div>
            <div className="mt-6 flex justify-center gap-4">
                <button onClick={onCancel} className="py-2 px-4 bg-gray-200 text-gray-800 font-medium rounded-md hover:bg-gray-300">
                    取消
                </button>
                <button onClick={onConfirm} className="py-2 px-4 bg-red-600 text-white font-medium rounded-md hover:bg-red-700">
                    確認刪除
                </button>
            </div>
        </div>
      </div>
    </div>
);

const AddTransactionMenu = ({ onClose, onSelect }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-4 animate-modal-pop-in space-y-3" onClick={e => e.stopPropagation()}>
                <button onClick={() => onSelect('addExpense')} className="w-full text-lg font-semibold p-4 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center">
                    <ArrowDown className="h-6 w-6 mr-3" /> 新增支出
                </button>
                 <button onClick={() => onSelect('addIncome')} className="w-full text-lg font-semibold p-4 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 flex items-center justify-center">
                    <ArrowUp className="h-6 w-6 mr-3" /> 新增收入
                </button>
                <button onClick={() => onSelect('addTransfer')} className="w-full text-lg font-semibold p-4 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center justify-center">
                    <Shuffle className="h-6 w-6 mr-3" /> 帳戶轉帳
                </button>
            </div>
        </div>
    );
};

const AddRecurringMenuModal = ({ onClose, onSelect }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-4 animate-modal-pop-in space-y-3" onClick={e => e.stopPropagation()}>
            <button onClick={() => onSelect('addRecurring')} className="w-full text-lg font-semibold p-4 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 flex items-center justify-center">
                <Repeat className="h-6 w-6 mr-3" /> 新增定期支出
            </button>
             <button onClick={() => onSelect('addInstallment')} className="w-full text-lg font-semibold p-4 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 mr-3" /> 新增分期付款
            </button>
        </div>
    </div>
);

const AddTransactionModal = ({ onClose, onAdd, onUpdate, accounts, categories, type, initialData }) => {
    const isEditMode = !!initialData;
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [accountId, setAccountId] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (isEditMode) {
            setDescription(initialData.description);
            setAmount(initialData.amount);
            setCategory(initialData.category);
            setAccountId(initialData.accountId);
        } else {
            setAccountId(accounts[0]?.id || '');
            setCategory(categories[0]?.name || '');
        }
    }, [initialData, isEditMode, accounts, categories]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!description.trim() || !amount || !accountId || !category) {
            setError('請填寫所有欄位');
            return;
        }
        const data = { description, amount: Number(amount), category, accountId, type };
        if (isEditMode) {
            onUpdate(initialData.id, data);
        } else {
            onAdd(data);
        }
    };

    return (
        <ModalWrapper onClose={onClose} title={isEditMode ? `編輯${type === 'expense' ? '支出' : '收入'}` : `新增一筆${type === 'expense' ? '支出' : '收入'}`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && <p className="text-red-500 text-sm text-center -mt-2 mb-2">{error}</p>}
                <InputField label="項目" value={description} onChange={e => setDescription(e.target.value)} placeholder={type === 'expense' ? '午餐便當' : '六月薪水'} />
                <InputField label="金額" type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder={type === 'expense' ? '100' : '50000'} />
                <InputField as="select" label={type === 'expense' ? '付款帳戶' : '存入帳戶'} value={accountId} onChange={e => setAccountId(e.target.value)}>
                    <option value="" disabled>請選擇帳戶</option>
                    {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                </InputField>
                <CategorySelector categories={categories} selected={category} onSelect={setCategory} type={type} />
                <button type="submit" className={`w-full font-bold py-3 rounded-lg ${type === 'expense' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'} text-white`}>{isEditMode ? "儲存更新" : "新增"}</button>
            </form>
        </ModalWrapper>
    );
};

const AddAccountModal = ({ onClose, onAdd, onUpdate, initialData }) => {
    const isEditMode = !!initialData;
    const [name, setName] = useState('');
    const [type, setType] = useState('銀行帳戶');
    const [initialBalance, setInitialBalance] = useState('');

    useEffect(() => {
        if(isEditMode) {
            setName(initialData.name);
            setType(initialData.type);
            setInitialBalance(initialData.initialBalance);
        }
    }, [isEditMode, initialData]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        const data = { name, type, initialBalance: Number(initialBalance) || 0 };
        if(isEditMode) {
            onUpdate(initialData.id, data);
        } else {
            onAdd(data);
        }
    };

    return (
        <ModalWrapper onClose={onClose} title={isEditMode ? "編輯帳戶" : "新增帳戶"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                 <InputField label="帳戶名稱" value={name} onChange={e => setName(e.target.value)} placeholder="例如: 國泰 CUBE 卡" required />
                 <InputField label="初始餘額" type="number" value={initialBalance} onChange={e => setInitialBalance(e.target.value)} placeholder="0" />
                 <AccountTypeSelector selected={type} onSelect={setType} />
                 <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700">{isEditMode ? "儲存更新" : "建立帳戶"}</button>
            </form>
        </ModalWrapper>
    );
};

const AddCategoryModal = ({ onClose, onAdd, onUpdate, initialData, type }) => {
    const isEditMode = !!initialData;
    const [name, setName] = useState('');
    const [icon, setIcon] = useState('Tag');
    const [color, setColor] = useState(COLORS[0]);

    useEffect(() => {
        if (isEditMode) {
            setName(initialData.name);
            setIcon(initialData.icon);
            setColor(initialData.color);
        }
    }, [isEditMode, initialData]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        const data = { name, icon, color };
        if (isEditMode) {
            onUpdate(initialData.id, data);
        } else {
            onAdd(data);
        }
    };

    return (
        <ModalWrapper onClose={onClose} title={isEditMode ? '編輯分類' : '新增分類'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <InputField label="分類名稱" value={name} onChange={e => setName(e.target.value)} placeholder="例如：學習進修" required />
                <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">選擇圖示</label>
                    <div className="grid grid-cols-6 gap-2">
                        {ICON_NAMES.map(iconName => (
                            <button key={iconName} type="button" onClick={() => setIcon(iconName)} className={`flex items-center justify-center p-2 rounded-lg border-2 ${icon === iconName ? 'border-blue-500 bg-blue-50' : 'border-transparent bg-gray-100'}`}>
                                <DynamicIcon name={iconName} className="h-5 w-5 text-gray-700" />
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">選擇顏色</label>
                    <div className="grid grid-cols-8 gap-2">
                        {COLORS.map(c => (
                            <button key={c} type="button" onClick={() => setColor(c)} className={`w-8 h-8 rounded-full border-2 transition-transform transform ${color === c ? 'border-blue-500 scale-110' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                        ))}
                    </div>
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700">{isEditMode ? "儲存更新" : "新增分類"}</button>
            </form>
        </ModalWrapper>
    );
};

const AddTransferModal = ({ onClose, onAdd, accounts }) => {
    const [fromAccountId, setFromAccountId] = useState(accounts[0]?.id || '');
    const [toAccountId, setToAccountId] = useState(accounts[1]?.id || '');
    const [amount, setAmount] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if(fromAccountId === toAccountId && accounts.length > 1) {
            const differentAccount = accounts.find(acc => acc.id !== fromAccountId);
            if(differentAccount) {
                setToAccountId(differentAccount.id);
            }
        }
    }, [fromAccountId, toAccountId, accounts]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if(!fromAccountId || !toAccountId || !amount) {
            setError('所有欄位皆為必填');
            return;
        }
        if(fromAccountId === toAccountId) {
            setError('轉出和轉入帳戶不能相同');
            return;
        }
        if(Number(amount) <= 0) {
            setError('金額必須大於 0');
            return;
        }
        setError('');
        const fromAccountName = accounts.find(a => a.id === fromAccountId)?.name;
        const toAccountName = accounts.find(a => a.id === toAccountId)?.name;

        onAdd({
            fromAccountId,
            toAccountId,
            amount: Number(amount),
            description: `從 ${fromAccountName} 轉至 ${toAccountName}`,
        });
    }

    const availableToAccounts = accounts.filter(acc => acc.id !== fromAccountId);

    return (
        <ModalWrapper onClose={onClose} title="新增轉帳">
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && <p className="text-red-500 text-sm text-center -mt-2 mb-2">{error}</p>}
                <InputField as="select" label="從帳戶" value={fromAccountId} onChange={e => setFromAccountId(e.target.value)}>
                    {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                </InputField>
                 <InputField as="select" label="至帳戶" value={toAccountId} onChange={e => setToAccountId(e.target.value)}>
                    {availableToAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                </InputField>
                <InputField label="金額" type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="1000" />
                <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700">確認轉帳</button>
            </form>
        </ModalWrapper>
    );
}

// --- New Visual Components ---
const LoadingSpinner = () => (
    <div className="flex justify-center items-center py-20">
        <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="w-12 h-12 border-4 border-slate-200 border-t-sky-500 rounded-full"
        />
    </div>
);
const EmptyState = ({ icon, title, message }) => (
    <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-16 px-4 bg-slate-50/50 rounded-2xl"
    >
        <div className="inline-block bg-white rounded-full p-4 shadow-sm">
            {React.cloneElement(icon, { className: 'h-12 w-12 text-slate-400' })}
        </div>
        <h3 className="mt-4 text-lg font-medium text-slate-800">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">{message}</p>
    </motion.div>
);
const ExpensePieChart = ({ data }) => {
    if (!data || data.length === 0) {
        return <EmptyState icon={<PieChartIcon />} title="本月尚無支出" message="新增支出後，這裡會顯示您的消費分析圖表。"/>
    }
    return (
        <div className="w-full h-64">
            <ResponsiveContainer>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                    <Legend iconType="circle" />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};

// --- Page Components ---
const HomePage = ({ transactions, accounts, expenseCategories, incomeCategories, onEdit }) => {
    const [filterCategory, setFilterCategory] = useState('全部');
    
    const filteredTransactions = useMemo(() => {
        return filterCategory === '全部' 
            ? transactions 
            : transactions.filter(t => t.category === filterCategory);
    }, [transactions, filterCategory]);

    const monthlyChartData = useMemo(() => {
        const now = new Date();
        const currentMonthExpenses = transactions.filter(t => {
            const tDate = t.date;
            return t.type === 'expense' && tDate && tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear() && t.category !== '轉帳';
        });

        const grouped = currentMonthExpenses.reduce((acc, curr) => {
            const categoryName = curr.category || '其他支出';
            const categoryInfo = expenseCategories.find(c => c.name === categoryName) || { name: '其他支出', color: COLORS[6] };
            if (!acc[categoryName]) {
                acc[categoryName] = { value: 0, color: categoryInfo.color };
            }
            acc[categoryName].value += Number(curr.amount);
            return acc;
        }, {});

        return Object.entries(grouped).map(([name, data]) => ({ name, value: data.value, color: data.color }));
    }, [transactions, expenseCategories]);

    const allCategories = useMemo(() => {
        const cats = new Set(['全部']);
        transactions.forEach(t => cats.add(t.category));
        return Array.from(cats);
    }, [transactions]);

    return (
      <div className="space-y-6">
        <div>
            <h2 className="text-xl font-bold text-gray-800 mb-3">本月分析</h2>
            <div className="bg-white p-4 rounded-2xl shadow-sm">
                <ExpensePieChart data={monthlyChartData} />
            </div>
        </div>
        <div>
            <div className="flex justify-between items-center mb-3">
                <h2 className="text-xl font-bold text-gray-800">交易紀錄</h2>
                <select 
                    value={filterCategory} 
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
                >
                    {allCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
            </div>
            {filteredTransactions.length === 0 ? (
                <EmptyState icon={<BarChart2 />} title="尚無符合的交易" message={filterCategory === '全部' ? "點擊 '+' 來新增第一筆帳目吧！" : "試試選擇其他分類。"} />
            ) : (
                <ul className="space-y-3">
                  <AnimatePresence>
                    {filteredTransactions.slice(0, 30).map(tx => {
                        const account = accounts.find(a => a.id === tx.accountId);
                        return <TransactionItem key={`tx-${tx.id}`} transaction={tx} account={account} onEdit={() => onEdit(tx, 'editTransaction')} categories={tx.type === 'expense' ? expenseCategories : incomeCategories} />;
                    })}
                  </AnimatePresence>
                </ul>
            )}
        </div>
      </div>
    );
};

const AccountsPage = ({ accounts, balances, onDelete, onEdit }) => {
    return(
        <div>
            {accounts.length === 0 ? (
                <EmptyState icon={<Landmark />} title="尚未建立任何帳戶" message="點擊右下角的 '+' 按鈕來新增第一個帳戶。" />
            ) : (
                <ul className="space-y-3">
                    {accounts.map(acc => {
                        const balance = balances.get(acc.id) || 0;
                        return (
                            <li key={acc.id} onClick={() => onEdit(acc)} className="flex items-center p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
                               <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 text-gray-600">
                                    {accountTypes[acc.type]?.icon || <MoreHorizontal />}
                               </div>
                               <div className="flex-grow ml-4">
                                    <p className="font-medium text-gray-800">{acc.name}</p>
                                    <p className="text-xs text-gray-500">{acc.type}</p>
                               </div>
                               <div className="flex items-center">
                                   <p className={`text-lg font-semibold ${balance < 0 ? 'text-red-500' : 'text-gray-800'}`}>
                                       $ {balance.toLocaleString()}
                                   </p>
                                   <button onClick={(e) => { e.stopPropagation(); onDelete(acc.id); }} className="ml-4 text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                               </div>
                            </li>
                        )
                    })}
                </ul>
            )}
        </div>
    );
};

const CategoriesPage = ({ expenseCategories, incomeCategories, onAdd, onUpdate, onDelete }) => {
    const [view, setView] = useState('expense');
    const [modal, setModal] = useState(null);
    const [editingCategory, setEditingCategory] = useState(null);

    const openModal = (type, data = null) => {
        setEditingCategory(data);
        setModal(type);
    };

    const handleDelete = (type, id) => {
        onDelete(type === 'expense' ? 'expenseCategories' : 'incomeCategories', id);
    };

    const categoriesToShow = view === 'expense' ? expenseCategories : incomeCategories;

    return (
        <div>
            <div className="flex justify-center bg-gray-100 rounded-lg p-1 mb-5">
                <button onClick={() => setView('expense')} className={`w-1/2 py-2 text-sm font-semibold rounded-md transition-colors ${view === 'expense' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-600'}`}>支出分類</button>
                <button onClick={() => setView('income')} className={`w-1/2 py-2 text-sm font-semibold rounded-md transition-colors ${view === 'income' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-600'}`}>收入分類</button>
            </div>

            <ul className="space-y-3">
                {categoriesToShow.map(cat => (
                    <li key={cat.id} className="flex items-center p-4 bg-white rounded-xl shadow-sm">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: cat.color.replace('600', '100'), color: cat.color }}>
                            <DynamicIcon name={cat.icon} className="h-5 w-5" />
                        </div>
                        <p className="flex-grow ml-4 font-medium text-gray-800">{cat.name}</p>
                        <button onClick={() => openModal('edit', cat)} className="p-2 text-gray-400 hover:text-blue-500"><Settings size={16} /></button>
                        <button onClick={() => handleDelete(view, cat.id)} className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                    </li>
                ))}
            </ul>
            
            <div className="fixed bottom-24 right-1/2 translate-x-1/2 z-20 sm:right-6 sm:translate-x-0">
               <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => openModal('add')}
                  className="bg-sky-500 text-white rounded-full p-4 shadow-lg hover:bg-sky-600 focus:outline-none focus:ring-4 focus:ring-sky-300"
                  aria-label="新增分類"
                >
                  <Plus className="h-7 w-7" />
              </motion.button>
          </div>

          <AnimatePresence>
            {modal && (
                <AddCategoryModal 
                    onClose={() => setModal(null)}
                    onAdd={(data) => onAdd(view === 'expense' ? 'expenseCategories' : 'incomeCategories', data)}
                    onUpdate={(id, data) => onUpdate(view === 'expense' ? 'expenseCategories' : 'incomeCategories', id, data)}
                    initialData={editingCategory}
                    type={view}
                />
            )}
          </AnimatePresence>
        </div>
    );
};

// --- Nav & Header Components ---
const Header = ({ user, onLogin, onLogout, totalAssets, activePage }) => {
    const titles = { home: '總覽', accounts: '我的帳戶', categories: '分類管理' };
    return(
        <header className="bg-gradient-to-br from-sky-500 to-indigo-600 text-white p-6 rounded-b-3xl shadow-lg sticky top-0 z-10">
            <div className="flex justify-between items-center mb-4">
                 <h1 className="text-xl font-bold tracking-wide">{titles[activePage]}</h1>
                 <div>
                    {user ? (
                        <div className="flex items-center gap-2">
                             <img src={user.photoURL} alt={user.displayName} className="w-6 h-6 rounded-full" />
                            <span className="text-xs font-medium hidden sm:inline">{user.displayName || '使用者'}</span>
                            <button onClick={onLogout} className="flex items-center gap-1.5 text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded-full transition-colors">
                                <LogOut size={14} />
                                登出
                            </button>
                        </div>
                    ) : (
                         <button onClick={onLogin} className="flex items-center gap-1.5 text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded-full transition-colors">
                            <LogIn size={14} />
                            使用 Google 登入
                        </button>
                    )}
                 </div>
            </div>
            {activePage === 'home' && (
                <div className="text-center">
                    <p className="text-sm opacity-90">目前總資產</p>
                    <p className="text-4xl font-extrabold tracking-tight mt-1">
                        {user ? `$ ${totalAssets.toLocaleString()}` : '---'}
                    </p>
                </div>
            )}
        </header>
    );
}
const BottomNav = ({ activePage, setActivePage }) => {
  const navItems = [
    { id: 'home', icon: <Home />, label: '總覽' },
    { id: 'accounts', icon: <Landmark />, label: '帳戶' },
    { id: 'categories', icon: <Tag />, label: '分類' },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white border-t border-gray-200 flex justify-around p-2 z-20">
      {navItems.map(item => (
        <button
          key={item.id}
          onClick={() => setActivePage(item.id)}
          className={`flex flex-col items-center justify-center w-20 h-16 rounded-lg transition-colors duration-200 ${
            activePage === item.id ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          {React.cloneElement(item.icon, { className: 'h-6 w-6 mb-1' })}
          <span className="text-xs font-medium">{item.label}</span>
        </button>
      ))}
    </nav>
  );
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

  const accountBalances = useMemo(() => {
    const balances = new Map();
    accounts.forEach(acc => {
      const accountTransactions = transactions.filter(t => t.accountId === acc.id);
      const total = accountTransactions.reduce((sum, t) => {
        return t.type === 'expense' ? sum - Number(t.amount) : sum + Number(t.amount);
      }, Number(acc.initialBalance));
      balances.set(acc.id, total);
    });
    return balances;
  }, [accounts, transactions]);

  const totalAssets = useMemo(() => {
    return Array.from(accountBalances.values()).reduce((sum, bal) => sum + bal, 0);
  }, [accountBalances]);

  const handleAdd = async (collectionName, data) => {
    if (!user) return;
    try {
      const collPath = `users/${user.uid}/${collectionName}`;
      await addDoc(collection(db, collPath), { ...data, createdAt: serverTimestamp(), date: serverTimestamp() });
      setModal(null);
    } catch (error) {
      console.error(`Error adding to ${collectionName}:`, error);
    }
  };
  
  const handleUpdate = async (collectionName, docId, data) => {
    if (!user) return;
    try {
      const docPath = `users/${user.uid}/${collectionName}/${docId}`;
      const { id, ...updateData } = data;
      await updateDoc(doc(db, docPath), updateData);
      setModal(null);
      setEditingItem(null);
    } catch (error) {
      console.error(`Error updating ${collectionName}:`, error);
    }
  };

  const handleTransfer = async (transferData) => {
    if (!user) return;
    const batch = writeBatch(db);
    const now = serverTimestamp();
    
    const expenseData = {
        amount: transferData.amount, accountId: transferData.fromAccountId,
        category: '轉帳', description: transferData.description,
        type: 'expense', date: now, createdAt: now,
    };
    batch.set(doc(collection(db, `users/${user.uid}/transactions`)), expenseData);

    const incomeData = {
        amount: transferData.amount, accountId: transferData.toAccountId,
        category: '轉帳', description: transferData.description,
        type: 'income', date: now, createdAt: now,
    };
    batch.set(doc(collection(db, `users/${user.uid}/transactions`)), incomeData);

    await batch.commit();
    setModal(null);
  }

  const confirmDelete = async () => {
    if (!user || !itemToDelete) return;
    try {
      const { collectionName, docId } = itemToDelete;
      const docPath = `users/${user.uid}/${collectionName}/${docId}`;
      await deleteDoc(doc(db, docPath));
      setItemToDelete(null);
    } catch (error) {
      console.error(`Error deleting from ${itemToDelete.collectionName}:`, error);
      setItemToDelete(null);
    }
  };

  const openEditModal = (item, modalType) => {
    setEditingItem(item);
    setModal(modalType);
  };

  const renderPage = () => {
    if (!user) return <HomePage transactions={[]} accounts={[]} expenseCategories={[]} incomeCategories={[]} onEdit={() => {}} />;
    switch (activePage) {
      case 'home':
        return <HomePage transactions={transactions} accounts={accounts} expenseCategories={expenseCategories} incomeCategories={incomeCategories} onEdit={openEditModal} />;
      case 'accounts':
        return <AccountsPage accounts={accounts} balances={accountBalances} onDelete={(id) => setItemToDelete({ collectionName: 'accounts', docId: id, message: '刪除帳戶將會影響相關交易，確定嗎？' })} onEdit={(item) => openEditModal(item, 'editAccount')} />;
      case 'categories':
        return <CategoriesPage expenseCategories={expenseCategories} incomeCategories={incomeCategories} onAdd={handleAdd} onUpdate={handleUpdate} onDelete={(coll, id) => setItemToDelete({ collectionName: coll, docId: id, message: '刪除分類會影響相關交易紀錄，確定嗎？' })} />;
      default:
        return <HomePage transactions={transactions} accounts={accounts} expenseCategories={expenseCategories} incomeCategories={incomeCategories} onEdit={openEditModal} />;
    }
  };

  const renderModal = () => {
    switch(modal) {
        case 'addTransactionMenu': return <AddTransactionMenu onClose={() => setModal(null)} onSelect={setModal} />;
        case 'addExpense': return <AddTransactionModal onClose={() => setModal(null)} onAdd={(data) => handleAdd('transactions', data)} accounts={accounts} categories={expenseCategories} type="expense" />;
        case 'addIncome': return <AddTransactionModal onClose={() => setModal(null)} onAdd={(data) => handleAdd('transactions', data)} accounts={accounts} categories={incomeCategories} type="income" />;
        case 'editTransaction': return <AddTransactionModal onClose={() => { setModal(null); setEditingItem(null);}} onUpdate={(id, data) => handleUpdate('transactions', id, data)} accounts={accounts} categories={editingItem.type === 'expense' ? expenseCategories : incomeCategories} type={editingItem.type} initialData={editingItem} />;
        case 'addTransfer': return <AddTransferModal onClose={() => setModal(null)} onAdd={handleTransfer} accounts={accounts} />;
        case 'addAccount': return <AddAccountModal onClose={() => setModal(null)} onAdd={(data) => handleAdd('accounts', data)} />;
        case 'editAccount': return <AddAccountModal onClose={() => { setModal(null); setEditingItem(null);}} onUpdate={(id, data) => handleUpdate('accounts', id, data)} initialData={editingItem} />;
        default: return null;
    }
  }

  if (firebaseError) {
      return (
          <div className="flex flex-col justify-center items-center min-h-screen bg-red-50 p-4">
              <div className="text-center">
                  <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
                  <h2 className="mt-4 text-xl font-bold text-red-800">應用程式設定錯誤</h2>
                  <p className="mt-2 text-red-700">{firebaseError}</p>
                  <p className="mt-4 text-sm text-gray-600">請確認您在部署平台 (如 Netlify) 的環境變數設定是否正確，並已重新部署。</p>
              </div>
          </div>
      );
  }

  return (
    <div className="bg-slate-50 font-sans antialiased">
      <div className="container mx-auto max-w-lg min-h-screen bg-slate-50">
        <Header user={user} onLogin={handleGoogleLogin} onLogout={handleLogout} totalAssets={totalAssets} activePage={activePage} />
        
        <main className="p-4 pb-24">
            {isLoading ? <LoadingSpinner /> : renderPage()}
        </main>
        
        {!isLoading && user && (
          <div className="fixed bottom-24 right-1/2 translate-x-1/2 z-20 sm:right-6 sm:translate-x-0">
               <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                      if (!user) {
                          handleGoogleLogin();
                          return;
                      }
                      if (activePage === 'home') setModal('addTransactionMenu');
                      else if (activePage === 'accounts') setModal('addAccount');
                      else if (activePage === 'categories') setModal('addCategory');
                      else setModal('addTransactionMenu');
                  }}
                  className="bg-sky-500 text-white rounded-full p-4 shadow-lg hover:bg-sky-600 focus:outline-none focus:ring-4 focus:ring-sky-300"
                  aria-label="新增項目"
                >
                  <Plus className="h-7 w-7" />
              </motion.button>
          </div>
        )}
        
        <BottomNav activePage={activePage} setActivePage={setActivePage} />
        <AnimatePresence>
            {modal && renderModal()}
            {itemToDelete && <ConfirmDeleteModal onConfirm={confirmDelete} onCancel={() => setItemToDelete(null)} message={itemToDelete.message} />}
        </AnimatePresence>
      </div>
    </div>
  );
}
