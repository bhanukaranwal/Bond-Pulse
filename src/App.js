import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, Cell, ScatterChart, Scatter, ZAxis, ComposedChart, PieChart, Pie, Treemap } from 'recharts';
import { TrendingUp, Zap, Shield, Clock, Briefcase, Info, ArrowRight, DollarSign, Percent, Calendar, SlidersHorizontal, ArrowDown, ArrowUp, Activity, Sun, Moon, Sparkles, Droplets, Settings, Save, FolderOpen, RefreshCw, Target as TargetIcon, PieChart as PieIcon } from 'lucide-react';

// --- DATA SIMULATION UTILS ---

const generateBondName = (issuer, rating) => {
    const coupon = (Math.random() * 4 + 1.5).toFixed(2);
    const year = Math.floor(Math.random() * 10) + 2026;
    return `${issuer} ${coupon}% ${year} (${rating})`;
};

const generateArbitrageOpportunities = (count = 100) => {
    const opportunities = [];
    const types = ['Cash-and-Carry', 'Yield Curve', 'Credit Spread', 'Relative Value'];
    const issuers = ['Apple Inc', 'Govt. of USA', 'Microsoft Corp', 'JPMorgan Chase', 'Ford Motor Co.', 'Verizon Comm.', 'Toyota Motors', 'Pfizer Inc.'];
    const ratings = ['AAA', 'AA+', 'A-', 'BBB+', 'BB', 'B+'];

    for (let i = 0; i < count; i++) {
        const ratingA = ratings[Math.floor(Math.random() * ratings.length)];
        const ratingB = ratings[Math.floor(Math.random() * ratings.length)];
        const issuerA = issuers[Math.floor(Math.random() * issuers.length)];
        let issuerB = issuers[Math.floor(Math.random() * issuers.length)];
        while (issuerA === issuerB) { issuerB = issuers[Math.floor(Math.random() * issuers.length)]; }

        const bondA = generateBondName(issuerA, ratingA);
        const bondB = generateBondName(issuerB, ratingB);
        
        const profit = parseFloat((Math.random() * 0.5 + 0.05).toFixed(4));
        const riskScore = Math.floor(Math.random() * 100);
        
        opportunities.push({
            id: i, bondA, bondB, issuerA, issuerB, ratingA, ratingB,
            liquidity: (Math.random() * 9 + 1).toFixed(1),
            type: types[Math.floor(Math.random() * types.length)],
            potentialProfit: parseFloat((profit * 100).toFixed(2)),
            riskScore: riskScore,
            durationA: (Math.random() * 5 + 2).toFixed(2),
            yieldA: (Math.random() * 3 + 2.5).toFixed(2),
            durationB: (Math.random() * 5 + 2).toFixed(2),
            yieldB: (Math.random() * 3 + 2.5).toFixed(2),
        });
    }
    return opportunities;
};

const generateYieldCurve = () => {
    const maturities = ['1M', '3M', '6M', '1Y', '2Y', '3Y', '5Y', '7Y', '10Y', '20Y', '30Y'];
    let lastYield = 2.5;
    return maturities.map((m, i) => {
        lastYield += Math.random() * 0.3 - 0.05;
        return { maturity: m, yield: parseFloat(lastYield.toFixed(2)), index: i };
    });
};

const simulateYieldCurveScenario = (baseCurve, scenario) => {
    return baseCurve.map(point => {
        let newYield = point.yield;
        switch(scenario) {
            case 'Parallel Up': newYield += 0.5; break;
            case 'Parallel Down': newYield -= 0.5; break;
            case 'Steepener': newYield += (point.index / baseCurve.length) * 0.75; break;
            case 'Flattener': newYield -= (point.index / baseCurve.length) * 0.75; break;
            default: break;
        }
        return { ...point, scenarioYield: parseFloat(newYield.toFixed(2)) };
    });
};

const runBacktest = (opportunities, strategy, params) => {
    let filteredOps;
    switch(strategy) {
        case 'Custom': filteredOps = opportunities.filter(op => op.potentialProfit >= params.minProfit && op.riskScore <= params.maxRisk); break;
        default: filteredOps = opportunities.filter(op => op.potentialProfit > 20 && op.riskScore < 60);
    }
    let equity = 100000, wins = 0, losses = 0;
    const equityCurve = [{date: 'Start', value: equity}];
    const tradeLog = [];
    
    filteredOps.forEach((op, i) => {
        const outcome = op.potentialProfit * (Math.random() * 1.5 + 0.5);
        if (outcome >= op.potentialProfit * 0.8) wins++; else losses++;
        equity += outcome;
        equityCurve.push({date: `Trade ${i+1}`, value: equity});
        tradeLog.push({ id: op.id, pair: `${op.bondA.split(' ')[0]} / ${op.bondB.split(' ')[0]}`, profit: outcome.toFixed(2), status: outcome > 0 ? 'Win' : 'Loss' });
    });
    const finalValue = equity;
    const totalReturn = (finalValue / 100000 - 1) * 100;
    const returns = equityCurve.slice(1).map((v, i) => (v.value / equityCurve[i].value) - 1);
    const avgReturn = returns.length > 0 ? returns.reduce((s, r) => s + r, 0) / returns.length : 0;
    const stdDev = returns.length > 0 ? Math.sqrt(returns.reduce((s, r) => s + Math.pow(r - avgReturn, 2), 0) / returns.length) : 0;
    const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0;
    let maxDrawdown = 0, peak = -Infinity;
    equityCurve.forEach(p => { if (p.value > peak) peak = p.value; const drawdown = (peak - p.value) / peak; if (drawdown > maxDrawdown) maxDrawdown = drawdown; });
    return { equityCurve, totalReturn: totalReturn.toFixed(2), sharpeRatio: sharpeRatio.toFixed(2), maxDrawdown: (maxDrawdown * 100).toFixed(2), trades: filteredOps.length, winLossRatio: losses > 0 ? (wins/losses).toFixed(2) : 'inf', tradeLog };
};

// Other simulation functions remain the same...
const generateEconomicCalendar = () => { const today = new Date(); const events = [ { daysFromNow: 2, time: '8:30 AM', event: 'US CPI Data Release (MoM)', importance: 'High' }, { daysFromNow: 8, time: '2:00 PM', event: 'FOMC Meeting Statement', importance: 'High' }, { daysFromNow: 15, time: '10:00 AM', event: 'Crude Oil Inventories', importance: 'Medium' } ]; return events.map(e => { const eventDate = new Date(today); eventDate.setDate(today.getDate() + e.daysFromNow); return { ...e, date: eventDate.toLocaleDateString() }; }); };
const generateYieldSpreadData = (yieldA, yieldB) => { const data = []; let spread = yieldA - yieldB, vol = 0.1; for (let i = 90; i > 0; i--) { const shock = (Math.random() - 0.5) * 0.1; spread += shock; vol = Math.sqrt(0.1 * (0.1**2) + 0.8 * vol**2 + 0.1 * shock**2); data.push({daysAgo: i, spread: spread.toFixed(2), volatility: vol.toFixed(2)}); } return data; };
const simulateAssetNews = (issuerA, issuerB) => { const headlines = { 'Apple Inc': ["Reports record iPhone sales.", "Faces new regulatory scrutiny in Europe."], 'Govt. of USA': ["Treasury announces larger than expected bond auction."], 'Microsoft Corp': ["Announces major AI partnership."], 'JPMorgan Chase': ["Posts record profits on trading revenue."], 'Ford Motor Co.': ["EV sales beat expectations."], 'Default': ["Broader market sentiment remains cautious."] }; return [ ...(headlines[issuerA] || headlines['Default']), ...(headlines[issuerB] || headlines['Default']) ]; };
const simulateEfficientFrontier = (assets) => { if (assets.length === 0) return { points: [], minVolPortfolio: null, maxSharpePortfolio: null }; const points = []; for (let i = 0; i < 1000; i++) { let weights = assets.map(() => Math.random()); const totalWeight = weights.reduce((s, w) => s + w, 0); if (totalWeight === 0) continue; weights = weights.map(w => w / totalWeight); const expectedReturn = weights.reduce((acc, w, j) => acc + w * (Math.random() * 0.1 - 0.02), 0); const volatility = Math.sqrt(weights.reduce((acc, w, j) => acc + Math.pow(w, 2) * Math.pow(Math.random() * 0.2 + 0.05, 2), 0)); points.push({ x: volatility * 100, y: expectedReturn * 100, z: (expectedReturn / volatility) || 0, weights }); } if (points.length === 0) return { points: [], minVolPortfolio: null, maxSharpePortfolio: null }; const minVolPortfolio = points.reduce((min, p) => p.x < min.x ? p : min, points[0]); const maxSharpePortfolio = points.reduce((max, p) => p.z > max.z ? p : max, points[0]); return { points, minVolPortfolio, maxSharpePortfolio }; };
const generateMarketInternalsData = () => { const creditSpread = []; let spread = 1.5; for (let i = 180; i > 0; i--) { spread += (Math.random() - 0.5) * 0.05; spread = Math.max(0.5, spread); creditSpread.push({daysAgo: i, spread: spread.toFixed(2)}); } const issuanceVolume = [ { name: 'New Issues', value: Math.floor(Math.random() * 50 + 50) }, { name: 'Off-the-Run', value: Math.floor(Math.random() * 20 + 30) }, ]; return { creditSpread, issuanceVolume }; };

// --- UI COMPONENTS ---

const InfoTooltip = ({ text }) => ( <div className="relative flex items-center group ml-1"><Info className="h-4 w-4 text-gray-400 cursor-pointer" /><div className="absolute bottom-full mb-2 w-56 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-50">{text}</div></div> );
const StatCard = ({ icon, title, value, unit }) => ( <div className="bg-white dark:bg-gray-800/50 p-4 rounded-lg shadow-md flex items-center"><div className="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 p-3 rounded-full mr-4">{icon}</div><div><p className="text-sm text-gray-500 dark:text-gray-400">{title}</p><p className="text-xl font-bold text-gray-800 dark:text-gray-200">{value} <span className="text-sm font-normal">{unit}</span></p></div></div> );
const TabButton = ({ label, isActive, onClick }) => ( <button onClick={onClick} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${isActive ? 'bg-blue-600 text-white shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>{label}</button> );

const TradeDetailModal = ({ opportunity, onClose }) => {
    if (!opportunity) return null;
    const [aiAnalysis, setAiAnalysis] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const yieldSpreadData = generateYieldSpreadData(opportunity.yieldA, opportunity.yieldB);
    const assetNews = simulateAssetNews(opportunity.issuerA, opportunity.issuerB);

    const generateAiAnalysis = async () => {
        setIsGenerating(true); setAiAnalysis('');
        const prompt = `Analyze the following bond arbitrage opportunity and provide a brief, professional summary (2-3 sentences). - Trade Type: ${opportunity.type} - Leg A (Buy): ${opportunity.bondA} - Leg B (Sell): ${opportunity.bondB} - Potential Profit: $${opportunity.potentialProfit} per $100k notional - Risk Score: ${opportunity.riskScore}/100 - Key Risks: Duration mismatch of ${(opportunity.durationA - opportunity.durationB).toFixed(2)}, Credit rating difference between ${opportunity.ratingA} and ${opportunity.ratingB}. Synthesize these points into a coherent trade summary. Explain the rationale and primary risks.`;
        await new Promise(resolve => setTimeout(resolve, 1500));
        const mockResponse = `This ${opportunity.type} opportunity capitalizes on a perceived mispricing between ${opportunity.bondA} and ${opportunity.bondB}, offering a potential profit of $${opportunity.potentialProfit} per $100k notional. The primary risks involve interest rate sensitivity due to a duration mismatch of ${(opportunity.durationA - opportunity.durationB).toFixed(2)} years and potential credit spread widening between the A-rated and B-rated bonds. The trade appears attractive given its moderate risk score of ${opportunity.riskScore}.`;
        setAiAnalysis(mockResponse); setIsGenerating(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" onClick={onClose}>
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-xl w-full max-w-5xl text-gray-800 dark:text-gray-200" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4"><h2 className="text-2xl font-bold">Arbitrage Trade Detail</h2><button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-300 text-2xl">&times;</button></div>
                <div className="bg-blue-50 dark:bg-gray-800 border border-blue-200 dark:border-gray-700 p-4 rounded-lg mb-4 text-center"><h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300">Recommended Trade</h3><div className="flex items-center justify-center mt-2 text-md"><span className="text-green-600 font-medium">BUY {opportunity.bondA}</span><ArrowRight className="mx-4 text-gray-500 dark:text-gray-400"/><span className="text-red-600 font-medium">SELL {opportunity.bondB}</span></div></div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><h4 className="font-semibold md:col-span-2">Risk & Return Metrics</h4><div><h5 className="font-semibold mb-2">Leg A: {opportunity.bondA}</h5><div className="text-sm space-y-1"><p className="flex justify-between"><span>Yield:</span> <span className="font-medium">{opportunity.yieldA}%</span></p><p className="flex justify-between"><span>Duration:</span> <span className="font-medium">{opportunity.durationA}</span></p><p className="flex justify-between"><span>Liquidity Score:</span> <span className="font-medium">{`${opportunity.liquidity}/10`}</span></p></div></div><div><h5 className="font-semibold mb-2">Leg B: {opportunity.bondB}</h5><div className="text-sm space-y-1"><p className="flex justify-between"><span>Yield:</span> <span className="font-medium">{opportunity.yieldB}%</span></p><p className="flex justify-between"><span>Duration:</span> <span className="font-medium">{opportunity.durationB}</span></p><p className="flex justify-between"><span>Credit Rating:</span> <span className="font-medium">{opportunity.ratingB}</span></p></div></div></div>
                        <div className="border-t dark:border-gray-700 pt-4"><h4 className="font-semibold mb-2">Yield Spread Analysis (90-Day History)</h4><div style={{width: '100%', height: 150}}><ResponsiveContainer><AreaChart data={yieldSpreadData}><CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.2)"/><XAxis dataKey="daysAgo" tick={{fontSize: 10}} reversed={true} unit="d ago" /><YAxis yAxisId="left" tick={{fontSize: 10}} unit="%"/><YAxis yAxisId="right" orientation="right" tick={{fontSize: 10}} unit="%"/><Tooltip formatter={(v,n) => [`${v}%`, n]}/><Area yAxisId="left" type="monotone" dataKey="spread" name="Spread" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} /><Line yAxisId="right" type="monotone" dataKey="volatility" name="Volatility" stroke="#82ca9d" dot={false} /></AreaChart></ResponsiveContainer></div></div>
                    </div>
                    <div className="space-y-4">
                        <div><h4 className="font-semibold mb-2 flex items-center">AI-Powered Analysis <InfoTooltip text="A generative AI summary of the trade's rationale and risks."/></h4><button onClick={generateAiAnalysis} disabled={isGenerating} className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center justify-center disabled:bg-gray-400"><Sparkles className="h-4 w-4 mr-2"/>{isGenerating ? 'Generating...' : 'Generate AI Analysis'}</button>{isGenerating && <div className="mt-2 text-sm text-gray-500">Contacting AI model...</div>}{aiAnalysis && <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm leading-6">{aiAnalysis}</div>}</div>
                        <div><h4 className="font-semibold mb-2">Relevant News</h4><div className="space-y-2 text-xs max-h-48 overflow-y-auto pr-2">{assetNews.map((headline, i) => <div key={i} className="p-2 bg-gray-50 dark:bg-gray-800 rounded">{headline}</div>)}</div></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MarketSentimentGauge = ({ value }) => {
    const rotation = (value / 100) * 180 - 90;
    const color = value < 30 ? 'text-red-500' : value > 70 ? 'text-green-500' : 'text-yellow-500';
    return ( <div className="bg-white dark:bg-gray-800/50 p-4 rounded-lg shadow-md"><h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2 text-center">Market Sentiment</h3><div className="relative h-24 w-full"><div className="absolute top-0 left-0 w-full h-full"><div className="w-full h-1/2 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-t-full"></div></div><div className="absolute bottom-0 left-1/2 w-4 h-4 bg-white dark:bg-gray-800 rounded-full -translate-x-1/2"></div><div className="absolute bottom-0 left-1/2 w-1 h-12 bg-gray-600 dark:bg-gray-300 origin-bottom transition-transform duration-500" style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }}></div></div><div className={`text-center mt-2 font-bold text-xl ${color}`}>{value < 30 ? 'Fear' : value > 70 ? 'Greed' : 'Neutral'}</div></div> );
};

const SettingsModal = ({ isOpen, onClose, apiKey, setApiKey, onSave }) => {
    if (!isOpen) return null;
    return ( <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" onClick={onClose}><div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}><h2 className="text-xl font-bold mb-4">Settings</h2><div className="mb-4"><label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Alpha Vantage API Key</label><input type="text" id="apiKey" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="Enter your API key" className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" /><p className="text-xs text-gray-500 mt-1">Get a free API key from Alpha Vantage for live data.</p></div><div className="flex justify-end space-x-2"><button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600">Cancel</button><button onClick={onSave} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Save & Refresh</button></div></div></div> );
};

// --- MAIN APP COMPONENT ---

export default function App() {
    const [time, setTime] = useState(new Date());
    const [opportunities, setOpportunities] = useState([]);
    const [yieldCurve, setYieldCurve] = useState([]);
    const [yieldCurveScenario, setYieldCurveScenario] = useState('None');
    const [economicCalendar, setEconomicCalendar] = useState([]);
    const [marketInternals, setMarketInternals] = useState({ creditSpread: [], issuanceVolume: [] });
    const [selectedOpportunity, setSelectedOpportunity] = useState(null);
    const [activeTab, setActiveTab] = useState('Opportunities');
    const [backtestResults, setBacktestResults] = useState(null);
    const [backtestStrategy, setBacktestStrategy] = useState('Balanced');
    const [backtestParams, setBacktestParams] = useState({ minProfit: 20, maxRisk: 70 });
    const [theme, setTheme] = useState('light');
    const [optimizationTarget, setOptimizationTarget] = useState('maxSharpe');
    const [isSettingsOpen, setSettingsOpen] = useState(false);
    const [apiKey, setApiKey] = useState('');
    const [dataSource, setDataSource] = useState('SIMULATED');
    const [aiPortfolioSummary, setAiPortfolioSummary] = useState('');
    const [isGeneratingPortfolioSummary, setIsGeneratingPortfolioSummary] = useState(false);
    
    // Filters
    const [typeFilter, setTypeFilter] = useState('All');
    const [riskFilter, setRiskFilter] = useState(100);
    const [profitFilter, setProfitFilter] = useState(0);

    // Sorting
    const [sortConfig, setSortConfig] = useState({ key: 'potentialProfit', direction: 'desc' });

    const fetchData = useCallback(async () => {
        if (apiKey) setDataSource('LIVE (FALLBACK)'); else setDataSource('SIMULATED');
        const data = generateArbitrageOpportunities();
        setOpportunities(data);
        setYieldCurve(generateYieldCurve());
        setEconomicCalendar(generateEconomicCalendar());
        setMarketInternals(generateMarketInternalsData());
    }, [apiKey]);

    useEffect(() => { const timer = setInterval(() => setTime(new Date()), 1000); fetchData(); return () => clearInterval(timer); }, [fetchData]);
    useEffect(() => { if (theme === 'dark') document.documentElement.classList.add('dark'); else document.documentElement.classList.remove('dark'); }, [theme]);

    const sortedAndFilteredOpportunities = useMemo(() => {
        let items = [...opportunities];
        if (typeFilter !== 'All') items = items.filter(op => op.type === typeFilter);
        items = items.filter(op => op.riskScore <= riskFilter);
        items = items.filter(op => op.potentialProfit >= profitFilter);
        items.sort((a, b) => { if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1; if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1; return 0; });
        return items;
    }, [opportunities, typeFilter, riskFilter, profitFilter, sortConfig]);
    
    const requestSort = (key) => { let direction = 'asc'; if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc'; setSortConfig({ key, direction }); };
    const handleRunBacktest = () => setBacktestResults(runBacktest(opportunities, backtestStrategy, backtestParams));
    const getRiskColor = (score) => { if (score > 75) return 'text-red-600 bg-red-100 dark:bg-red-900/50 dark:text-red-300'; if (score > 40) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/50 dark:text-yellow-300'; return 'text-green-600 bg-green-100 dark:bg-green-900/50 dark:text-green-300'; };
    const getImportanceColor = (level) => { if (level === 'High') return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'; if (level === 'Medium') return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'; return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'; };

    const portfolioDuration = useMemo(() => (sortedAndFilteredOpportunities.reduce((sum, op) => sum + parseFloat(op.durationA), 0) / sortedAndFilteredOpportunities.length || 0).toFixed(2), [sortedAndFilteredOpportunities]);
    const portfolioYield = useMemo(() => (sortedAndFilteredOpportunities.reduce((sum, op) => sum + parseFloat(op.yieldA), 0) / sortedAndFilteredOpportunities.length || 0).toFixed(2), [sortedAndFilteredOpportunities]);
    const portfolioLiquidity = useMemo(() => (sortedAndFilteredOpportunities.reduce((sum, op) => sum + parseFloat(op.liquidity), 0) / sortedAndFilteredOpportunities.length || 0).toFixed(1), [sortedAndFilteredOpportunities]);
    const efficientFrontier = useMemo(() => simulateEfficientFrontier(sortedAndFilteredOpportunities.map(op => op.bondA)), [sortedAndFilteredOpportunities]);
    const optimalPortfolio = optimizationTarget === 'maxSharpe' ? efficientFrontier.maxSharpePortfolio : efficientFrontier.minVolPortfolio;
    const portfolioComposition = useMemo(() => {
        const comp = sortedAndFilteredOpportunities.reduce((acc, op) => {
            acc[op.type] = (acc[op.type] || 0) + 1;
            return acc;
        }, {});
        return Object.entries(comp).map(([name, value]) => ({ name, value }));
    }, [sortedAndFilteredOpportunities]);
    
    const displayedYieldCurve = useMemo(() => simulateYieldCurveScenario(yieldCurve, yieldCurveScenario), [yieldCurve, yieldCurveScenario]);

    const generateAiPortfolioSummary = async () => {
        setIsGeneratingPortfolioSummary(true); setAiPortfolioSummary('');
        const yieldCurveSlope = (yieldCurve.slice(-1)[0]?.yield - yieldCurve[0]?.yield).toFixed(2);
        const prompt = `Provide a high-level market summary based on this data: - Number of active arbitrage opportunities: ${sortedAndFilteredOpportunities.length}. - Average risk score: ${(sortedAndFilteredOpportunities.reduce((s, op) => s + op.riskScore, 0) / sortedAndFilteredOpportunities.length).toFixed(0)}. - Yield curve slope (30Y-1M): ${yieldCurveSlope}%. - Market Sentiment: Fear. Synthesize this into a 2-sentence strategic outlook.`;
        await new Promise(resolve => setTimeout(resolve, 1500));
        const mockResponse = `The market presents a moderate number of arbitrage opportunities (${sortedAndFilteredOpportunities.length}) with a manageable average risk profile. However, the current 'Fear' sentiment and a flat yield curve (${yieldCurveSlope}%) suggest a cautious, defensive posture is warranted until key economic data provides clearer direction.`;
        setAiPortfolioSummary(mockResponse); setIsGeneratingPortfolioSummary(false);
    };

    return (
        <div className="bg-gray-100 dark:bg-gray-900 min-h-screen font-sans text-gray-800 dark:text-gray-200">
            <TradeDetailModal opportunity={selectedOpportunity} onClose={() => setSelectedOpportunity(null)} />
            <SettingsModal isOpen={isSettingsOpen} onClose={() => setSettingsOpen(false)} apiKey={apiKey} setApiKey={setApiKey} onSave={() => { setSettingsOpen(false); fetchData(); }} />
            <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-30"><div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex justify-between items-center"><div className="flex items-center"><Briefcase className="h-8 w-8 text-blue-600" /><h1 className="text-2xl font-bold ml-3">BondPulse</h1></div><div className="flex items-center space-x-4"><div className="text-right"><div className="font-medium text-sm">{time.toLocaleTimeString()}</div><div className={`text-xs font-bold ${dataSource === 'SIMULATED' ? 'text-yellow-500' : 'text-green-500'}`}>{dataSource} DATA</div></div><button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">{theme === 'light' ? <Moon size={20}/> : <Sun size={20}/>}</button><button onClick={() => setSettingsOpen(true)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><Settings size={20}/></button></div></div></header>

            <main className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
                    <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatCard icon={<TrendingUp size={20} />} title="Filtered Opportunities" value={sortedAndFilteredOpportunities.length} />
                        <StatCard icon={<Zap size={20} />} title="Avg. Portfolio Duration" value={portfolioDuration} unit="yrs" />
                        <StatCard icon={<Droplets size={20} />} title="Avg. Liquidity" value={`${portfolioLiquidity}/10`} />
                    </div>
                    <div className="bg-white dark:bg-gray-800/50 p-4 rounded-lg shadow-md">
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2 text-center">Portfolio Composition</h3>
                        <div style={{width: '100%', height: 120}}><ResponsiveContainer><PieChart><Tooltip contentStyle={{backgroundColor: 'rgba(30,41,59,0.8)', color: '#fff', borderRadius: '0.5rem'}}/><Pie data={portfolioComposition} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={50} fill="#8884d8"><Cell fill="#8884d8"/><Cell fill="#82ca9d"/><Cell fill="#ffc658"/><Cell fill="#ff8042"/></Pie></PieChart></ResponsiveContainer></div>
                    </div>
                </div>
                <div className="flex space-x-2 mb-6 border-b border-gray-200 dark:border-gray-700"><TabButton label="Opportunities" isActive={activeTab === 'Opportunities'} onClick={() => setActiveTab('Opportunities')} /><TabButton label="Backtesting" isActive={activeTab === 'Backtesting'} onClick={() => setActiveTab('Backtesting')} /><TabButton label="Risk & Optimization" isActive={activeTab === 'Optimization'} onClick={() => setActiveTab('Optimization')} /><TabButton label="Market Internals" isActive={activeTab === 'Market'} onClick={() => setActiveTab('Market')} /><TabButton label="AI & News" isActive={activeTab === 'AI'} onClick={() => setActiveTab('AI')} /></div>

                {activeTab === 'Opportunities' && <div>
                    <div className="p-4 bg-white dark:bg-gray-800/50 rounded-t-lg shadow-md">
                        <h3 className="text-lg font-semibold mb-4">Filters</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div><label className="text-sm font-medium">Arbitrage Type</label><select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="w-full mt-1 p-2 border rounded-md text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"><option>All</option><option>Cash-and-Carry</option><option>Yield Curve</option><option>Credit Spread</option><option>Relative Value</option></select></div>
                            <div><label className="text-sm font-medium">Max Risk Score: {riskFilter}</label><input type="range" min="0" max="100" value={riskFilter} onChange={e => setRiskFilter(Number(e.target.value))} className="w-full mt-1"/></div>
                            <div><label className="text-sm font-medium">Min Profit ($)</label><input type="number" value={profitFilter} onChange={e => setProfitFilter(Number(e.target.value))} className="w-full mt-1 p-2 border rounded-md text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"/></div>
                        </div>
                    </div>
                    <div className="overflow-x-auto bg-white dark:bg-gray-800/50 rounded-b-lg shadow-md">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 dark:bg-gray-700"><tr>
                                <th className="p-4 font-semibold">Trade Pair</th>
                                <th className="p-4 font-semibold cursor-pointer" onClick={() => requestSort('type')}>Type</th>
                                <th className="p-4 font-semibold cursor-pointer" onClick={() => requestSort('liquidity')}>Liquidity</th>
                                <th className="p-4 font-semibold text-right cursor-pointer" onClick={() => requestSort('potentialProfit')}>Profit ($) {sortConfig.key === 'potentialProfit' ? (sortConfig.direction === 'asc' ? <ArrowUp size={12} className="inline"/> : <ArrowDown size={12} className="inline"/>) : ''}</th>
                                <th className="p-4 font-semibold text-right cursor-pointer" onClick={() => requestSort('riskScore')}>Risk Score {sortConfig.key === 'riskScore' ? (sortConfig.direction === 'asc' ? <ArrowUp size={12} className="inline"/> : <ArrowDown size={12} className="inline"/>) : ''}</th>
                            </tr></thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">{sortedAndFilteredOpportunities.map(op => (
                                <tr key={op.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer" onClick={() => setSelectedOpportunity(op)}>
                                    <td className="p-4"><div className="font-medium">{op.bondA}</div><div className="text-gray-500 dark:text-gray-400">vs. {op.bondB}</div></td>
                                    <td className="p-4">{op.type}</td>
                                    <td className="p-4">{op.liquidity}/10</td>
                                    <td className="p-4 text-right font-medium text-green-500">${op.potentialProfit}</td>
                                    <td className="p-4 text-right"><span className={`px-2 py-1 rounded-full font-semibold text-xs ${getRiskColor(op.riskScore)}`}>{op.riskScore}</span></td>
                                </tr>
                            ))}</tbody>
                        </table>
                    </div>
                </div>}
                
                {activeTab === 'Backtesting' && <div>
                    <div className="p-4 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800/50 shadow-md flex items-center justify-between mb-6 flex-wrap gap-4">
                        <div className="flex items-center gap-4"><label className="font-medium">Strategy:</label><select value={backtestStrategy} onChange={e => setBacktestStrategy(e.target.value)} className="p-2 border rounded-md text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"><option value="Balanced">Balanced</option><option value="Custom">Custom</option></select></div>
                        {backtestStrategy === 'Custom' && <><div className="flex items-center gap-2"><label className="text-sm">Min Profit:</label><input type="number" value={backtestParams.minProfit} onChange={e => setBacktestParams({...backtestParams, minProfit: Number(e.target.value)})} className="w-20 p-1 border rounded-md text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"/></div><div className="flex items-center gap-2"><label className="text-sm">Max Risk:</label><input type="number" value={backtestParams.maxRisk} onChange={e => setBacktestParams({...backtestParams, maxRisk: Number(e.target.value)})} className="w-20 p-1 border rounded-md text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"/></div></>}
                        <button onClick={handleRunBacktest} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center"><SlidersHorizontal className="h-4 w-4 mr-2"/>Run Backtest</button>
                    </div>
                    {backtestResults ? <div className="bg-white dark:bg-gray-800/50 p-6 rounded-lg shadow-md">
                        <h3 className="text-lg font-semibold mb-4">Backtest Results: '{backtestStrategy}' Strategy</h3>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6"><StatCard icon={<TrendingUp size={20}/>} title="Total Return" value={`${backtestResults.totalReturn}%`} /><StatCard icon={<Activity size={20}/>} title="Sharpe Ratio" value={backtestResults.sharpeRatio} /><StatCard icon={<Shield size={20}/>} title="Max Drawdown" value={`${backtestResults.maxDrawdown}%`} /><StatCard icon={<Briefcase size={20}/>} title="Trades" value={backtestResults.trades} /><StatCard icon={<Zap size={20}/>} title="Win/Loss Ratio" value={backtestResults.winLossRatio} /></div>
                        <h4 className="font-semibold mb-2">Equity Curve</h4><div style={{width: '100%', height: 300}}><ResponsiveContainer><AreaChart data={backtestResults.equityCurve}><CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.2)"/><XAxis dataKey="date" tick={{ fontSize: 10, fill: 'currentColor' }}/><YAxis tickFormatter={(v) => `$${v.toLocaleString()}`} tick={{ fontSize: 10, fill: 'currentColor' }}/><Tooltip contentStyle={{backgroundColor: 'rgba(30,41,59,0.8)', color: '#fff', borderRadius: '0.5rem'}}/><Area type="monotone" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} /></AreaChart></ResponsiveContainer></div>
                    </div> : <div className="text-center text-gray-500 py-24 bg-white dark:bg-gray-800/50 rounded-lg shadow-md">Select a strategy and click "Run Backtest" to see historical performance.</div>}
                </div>}
                
                {activeTab === 'Optimization' && <div className="bg-white dark:bg-gray-800/50 p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">Portfolio Optimization <InfoTooltip text="Each point is a possible portfolio based on the filtered opportunities. The curve shows the best possible return for a given level of risk."/></h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2"><div style={{width: '100%', height: 400}}><ResponsiveContainer><ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}><CartesianGrid stroke="rgba(128,128,128,0.2)"/><XAxis type="number" dataKey="x" name="Volatility" unit="%" tick={{ fontSize: 10, fill: 'currentColor' }} /><YAxis type="number" dataKey="y" name="Return" unit="%" tick={{ fontSize: 10, fill: 'currentColor' }} /><ZAxis type="number" dataKey="z" name="Sharpe" range={[20, 100]} /><Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{backgroundColor: 'rgba(30,41,59,0.8)', color: '#fff', borderRadius: '0.5rem'}} /><Scatter name="Portfolios" data={efficientFrontier.points} fill="#8884d8" fillOpacity={0.6} /><Scatter name="Min Volatility" data={[efficientFrontier.minVolPortfolio]} fill="#82ca9d" shape="star" /><Scatter name="Max Sharpe" data={[efficientFrontier.maxSharpePortfolio]} fill="#ffc658" shape="triangle" /><Legend /></ScatterChart></ResponsiveContainer></div></div>
                        <div>
                            <h4 className="font-semibold mb-2">Optimal Portfolio Weights</h4>
                            <div className="p-2 border dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800 flex items-center justify-center gap-2 mb-4"><label className="text-sm">Goal:</label><select value={optimizationTarget} onChange={e => setOptimizationTarget(e.target.value)} className="p-1 border rounded-md text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"><option value="maxSharpe">Maximize Sharpe Ratio</option><option value="minVol">Minimize Volatility</option></select></div>
                            <div className="space-y-2 max-h-80 overflow-y-auto pr-2">{optimalPortfolio?.weights.map((w, i) => (<div key={i} className="flex justify-between items-center text-sm"><span className="truncate pr-2">{sortedAndFilteredOpportunities[i]?.bondA}</span><span className="font-bold">{(w*100).toFixed(1)}%</span></div>))}</div>
                        </div>
                    </div>
                </div>}

                {activeTab === 'Market' && <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-gray-800/50 p-6 rounded-lg shadow-md">
                        <h3 className="text-lg font-semibold mb-4 flex items-center">BBB-AAA Credit Spread <InfoTooltip text="The difference in yield between BBB and AAA rated corporate bonds. A widening spread can signal economic stress."/></h3>
                        <div style={{width: '100%', height: 200}}><ResponsiveContainer><AreaChart data={marketInternals.creditSpread}><CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.2)"/><XAxis dataKey="daysAgo" reversed={true} tick={{ fontSize: 10, fill: 'currentColor' }} unit="d ago" /><YAxis tick={{ fontSize: 10, fill: 'currentColor' }} unit="%" domain={['dataMin - 0.2', 'dataMax + 0.2']}/><Tooltip contentStyle={{backgroundColor: 'rgba(30,41,59,0.8)', color: '#fff', borderRadius: '0.5rem'}}/><Area type="monotone" dataKey="spread" stroke="#ff7300" fill="#ff7300" fillOpacity={0.3} /></AreaChart></ResponsiveContainer></div>
                    </div>
                    <div className="bg-white dark:bg-gray-800/50 p-6 rounded-lg shadow-md">
                        <h3 className="text-lg font-semibold mb-4 flex items-center">Weekly Issuance Volume <InfoTooltip text="Compares the volume of newly issued bonds to older, off-the-run bonds."/></h3>
                        <div style={{width: '100%', height: 200}}><ResponsiveContainer><BarChart data={marketInternals.issuanceVolume} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.2)"/><XAxis type="number" tick={{ fontSize: 10, fill: 'currentColor' }} unit="B"/><YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'currentColor' }} width={80}/><Tooltip contentStyle={{backgroundColor: 'rgba(30,41,59,0.8)', color: '#fff', borderRadius: '0.5rem'}}/><Bar dataKey="value" fill="#22c55e" /></BarChart></ResponsiveContainer></div>
                    </div>
                </div>}

                {activeTab === 'AI & News' && <div className="bg-white dark:bg-gray-800/50 p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">AI Portfolio Insights<InfoTooltip text="A high-level strategic summary of the current market based on all available data."/></h3>
                    <button onClick={generateAiPortfolioSummary} disabled={isGeneratingPortfolioSummary} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center disabled:bg-gray-400 mx-auto mb-4"><Sparkles className="h-4 w-4 mr-2"/>{isGeneratingPortfolioSummary ? 'Generating...' : 'Generate AI Insights'}</button>
                    {isGeneratingPortfolioSummary && <div className="text-center text-gray-500">Analyzing market conditions...</div>}
                    {aiPortfolioSummary && <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-left text-md leading-7 whitespace-pre-wrap max-w-2xl mx-auto">{aiPortfolioSummary}</div>}
                </div>}
            </main>
            <footer className="text-center py-4 text-sm text-gray-500 dark:text-gray-400 mt-4"><p>BondPulse | All data is simulated for demonstration purposes.</p></footer>
        </div>
    );
}
