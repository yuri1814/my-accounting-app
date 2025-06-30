import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, onSnapshot, query, doc, deleteDoc, updateDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { Plus, Trash2, X, TrendingUp, Landmark, CreditCard, Wallet, MoreHorizontal, Home, Repeat, ArrowDown, ArrowUp, Smartphone, Shuffle, AlertTriangle } from 'lucide-react';

// --- Custom Icons (to avoid direct dependency) ---
const UtensilsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3z"/></svg>;
const ShoppingCartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.16"/></svg>;
const CarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><path d="M14 17H9"/><path d="M9 11h4"/><path d="m5 17-1 4"/><path d="m19 17 1 4"/><circle cx="6.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>;
const Gamepad2Icon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="6" x2="10" y1="12" y2="12"/><line x1="8" x2="8" y1="10" y2="14"/><path d="M17.5 15a3.5 3.5 0 0 0 0-7h-9a3.5 3.5 0 0 0-3.5 3.5v1A3.5 3.5 0 0 0 8.5 16H11"/><path d="M14.5 12H16"/></svg>;
const ReceiptIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h6"/><path d="M12 17.5v-11"/></svg>;
const BriefcaseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>;
const StarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;

// --- Firebase Configuration ---
// This reads the configuration from the environment variables you set up in Netlify.
const firebaseConfig = {
  apiKey: process.env.REACT_APP_API_KEY,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_PROJECT_ID,
  storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_APP_ID
};

// --- Initialize Firebase ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// --- Static Data ---
const expenseCategories = {
  '飲食': { icon: <UtensilsIcon />, color: 'bg-blue-100 text-blue-600' },
  '購物': { icon: <ShoppingCartIcon />, color: 'bg-green-100 text-green-600' },
  '交通': { icon: <CarIcon />, color: 'bg-yellow-100 text-yellow-600' },
  '娛樂': { icon: <Gamepad2Icon />, color: 'bg-purple-100 text-purple-600' },
  '帳單': { icon: <ReceiptIcon />, color: 'bg-red-100 text-red-600' },
  '投資': { icon: <TrendingUp className="h-5 w-5" />, color: 'bg-indigo-100 text-indigo-600' },
  '轉帳': { icon: <Shuffle className="h-5 w-5" />, color: 'bg-gray-100 text-gray-600' },
  '其他': { icon: <MoreHorizontal className="h-5 w-5" />, color: 'bg-gray-100 text-gray-600' },
};
const incomeCategories = {
  '薪水': { icon: <BriefcaseIcon />, color: 'bg-green-100 text-green-600' },
  '獎金': { icon: <StarIcon />, color: 'bg-yellow-100 text-yellow-600' },
  '投資收益': { icon: <TrendingUp className="h-5 w-5" />, color: 'bg-blue-100 text-blue-600' },
  '轉帳': { icon: <Shuffle className="h-5 w-5" />, color: 'bg-gray-100 text-gray-600' },
  '其他收入': { icon: <MoreHorizontal className="h-5 w-5" />, color: 'bg-gray-100 text-gray-600' },
};
const accountTypes = {
  '銀行帳戶': { icon: <Landmark className="h-5 w-5" /> },
  '信用卡': { icon: <CreditCard className="h-5 w-5" /> },
  '現金': { icon: <Wallet className="h-5 w-5" /> },
  '電子支付': { icon: <Smartphone className="h-5 w-5" /> },
  '其他資產': { icon: <MoreHorizontal className="h-5 w-5" /> },
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
                 {Object.keys(categories).map(catName => (
                    <button type="button" key={catName} onClick={() => onSelect(catName)} className={`flex flex-col items-center justify-center p-2 rounded-lg border-2 ${selected === catName ? `border-${baseColor}-500 bg-${baseColor}-50` : 'border-transparent bg-gray-100'}`}>
                        {React.cloneElement(categories[catName].icon, { className: 'h-5 w-5' })}
                        <span className={`text-xs mt-1 ${selected === catName ? `text-${baseColor}-600` : 'text-gray-600'}`}>{catName}</span>
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

const TransactionItem = ({ children, onEdit, isEditable = true }) => (
    <li onClick={isEditable ? onEdit : undefined} className={`flex items-center p-3 bg-white rounded-xl shadow-sm border border-gray-100 ${isEditable ? 'hover:shadow-md transition-shadow cursor-pointer' : ''}`}>
        {children}
    </li>
);

const ExpenseItem = ({ expense, account, onEdit }) => {
    const categoryInfo = expenseCategories[expense.category] || expenseCategories['其他'];
    const isTransfer = expense.category === '轉帳';
    return(
      <TransactionItem onEdit={onEdit} isEditable={!isTransfer}>
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${categoryInfo.color}`}>
          {isTransfer ? <Shuffle className="h-5 w-5" /> : <ArrowDown className="h-5 w-5" />}
        </div>
        <div className="flex-grow ml-4">
          <p className="font-medium text-gray-800">{expense.description}</p>
          <p className="text-xs text-gray-500">
            {account?.name || '未分類帳戶'} · {expense.date ? expense.date.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' }) : ''}
          </p>
        </div>
        <p className={`text-base font-semibold ${isTransfer ? 'text-gray-700' : 'text-red-600'}`}>
          - $ {Number(expense.amount).toLocaleString()}
        </p>
      </TransactionItem>
    );
};

const IncomeItem = ({ income, account, onEdit }) => {
    const categoryInfo = incomeCategories[income.category] || incomeCategories['其他收入'];
    const isTransfer = income.category === '轉帳';
    return(
      <TransactionItem onEdit={onEdit} isEditable={!isTransfer}>
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${categoryInfo.color}`}>
          {isTransfer ? <Shuffle className="h-5 w-5" /> : <ArrowUp className="h-5 w-5" />}
        </div>
        <div className="flex-grow ml-4">
          <p className="font-medium text-gray-800">{income.description}</p>
          <p className="text-xs text-gray-500">
            {account?.name || '未分類帳戶'} · {income.date ? income.date.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' }) : ''}
          </p>
        </div>
        <p className={`text-base font-semibold ${isTransfer ? 'text-gray-700' : 'text-green-600'}`}>
          + $ {Number(income.amount).toLocaleString()}
        </p>
      </TransactionItem>
    );
};


// --- Modal Components ---

const ModalWrapper = ({ children, onClose, title }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 relative animate-modal-pop-in" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
        <h3 className="text-xl font-semibold mb-6 text-center text-gray-800">{title}</h3>
        {children}
      </div>
    </div>
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

const AddExpenseModal = ({ onClose, onAdd, onUpdate, accounts, initialData }) => {
    const isEditMode = !!initialData;
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('飲食');
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
        }
    }, [initialData, isEditMode, accounts]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!description.trim() || !amount || !accountId) {
            setError('請填寫所有欄位');
            return;
        }
        const data = { description, amount: Number(amount), category, accountId };
        if (isEditMode) {
            onUpdate(initialData.id, data);
        } else {
            onAdd(data);
        }
    };

    return (
        <ModalWrapper onClose={onClose} title={isEditMode ? "編輯支出" : "新增一筆支出"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && <p className="text-red-500 text-sm text-center -mt-2 mb-2">{error}</p>}
                <InputField label="項目" value={description} onChange={e => setDescription(e.target.value)} placeholder="午餐便當" />
                <InputField label="金額" type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="100" />
                <InputField as="select" label="付款帳戶" value={accountId} onChange={e => setAccountId(e.target.value)}>
                    <option value="" disabled>請選擇帳戶</option>
                    {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                </InputField>
                <CategorySelector categories={expenseCategories} selected={category} onSelect={setCategory} type="expense" />
                <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700">{isEditMode ? "儲存更新" : "新增"}</button>
            </form>
        </ModalWrapper>
    );
};

const AddIncomeModal = ({ onClose, onAdd, onUpdate, accounts, initialData }) => {
    const isEditMode = !!initialData;
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('薪水');
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
        }
    }, [initialData, isEditMode, accounts]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!description.trim() || !amount || !accountId) {
            setError('請填寫所有欄位');
            return;
        }
        const data = { description, amount: Number(amount), category, accountId };
        if (isEditMode) {
            onUpdate(initialData.id, data);
        } else {
            onAdd(data);
        }
    };

    return (
        <ModalWrapper onClose={onClose} title={isEditMode ? "編輯收入" : "新增一筆收入"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && <p className="text-red-500 text-sm text-center -mt-2 mb-2">{error}</p>}
                <InputField label="項目" value={description} onChange={e => setDescription(e.target.value)} placeholder="六月薪水" />
                <InputField label="金額" type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="50000" />
                 <InputField as="select" label="存入帳戶" value={accountId} onChange={e => setAccountId(e.target.value)}>
                    <option value="" disabled>請選擇帳戶</option>
                    {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                </InputField>
                <CategorySelector categories={incomeCategories} selected={category} onSelect={setCategory} type="income" />
                <button type="submit" className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700">{isEditMode ? "儲存更新" : "新增"}</button>
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

const AddRecurringModal = ({ onClose, onAdd, onUpdate, accounts, initialData }) => {
    const isEditMode = !!initialData;
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [dayOfMonth, setDayOfMonth] = useState('1');
    const [paymentAccountId, setPaymentAccountId] = useState('');

    useEffect(() => {
        if (isEditMode) {
            setDescription(initialData.description);
            setAmount(initialData.amount);
            setDayOfMonth(initialData.dayOfMonth);
            setPaymentAccountId(initialData.paymentAccountId);
        } else {
            setPaymentAccountId(accounts[0]?.id || '');
        }
    }, [isEditMode, initialData, accounts]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!description.trim() || !amount || !paymentAccountId) return;
        const data = { description, amount: Number(amount), dayOfMonth: Number(dayOfMonth), paymentAccountId, category: '帳單' };
        if (isEditMode) {
            onUpdate(initialData.id, data);
        } else {
            onAdd(data);
        }
    }

    return (
        <ModalWrapper onClose={onClose} title={isEditMode ? "編輯定期支出" : "新增定期支出"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <InputField label="項目說明" value={description} onChange={e => setDescription(e.target.value)} placeholder="例如: Netflix" required />
                <InputField label="金額" type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="390" required/>
                <InputField label="每月扣款日" type="number" value={dayOfMonth} onChange={e => setDayOfMonth(e.target.value)} min="1" max="31" required/>
                <InputField as="select" label="付款帳戶" value={paymentAccountId} onChange={e => setPaymentAccountId(e.target.value)} required>
                    <option value="" disabled>請選擇</option>
                    {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                </InputField>
                <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700">{isEditMode ? "儲存更新" : "新增定期項目"}</button>
            </form>
        </ModalWrapper>
    );
};

const AddInstallmentModal = ({ onClose, onAdd, onUpdate, accounts, initialData }) => {
    const isEditMode = !!initialData;
    const [description, setDescription] = useState('');
    const [platform, setPlatform] = useState('');
    const [totalAmount, setTotalAmount] = useState('');
    const [totalInstallments, setTotalInstallments] = useState('');
    const [paidInstallments, setPaidInstallments] = useState(0);
    const [paymentAccountId, setPaymentAccountId] = useState('');

    useEffect(() => {
        if (isEditMode) {
            setDescription(initialData.description);
            setPlatform(initialData.platform);
            setTotalAmount(initialData.totalAmount);
            setTotalInstallments(initialData.totalInstallments);
            setPaidInstallments(initialData.paidInstallments || 0);
            setPaymentAccountId(initialData.paymentAccountId);
        } else {
            setPaymentAccountId(accounts[0]?.id || '');
        }
    }, [isEditMode, initialData, accounts]);
    
    const monthlyPayment = useMemo(() => {
        if (!totalAmount || !totalInstallments || Number(totalInstallments) === 0) return 0;
        return (Number(totalAmount) / Number(totalInstallments)).toFixed(0);
    }, [totalAmount, totalInstallments]);
    
    const handleSubmit = (e) => {
        e.preventDefault();
        if(!description.trim() || !totalAmount || !totalInstallments || !paymentAccountId) return;
        const data = { 
            description, platform, totalAmount: Number(totalAmount),
            totalInstallments: Number(totalInstallments), monthlyPayment: Number(monthlyPayment),
            paidInstallments: Number(paidInstallments), paymentAccountId
        };
        if (isEditMode) {
            onUpdate(initialData.id, data);
        } else {
            onAdd(data);
        }
    }

    return (
        <ModalWrapper onClose={onClose} title={isEditMode ? "編輯分期付款" : "新增分期付款"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <InputField label="商品名稱" value={description} onChange={e => setDescription(e.target.value)} placeholder="iPhone 16 Pro" required />
                <InputField label="購買平台" value={platform} onChange={e => setPlatform(e.target.value)} placeholder="Apple Store" />
                <div className="grid grid-cols-2 gap-4">
                    <InputField label="總金額" type="number" value={totalAmount} onChange={e => setTotalAmount(e.target.value)} required />
                    <InputField label="總期數" type="number" value={totalInstallments} onChange={e => setTotalInstallments(e.target.value)} required />
                </div>
                {isEditMode && <InputField label="已付期數" type="number" value={paidInstallments} onChange={e => setPaidInstallments(e.target.value)} required />}
                <InputField as="select" label="付款帳戶" value={paymentAccountId} onChange={e => setPaymentAccountId(e.target.value)} required>
                    <option value="" disabled>請選擇</option>
                    {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                </InputField>
                <div className="text-center bg-gray-100 p-2 rounded-lg">
                    <p className="text-sm text-gray-600">每月應繳金額</p>
                    <p className="text-lg font-bold text-blue-600">$ {Number(monthlyPayment).toLocaleString()}</p>
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700">{isEditMode ? "儲存更新" : "新增分期項目"}</button>
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

// --- Page Components ---

const HomePage = ({ expenses, incomes, accounts, onEdit }) => {
    const transactions = useMemo(() => {
        const combined = [
            ...expenses.map(e => ({ ...e, type: 'expense' })),
            ...incomes.map(i => ({ ...i, type: 'income' })),
        ];
        return combined.sort((a, b) => (b.date || 0) - (a.date || 0));
    }, [expenses, incomes]);

    return(
      <div>
        <h2 className="text-lg font-semibold text-gray-700 mb-4">最近交易紀錄</h2>
        {transactions.length === 0 ? (
          <div className="text-center py-10 px-4">
               <div className="inline-block bg-gray-100 rounded-full p-4"><TrendingUp className="h-10 w-10 text-gray-400" /></div>
               <h3 className="mt-4 text-lg font-medium text-gray-800">尚未有任何交易</h3>
               <p className="mt-1 text-sm text-gray-500">點擊右下角的 '+' 按鈕來新增第一筆帳目吧！</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {transactions.slice(0, 30).map(tx => {
                const account = accounts.find(a => a.id === tx.accountId);
                if (tx.type === 'expense') {
                    return <ExpenseItem key={`exp-${tx.id}`} expense={tx} account={account} onEdit={() => onEdit(tx, 'editExpense')} />;
                } else {
                    return <IncomeItem key={`inc-${tx.id}`} income={tx} account={account} onEdit={() => onEdit(tx, 'editIncome')} />;
                }
            })}
          </ul>
        )}
      </div>
    );
};

const AccountsPage = ({ accounts, balances, onDelete, onEdit }) => (
    <div>
        {accounts.length === 0 ? (
            <div className="text-center py-10 px-4">
                 <div className="inline-block bg-gray-100 rounded-full p-4"><Landmark className="h-10 w-10 text-gray-400" /></div>
                 <h3 className="mt-4 text-lg font-medium text-gray-800">尚未建立任何帳戶</h3>
                 <p className="mt-1 text-sm text-gray-500">點擊右下角的 '+' 按鈕來新增第一個帳戶。</p>
            </div>
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
                               <button onClick={(e) => { e.stopPropagation(); onDelete('accounts', acc.id); }} className="ml-4 text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                           </div>
                        </li>
                    )
                })}
            </ul>
        )}
    </div>
);

const RecurringPage = ({ recurring, installments, onAddExpense, onDelete, onEdit }) => {
    const [view, setView] = useState('recurring');

    const handleLogRecurring = (item) => {
        onAddExpense({
            description: item.description, amount: item.amount, category: '帳單',
            accountId: item.paymentAccountId, recurringId: item.id
        });
    }

    const handleLogInstallment = (item) => {
        onAddExpense({
            description: `${item.description} (第 ${ (item.paidInstallments || 0) + 1 } 期)`, amount: item.monthlyPayment,
            category: '帳單', accountId: item.paymentAccountId, installmentId: item.id
        });
    }

    return (
        <div>
            <div className="flex justify-center bg-gray-100 rounded-lg p-1 mb-5">
                <button onClick={() => setView('recurring')} className={`w-1/2 py-2 text-sm font-semibold rounded-md transition-colors ${view === 'recurring' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'}`}>定期支出</button>
                <button onClick={() => setView('installments')} className={`w-1/2 py-2 text-sm font-semibold rounded-md transition-colors ${view === 'installments' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'}`}>分期付款</button>
            </div>

            {view === 'recurring' && (
                <div id="recurring-section">
                     {recurring.length === 0 ? <p className="text-center text-gray-500 py-4">尚無定期支出項目</p> : (
                        <ul className="space-y-3">
                            {recurring.map(item => (
                                <li key={item.id} className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                                    <div onClick={() => onEdit(item, 'editRecurring')} className="flex-grow cursor-pointer">
                                        <p className="font-medium text-gray-800">{item.description}</p>
                                        <p className="text-xs text-gray-500">每月 {item.dayOfMonth} 日・$ {item.amount.toLocaleString()}</p>
                                    </div>
                                    <button onClick={() => handleLogRecurring(item)} className="ml-2 bg-blue-500 text-white text-xs font-bold py-1 px-3 rounded-full hover:bg-blue-600 flex-shrink-0">記錄本次</button>
                                </li>
                            ))}
                        </ul>
                     )}
                </div>
            )}

            {view === 'installments' && (
                <div id="installments-section">
                    {installments.length === 0 ? <p className="text-center text-gray-500 py-4">尚無分期付款項目</p> : (
                        <ul className="space-y-3">
                            {installments.map(item => {
                                const isPaidOff = (item.paidInstallments || 0) >= item.totalInstallments;
                                return (
                                <li key={item.id} className={`p-3 rounded-lg flex items-center justify-between ${isPaidOff ? 'bg-green-50' : 'bg-gray-50'}`}>
                                    <div onClick={() => onEdit(item, 'editInstallment')} className="flex-grow cursor-pointer">
                                        <p className="font-medium text-gray-800">{item.description}</p>
                                        <p className="text-xs text-gray-500">{item.platform}・$ {item.monthlyPayment.toLocaleString()}/月</p>
                                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                                            <div className="bg-blue-600 h-1.5 rounded-full" style={{width: `${((item.paidInstallments || 0)/item.totalInstallments)*100}%`}}></div>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">進度: {item.paidInstallments || 0} / {item.totalInstallments}</p>
                                    </div>
                                    {!isPaidOff ? (
                                        <button onClick={() => handleLogInstallment(item)} className="ml-2 bg-green-500 text-white text-xs font-bold py-1 px-3 rounded-full hover:bg-green-600 flex-shrink-0">繳本期</button>
                                    ) : (
                                        <span className="text-green-600 text-xs font-bold ml-2 flex-shrink-0">已付清</span>
                                    )}
                                </li>
                            )})}
                        </ul>
                     )}
                </div>
            )}
        </div>
    );
}

// --- Nav & Header Components ---

const Header = ({ totalAssets, activePage }) => {
    const titles = { home: '總覽', accounts: '我的帳戶', recurring: '定期與分期' };
    return(
        <header className="bg-blue-600 text-white p-6 rounded-b-3xl shadow-md sticky top-0 z-10">
            <div className="flex justify-between items-center mb-4">
                 <h1 className="text-xl font-bold">{titles[activePage]}</h1>
                 <p className="text-xs opacity-80">使用者ID: {auth.currentUser?.uid.substring(0, 8) || '訪客'}</p>
            </div>
            {activePage === 'home' && (
                <div className="text-center">
                    <p className="text-sm opacity-90">目前總資產</p>
                    <p className="text-4xl font-extrabold tracking-tight mt-1">
                        $ {totalAssets.toLocaleString()}
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
    { id: 'recurring', icon: <Repeat />, label: '定期' },
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
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [userId, setUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Data states
  const [expenses, setExpenses] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [recurring, setRecurring] = useState([]);
  const [installments, setInstallments] = useState([]);

  // UI states
  const [activePage, setActivePage] = useState('home');
  const [modal, setModal] = useState(null); 
  const [editingItem, setEditingItem] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);

  // --- Authentication ---
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        setIsAuthReady(true);
      } else {
        try {
          // In a real app, you might use a more robust token management system.
          // For this example, we'll try to sign in anonymously.
          await signInAnonymously(auth);
        } catch (error) {
          console.error("Authentication Error:", error);
          setIsAuthReady(true);
        }
      }
    });
    return () => unsubAuth();
  }, []);

  // --- Data Fetching ---
  useEffect(() => {
    if (!isAuthReady || !userId) {
        if (isAuthReady && !userId) setIsLoading(false);
        return;
    }

    const collectionsToFetch = [
        { name: 'expenses', setter: setExpenses },
        { name: 'incomes', setter: setIncomes },
        { name: 'accounts', setter: setAccounts },
        { name: 'recurring', setter: setRecurring },
        { name: 'installments', setter: setInstallments },
    ];
    
    setIsLoading(true);
    let loadedCount = 0;
    const unsubs = collectionsToFetch.map(({ name, setter }) => {
        const collPath = `users/${userId}/${name}`;
        const q = query(collection(db, collPath));
        return onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                date: doc.data().date?.toDate(),
                createdAt: doc.data().createdAt?.toDate(),
                lastLoggedDate: doc.data().lastLoggedDate?.toDate(),
            }));
            data.sort((a, b) => (b.createdAt || b.date || 0) - (a.createdAt || a.date || 0));
            setter(data);
            loadedCount++;
            if (loadedCount === collectionsToFetch.length) {
                setIsLoading(false);
            }
        }, (error) => {
            console.error(`Error fetching ${name}:`, error);
            loadedCount++;
            if (loadedCount === collectionsToFetch.length) {
                setIsLoading(false);
            }
        });
    });
    
    return () => {
        unsubs.forEach(unsub => unsub());
    };
  }, [isAuthReady, userId]);

  // --- Calculations ---
  const accountBalances = useMemo(() => {
    const balances = new Map();
    accounts.forEach(acc => {
      const expensesForAccount = expenses.filter(ex => ex.accountId === acc.id);
      const incomesForAccount = incomes.filter(inc => inc.accountId === acc.id);
      const totalSpent = expensesForAccount.reduce((sum, ex) => sum + Number(ex.amount), 0);
      const totalGained = incomesForAccount.reduce((sum, inc) => sum + Number(inc.amount), 0);
      balances.set(acc.id, Number(acc.initialBalance) - totalSpent + totalGained);
    });
    return balances;
  }, [accounts, expenses, incomes]);

  const totalAssets = useMemo(() => {
    return Array.from(accountBalances.values()).reduce((sum, bal) => sum + bal, 0);
  }, [accountBalances]);

  // --- Handlers ---
  const handleAdd = async (collectionName, data) => {
    if (!userId) return;
    try {
        const collPath = `users/${userId}/${collectionName}`;
        await addDoc(collection(db, collPath), { ...data, createdAt: serverTimestamp(), date: serverTimestamp() });
        setModal(null);
    } catch (error) {
        console.error(`Error adding to ${collectionName}:`, error);
    }
  };
  
  const handleUpdate = async (collectionName, docId, data) => {
    if (!userId) return;
    try {
      const docPath = `users/${userId}/${collectionName}/${docId}`;
      const { id, ...updateData } = data; // Don't try to write the id field back to the doc
      await updateDoc(doc(db, docPath), updateData);
      setModal(null);
      setEditingItem(null);
    } catch (error) {
      console.error(`Error updating ${collectionName}:`, error);
    }
  };

  const handleAddExpense = async (expenseData) => {
      if (!userId) return;
      const batch = writeBatch(db);

      const expensesColPath = `users/${userId}/expenses`;
      const newExpenseRef = doc(collection(db, expensesColPath));
      batch.set(newExpenseRef, { ...expenseData, createdAt: serverTimestamp(), date: serverTimestamp() });

      if(expenseData.installmentId) {
          const installment = installments.find(i => i.id === expenseData.installmentId);
          if (installment) {
              const installmentRef = doc(db, `users/${userId}/installments`, expenseData.installmentId);
              batch.update(installmentRef, {
                  paidInstallments: (installment.paidInstallments || 0) + 1
              });
          }
      }
      
      if(expenseData.recurringId) {
          const recurringRef = doc(db, `users/${userId}/recurring`, expenseData.recurringId);
          batch.update(recurringRef, { lastLoggedDate: serverTimestamp() });
      }

      await batch.commit();
      setModal(null);
  }

  const handleTransfer = async (transferData) => {
      if (!userId) return;
      
      const batch = writeBatch(db);
      const now = serverTimestamp();

      // 1. Create expense
      const expenseRef = doc(collection(db, `users/${userId}/expenses`));
      batch.set(expenseRef, {
        amount: transferData.amount,
        accountId: transferData.fromAccountId,
        category: '轉帳',
        description: transferData.description,
        date: now,
        createdAt: now,
      });

      // 2. Create income
      const incomeRef = doc(collection(db, `users/${userId}/incomes`));
       batch.set(incomeRef, {
        amount: transferData.amount,
        accountId: transferData.toAccountId,
        category: '轉帳',
        description: transferData.description,
        date: now,
        createdAt: now,
      });

      await batch.commit();
      setModal(null);
  }

  const confirmDelete = async () => {
      if (!userId || !itemToDelete) return;
      try {
        const { collectionName, docId } = itemToDelete;
        const docPath = `users/${userId}/${collectionName}/${docId}`;
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

  // --- Render Logic ---
  const renderPage = () => {
    switch (activePage) {
      case 'home':
        return <HomePage expenses={expenses} incomes={incomes} accounts={accounts} onEdit={openEditModal} />;
      case 'accounts':
        return <AccountsPage accounts={accounts} balances={accountBalances} onDelete={(id) => setItemToDelete({ collectionName: 'accounts', docId: id, message: '刪除帳戶將會一併刪除其所有交易紀錄，確定嗎？' })} onEdit={(item) => openEditModal(item, 'editAccount')} />;
      case 'recurring':
        return <RecurringPage recurring={recurring} installments={installments} onAddExpense={handleAddExpense} onDelete={(type, id) => setItemToDelete({ collectionName: type, docId: id, message: '確定要刪除這個項目嗎？' })} onEdit={openEditModal} />;
      default:
        return <HomePage expenses={expenses} incomes={incomes} accounts={accounts} onEdit={openEditModal} />;
    }
  };

  const renderModal = () => {
    switch(modal) {
        case 'addTransactionMenu': return <AddTransactionMenu onClose={() => setModal(null)} onSelect={setModal} />;
        case 'addRecurringOrInstallment': return <AddRecurringMenuModal onClose={() => setModal(null)} onSelect={setModal} />;
        case 'addExpense': return <AddExpenseModal onClose={() => setModal(null)} onAdd={handleAddExpense} accounts={accounts} />;
        case 'editExpense': return <AddExpenseModal onClose={() => { setModal(null); setEditingItem(null);}} onUpdate={(id, data) => handleUpdate('expenses', id, data)} accounts={accounts} initialData={editingItem} />;
        case 'addIncome': return <AddIncomeModal onClose={() => setModal(null)} onAdd={(data) => handleAdd('incomes', data)} accounts={accounts} />;
        case 'editIncome': return <AddIncomeModal onClose={() => { setModal(null); setEditingItem(null);}} onUpdate={(id, data) => handleUpdate('incomes', id, data)} accounts={accounts} initialData={editingItem} />;
        case 'addTransfer': return <AddTransferModal onClose={() => setModal(null)} onAdd={handleTransfer} accounts={accounts} />;
        case 'addAccount': return <AddAccountModal onClose={() => setModal(null)} onAdd={(data) => handleAdd('accounts', data)} />;
        case 'editAccount': return <AddAccountModal onClose={() => { setModal(null); setEditingItem(null);}} onUpdate={(id, data) => handleUpdate('accounts', id, data)} initialData={editingItem} />;
        case 'addRecurring': return <AddRecurringModal onClose={() => setModal(null)} onAdd={(data) => handleAdd('recurring', data)} accounts={accounts} />;
        case 'editRecurring': return <AddRecurringModal onClose={() => { setModal(null); setEditingItem(null);}} onUpdate={(id, data) => handleUpdate('recurring', id, data)} accounts={accounts} initialData={editingItem} />;
        case 'addInstallment': return <AddInstallmentModal onClose={() => setModal(null)} onAdd={(data) => handleAdd('installments', data)} accounts={accounts} />;
        case 'editInstallment': return <AddInstallmentModal onClose={() => { setModal(null); setEditingItem(null);}} onUpdate={(id, data) => handleUpdate('installments', id, data)} accounts={accounts} initialData={editingItem} />;
        default: return null;
    }
  }

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen bg-gray-50"><p>讀取中...</p></div>;
  }

  return (
    <div className="bg-gray-50 font-sans antialiased">
      <div className="container mx-auto max-w-lg min-h-screen bg-white shadow-lg flex flex-col">
        <Header totalAssets={totalAssets} activePage={activePage} />
        
        <main className="flex-grow p-4 pb-24">
            {renderPage()}
        </main>
        
        {!isLoading && (
          <div className="fixed bottom-24 right-1/2 translate-x-1/2 z-20 sm:right-6 sm:translate-x-0">
               <button
                  onClick={() => {
                      if (activePage === 'home') setModal('addTransactionMenu');
                      else if (activePage === 'accounts') setModal('addAccount');
                      else if (activePage === 'recurring') setModal('addRecurringOrInstallment');
                      else setModal('addTransactionMenu');
                  }}
                  className="bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-transform duration-200 ease-in-out transform hover:scale-110"
                  aria-label="新增項目"
                >
                  <Plus className="h-7 w-7" />
              </button>
          </div>
        )}
        
        <BottomNav activePage={activePage} setActivePage={setActivePage} />
        {renderModal()}
        {itemToDelete && <ConfirmDeleteModal onConfirm={confirmDelete} onCancel={() => setItemToDelete(null)} message={itemToDelete.message} />}
      </div>
    </div>
  );
}
