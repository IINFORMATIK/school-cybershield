
import React, { useState, useEffect } from 'react';
import { Wifi, ShieldAlert, SignalHigh, SignalMedium, SignalLow, Lock, Unlock, RefreshCw } from 'lucide-react';
import { WifiNetwork } from '../types';

interface WifiAnalyzerProps {
  realNetworks?: any[];
  onAudit?: () => Promise<void>;
  isScanning?: boolean;
}

const WifiAnalyzer: React.FC<WifiAnalyzerProps> = ({ realNetworks = [], onAudit, isScanning = false }) => {
  const [networks, setNetworks] = useState<WifiNetwork[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchWifiNetworks = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/wifi');
      if (res.ok) {
        const data = await res.json();
        setNetworks(data.networks || []);
      }
    } catch (err) {
      console.error("WiFi scan failed", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (realNetworks && realNetworks.length > 0) {
      setNetworks(realNetworks);
    }
  }, [realNetworks]);

  const rogueCount = networks.filter(n => n.isRogue).length;

  return (
    <div className="space-y-6">
      {networks.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-900">
          <p className="font-medium">ℹ️ Данные о Wi-Fi ещё не загружены</p>
          <p className="text-sm">Нажмите кнопку <strong>"Запустить аудит"</strong> для сканирования доступных Wi-Fi сетей</p>
        </div>
      )}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 rounded-3xl text-white flex justify-between items-center shadow-lg">
        <div>
          <h2 className="text-2xl font-bold mb-2">Радиочастотный анализ</h2>
          <p className="text-blue-100 opacity-80">Сканирование 2.4GHz и 5GHz диапазонов на наличие угроз</p>
        </div>
        <div className="flex flex-col items-end gap-4">
          <div className="text-right">
            <div className="text-4xl font-black">{rogueCount}</div>
            <div className="text-sm font-medium opacity-80">Подозрительные ТД</div>
          </div>
          <button
            onClick={onAudit}
            disabled={isScanning}
            className="flex items-center gap-2 bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-sm"
          >
            <RefreshCw size={16} className={isScanning ? 'animate-spin' : ''} />
            {isScanning ? 'Сканирование...' : 'Запустить аудит Wi-Fi'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-medium">
            <tr>
              <th className="px-6 py-4">SSID / Название</th>
              <th className="px-6 py-4">BSSID (MAC)</th>
              <th className="px-6 py-4">Сигнал</th>
              <th className="px-6 py-4">Безопасность</th>
              <th className="px-6 py-4">Канал</th>
              <th className="px-6 py-4">Риск</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {networks.length > 0 ? (
              networks.map((net) => (
                <tr key={net.bssid} className={`hover:bg-slate-50 transition-colors ${net.isRogue ? 'bg-red-50/30' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`${net.isRogue ? 'text-red-600' : 'text-blue-600'}`}>
                        <Wifi size={18} />
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">{net.ssid}</div>
                        {net.vulnerability && (
                          <div className="text-xs text-slate-500 mt-1">
                            {net.vulnerability.level === "Critical" && "🔴 Критическая уязвимость"}
                            {net.vulnerability.level === "High" && "🟠 Высокий риск"}
                            {net.vulnerability.level === "Medium" && "🟡 Средний риск"}
                            {net.vulnerability.level === "Low" && "🟢 Низкий риск"}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-500 uppercase">{net.bssid}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <SignalIcon dbm={net.signal} />
                      <span className="text-sm font-medium text-slate-600">{net.signal} dBm</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm">
                      {net.security === 'None' || net.security?.toUpperCase() === 'NONE' ? (
                        <Unlock size={14} className="text-red-500" />
                      ) : (
                        <Lock size={14} className="text-slate-400" />
                      )}
                      <span className={net.security === 'None' || net.security?.toUpperCase() === 'NONE' ? 'text-red-600 font-bold' : 'text-slate-600'}>
                        {net.security}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-xs font-bold text-slate-600">CH {net.channel}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      {net.isRogue ? (
                        <span className="flex items-center gap-1 text-red-600 font-bold text-xs uppercase mb-2">
                          <ShieldAlert size={14} /> Rogue AP
                        </span>
                      ) : (
                        <span className="text-green-600 font-bold text-xs uppercase mb-2">Trusted</span>
                      )}
                      {net.vulnerability && (
                        <div className="text-xs">
                          {net.vulnerability.issues.length > 0 && (
                            <div className="text-slate-600 line-clamp-2">
                              {net.vulnerability.issues[0]}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                  {loading ? 'Загрузка сетей...' : 'WiFi сети не обнаружены'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const SignalIcon = ({ dbm }: { dbm: number }) => {
  if (dbm > -50) return <SignalHigh size={18} className="text-green-500" />;
  if (dbm > -70) return <SignalMedium size={18} className="text-yellow-500" />;
  return <SignalLow size={18} className="text-red-400" />;
};

export default WifiAnalyzer;
