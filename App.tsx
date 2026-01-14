
import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  LayoutDashboard, 
  Network, 
  Wifi, 
  AlertTriangle, 
  Menu,
  X,
  RefreshCw,
  Search,
  Activity
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import NetworkScanner from './components/NetworkScanner';
import WifiAnalyzer from './components/WifiAnalyzer';
import VulnerabilityReport from './components/VulnerabilityReport';
import ConnectedClients from './components/ConnectedClients';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [agentStatus, setAgentStatus] = useState<'connected' | 'disconnected'>('disconnected');
  const [realData, setRealData] = useState<any>(null);

  const checkAgentStatus = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/system');
      if (res.ok) {
        setAgentStatus('connected');
        return true;
      } else {
        setAgentStatus('disconnected');
        return false;
      }
    } catch {
      setAgentStatus('disconnected');
      return false;
    }
  };

  const fetchAllAuditData = async () => {
    setIsScanning(true);
    try {
      // Fetch system data
      const resSystem = await fetch('http://localhost:5000/api/system');
      if (resSystem.ok) {
        const sysData = await resSystem.json();
        setAgentStatus('connected');
        setRealData(prev => ({ ...prev, system: sysData }));
      } else {
        setAgentStatus('disconnected');
      }
    } catch {
      setAgentStatus('disconnected');
    }

    // Fetch WiFi data
    try {
      const wifiRes = await fetch('http://localhost:5000/api/wifi');
      if (wifiRes.ok) {
        const wifiData = await wifiRes.json();
        setRealData(prev => ({ ...prev, wifi: wifiData.networks }));
      }
    } catch (err) {
      console.error('WiFi fetch failed', err);
    }

    // Fetch network devices
    try {
      const scanRes = await fetch('http://localhost:5000/api/scan');
      if (scanRes.ok) {
        const scanData = await scanRes.json();
        setRealData(prev => ({ ...prev, network: scanData.devices }));
      }
    } catch (err) {
      console.error('Scan failed', err);
    }

    // Fetch connected clients
    try {
      const clientsRes = await fetch('http://localhost:5000/api/clients');
      if (clientsRes.ok) {
        const clientsData = await clientsRes.json();
        setRealData(prev => ({ ...prev, clients: clientsData.clients }));
      }
    } catch (err) {
      console.error('Clients fetch failed', err);
    }

    // Fetch vulnerabilities (includes predefined recommendations)
    try {
      const vulnRes = await fetch('http://localhost:5000/api/vulnerabilities');
      if (vulnRes.ok) {
        const vulnData = await vulnRes.json();
        setRealData(prev => ({ ...prev, vulnerabilities: vulnData.details }));
      }
    } catch (err) {
      console.error('Vulnerabilities fetch failed', err);
    }

    setTimeout(() => setIsScanning(false), 1500);
  };

  const fetchNetworkScan = async () => {
    setIsScanning(true);
    try {
      const scanRes = await fetch('http://localhost:5000/api/scan');
      if (scanRes.ok) {
        const scanData = await scanRes.json();
        setRealData(prev => ({ ...prev, network: scanData.devices }));
      }
    } catch (err) {
      console.error('Scan failed', err);
    }
    setTimeout(() => setIsScanning(false), 1500);
  };

  const fetchWifiScan = async () => {
    setIsScanning(true);
    try {
      const wifiRes = await fetch('http://localhost:5000/api/wifi');
      if (wifiRes.ok) {
        const wifiData = await wifiRes.json();
        setRealData(prev => ({ ...prev, wifi: wifiData.networks }));
      }
    } catch (err) {
      console.error('WiFi fetch failed', err);
    }
    setTimeout(() => setIsScanning(false), 1500);
  };

  const fetchClientsAudit = async () => {
    setIsScanning(true);
    try {
      const clientsRes = await fetch('http://localhost:5000/api/clients');
      if (clientsRes.ok) {
        const clientsData = await clientsRes.json();
        setRealData(prev => ({ ...prev, clients: clientsData.clients }));
      }
    } catch (err) {
      console.error('Clients fetch failed', err);
    }
    
    // Also fetch vulnerabilities when auditing clients
    try {
      const vulnRes = await fetch('http://localhost:5000/api/vulnerabilities');
      if (vulnRes.ok) {
        const vulnData = await vulnRes.json();
        setRealData(prev => ({ ...prev, vulnerabilities: vulnData.details }));
      }
    } catch (err) {
      console.error('Vulnerabilities fetch failed', err);
    }
    
    setTimeout(() => setIsScanning(false), 1500);
  };

  const fetchVulnerabilities = async () => {
    setIsScanning(true);
    try {
      const vulnRes = await fetch('http://localhost:5000/api/vulnerabilities');
      if (vulnRes.ok) {
        const vulnData = await vulnRes.json();
        setRealData(prev => ({ ...prev, vulnerabilities: vulnData.details }));
      }
    } catch (err) {
      console.error('Vulnerabilities fetch failed', err);
    }
    setTimeout(() => setIsScanning(false), 1500);
  };

  useEffect(() => {
    checkAgentStatus();
  }, []);

  const handleAudit = async () => {
    if (agentStatus === 'disconnected') {
      alert('Агент недоступен. Проверьте, запущен ли agent.py');
      return;
    }
    await fetchAllAuditData();
  };

  const navItems = [
    { id: 'dashboard', label: 'Дашборд', icon: <LayoutDashboard size={20} /> },
    { id: 'scanner', label: 'Сетевой сканер', icon: <Network size={20} /> },
    { id: 'wifi', label: 'Анализ Wi-Fi', icon: <Wifi size={20} /> },
    { id: 'vulnerabilities', label: 'Уязвимости', icon: <AlertTriangle size={20} /> },
    { id: 'clients', label: 'Удаленные ПК', icon: <Activity size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden">
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} transition-all duration-300 bg-white border-r border-slate-200 flex flex-col z-50`}>
        <div className="p-6 flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg text-white shadow-lg">
            <ShieldCheck size={24} />
          </div>
          {isSidebarOpen && <span className="font-bold text-xl tracking-tight">CyberShield</span>}
        </div>

        <nav className="flex-1 mt-6 px-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                activeTab === item.id 
                ? 'bg-blue-50 text-blue-600 font-semibold border border-blue-100 shadow-sm' 
                : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {item.icon}
              {isSidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-2 px-2 py-3 text-xs font-bold text-slate-400 uppercase">
            <div className={`w-2 h-2 rounded-full ${agentStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'}`}></div>
            {isSidebarOpen && (agentStatus === 'connected' ? 'Агент активен' : 'Агент офлайн')}
          </div>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-slate-100 text-slate-500">
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
          <h2 className="text-lg font-semibold text-slate-700">
            {navItems.find(i => i.id === activeTab)?.label}
          </h2>
          <div className="flex items-center gap-4">
            <button 
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all font-medium shadow-md active:scale-95 disabled:opacity-50"
              onClick={handleAudit}
              disabled={isScanning || agentStatus === 'disconnected'}
            >
              <RefreshCw size={16} className={isScanning ? 'animate-spin' : ''} />
              {isScanning ? 'Выполняется аудит...' : 'Запустить аудит'}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          {activeTab === 'dashboard' && <Dashboard realData={realData} />}
          {activeTab === 'scanner' && <NetworkScanner realDevices={realData?.network} onAudit={fetchNetworkScan} isScanning={isScanning} />}
          {activeTab === 'wifi' && <WifiAnalyzer realNetworks={realData?.wifi} onAudit={fetchWifiScan} isScanning={isScanning} />}
          {activeTab === 'vulnerabilities' && (
            <VulnerabilityReport
              vulnerabilities={realData?.vulnerabilities}
              isLoading={isScanning}
              onAudit={fetchVulnerabilities}
            />
          )}
          {activeTab === 'clients' && <ConnectedClients clients={realData?.clients} onAudit={fetchClientsAudit} isScanning={isScanning} />}
        </div>
      </main>
    </div>
  );
};

export default App;
