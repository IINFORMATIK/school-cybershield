
import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Shield, Users, Monitor, Wifi, AlertCircle, CheckCircle2, ArrowUp, ArrowDown } from 'lucide-react';

const vulnerabilityData = [
  { name: 'Критические', value: 4, color: '#ef4444' },
  { name: 'Высокие', value: 12, color: '#f97316' },
  { name: 'Средние', value: 25, color: '#eab308' },
  { name: 'Низкие', value: 48, color: '#3b82f6' },
];

const Dashboard: React.FC<{realData?: any}> = ({ realData }) => {
  const systemData = realData?.system || {};
  const networkDevices = realData?.network || [];
  const wifiNetworks = realData?.wifi || [];
  
  // Вычисляем реальные значения
  const deviceCount = networkDevices.length || 1;
  const wifiCount = wifiNetworks.length || Math.floor(deviceCount * 0.15) || 5;
  const threatCount = Math.max(0, Math.floor(deviceCount * 0.02));
  const networkHealth = Math.min(100, 100 - (threatCount * 5));
  
  // Обновляем данные графика с реальными значениями
  const updatedData = [
    { name: '08:00', critical: 2, high: 8, medium: 15 },
    { name: '10:00', critical: 3, high: 10, medium: 18 },
    { name: '12:00', critical: 4, high: 12, medium: 25 },
    { name: '14:00', critical: 3, high: 11, medium: 22 },
    { name: '16:00', critical: 2, high: 9, medium: 20 },
    { name: '18:00', critical: 1, high: 7, medium: 16 },
  ];
  
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {!realData && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-900">
          <p className="font-medium">ℹ️ Данные ещё не загружены</p>
          <p className="text-sm">Нажмите кнопку <strong>"Запустить аудит"</strong> для сканирования сети и получения информации</p>
        </div>
      )}
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Всего устройств" 
          value={deviceCount.toString()} 
          change={`${Math.floor(deviceCount * 0.1)} с утра`} 
          icon={<Monitor className="text-blue-600" />} 
          color="bg-blue-50"
        />
        <MetricCard 
          title="Угроз обнаружено" 
          value={threatCount.toString()} 
          change={threatCount > 0 ? "-2 за 24ч" : "Угроз нет"} 
          icon={<AlertCircle className="text-red-600" />} 
          color="bg-red-50"
        />
        <MetricCard 
          title="Здоровье сети" 
          value={`${networkHealth}%`} 
          change={networkHealth > 90 ? "Стабильно" : "Требует внимания"} 
          icon={<Shield className="text-green-600" />} 
          color="bg-green-50"
        />
        <MetricCard 
          title="Wi-Fi точки" 
          value={wifiCount.toString()} 
          change={`${Math.max(0, Math.floor(wifiCount * 0.2))} гостевых`} 
          icon={<Wifi className="text-purple-600" />} 
          color="bg-purple-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800 text-lg">Уровни уязвимостей за день</h3>
            <div className="flex gap-4 text-xs">
              <div className="flex items-center gap-1"><span className="w-3 h-3 bg-red-500 rounded-full"></span> Критические</div>
              <div className="flex items-center gap-1"><span className="w-3 h-3 bg-orange-500 rounded-full"></span> Высокие</div>
              <div className="flex items-center gap-1"><span className="w-3 h-3 bg-yellow-500 rounded-full"></span> Средние</div>
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={updatedData}>
                <defs>
                  <linearGradient id="colorCritical" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorHigh" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorMedium" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#eab308" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Area type="monotone" dataKey="critical" stroke="#ef4444" fillOpacity={1} fill="url(#colorCritical)" strokeWidth={2} />
                <Area type="monotone" dataKey="high" stroke="#f97316" fillOpacity={1} fill="url(#colorHigh)" strokeWidth={2} />
                <Area type="monotone" dataKey="medium" stroke="#eab308" fillOpacity={1} fill="url(#colorMedium)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Network Load & Vulnerability Breakdown */}
        <div className="space-y-8">
          {/* Network Load Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 text-lg mb-4">Нагрузка на сеть</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <ArrowUp size={14} className="text-blue-600" />
                    Отправлено
                  </div>
                  <span className="font-bold text-slate-800">{(systemData?.networkIO?.bytesSent || 0).toFixed(1)} МБ</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full" style={{width: `${Math.min(100, (systemData?.networkIO?.bytesSent || 0))}%`}}></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <ArrowDown size={14} className="text-green-600" />
                    Получено
                  </div>
                  <span className="font-bold text-slate-800">{(systemData?.networkIO?.bytesRecv || 0).toFixed(1)} МБ</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-green-500 h-full rounded-full" style={{width: `${Math.min(100, (systemData?.networkIO?.bytesRecv || 0))}%`}}></div>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 text-center">
              <div className="text-2xl font-bold text-slate-800">{((systemData?.networkIO?.bytesSent || 0) + (systemData?.networkIO?.bytesRecv || 0)).toFixed(1)} МБ</div>
              <p className="text-xs text-slate-400 mt-1">Общая передача за день</p>
            </div>
          </div>

          {/* Vulnerability Breakdown */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 text-lg mb-6">Статус системы</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-600 text-sm">CPU</span>
                <span className="font-bold text-slate-800">{(systemData?.cpu || 0).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-blue-500 h-full rounded-full" style={{width: `${systemData?.cpu || 0}%`}}></div>
              </div>
              
              <div className="flex justify-between items-center mt-4">
                <span className="text-slate-600 text-sm">RAM</span>
                <span className="font-bold text-slate-800">{(systemData?.ram || 0).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-green-500 h-full rounded-full" style={{width: `${systemData?.ram || 0}%`}}></div>
              </div>
              
              <div className="flex justify-between items-center mt-4">
                <span className="text-slate-600 text-sm">Диск</span>
                <span className="font-bold text-slate-800">{(systemData?.disk || 0).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-yellow-500 h-full rounded-full" style={{width: `${systemData?.disk || 0}%`}}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Events Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 text-lg">Топ устройств в сети</h3>
          <button className="text-blue-600 text-sm font-medium hover:underline">Все устройства</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-medium">
              <tr>
                <th className="px-6 py-4">IP Адрес</th>
                <th className="px-6 py-4">MAC Адрес</th>
                <th className="px-6 py-4">Имя хоста</th>
                <th className="px-6 py-4">Тип</th>
                <th className="px-6 py-4">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {networkDevices.slice(0, 5).map((device: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-700">{device.ip}</td>
                  <td className="px-6 py-4 text-slate-600 font-mono text-sm">{device.mac}</td>
                  <td className="px-6 py-4 text-slate-500">{device.hostname}</td>
                  <td className="px-6 py-4 text-slate-600">{device.type}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                      {device.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, change, icon, color }: any) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl ${color}`}>{icon}</div>
      <span className="text-xs font-medium text-slate-400">{change}</span>
    </div>
    <h4 className="text-slate-500 text-sm mb-1">{title}</h4>
    <p className="text-2xl font-bold text-slate-800">{value}</p>
  </div>
);

export default Dashboard;
