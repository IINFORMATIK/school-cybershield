
import React from 'react';
import { Activity, ShieldCheck, HardDrive, Cpu, Thermometer, Wifi } from 'lucide-react';

interface DeviceMonitorProps {
  realSystem?: any;
}

const DeviceMonitor: React.FC<DeviceMonitorProps> = ({ realSystem }) => {
  // Added isLive: false to mock data to ensure property existence in the combined array
  const mockSystemStats = [
    { 
      name: 'Lab1-PC01', 
      cpu: 12, 
      ram: 45, 
      disk: 78, 
      avStatus: 'Active', 
      firewall: 'Enabled', 
      temp: 42,
      networkIO: { bytesSent: 245.32, bytesRecv: 512.64 },
      lastUpdate: '2 мин. назад',
      os: 'Windows 10',
      isLive: false
    },
    { 
      name: 'Library-PC04', 
      cpu: 98, 
      ram: 85, 
      disk: 92, 
      avStatus: 'Disabled', 
      firewall: 'Disabled', 
      temp: 65,
      networkIO: { bytesSent: 1024.50, bytesRecv: 2048.75 },
      lastUpdate: 'Только что',
      os: 'Windows 10',
      isLive: false
    },
  ];

  // Combine real and mock data ensuring all items have the isLive property
  const systems = realSystem 
    ? [{ 
        name: realSystem.name || 'Этот ПК (Local)', 
        cpu: realSystem.cpu, 
        ram: realSystem.ram, 
        disk: realSystem.disk, 
        avStatus: realSystem.avStatus, 
        firewall: realSystem.firewall, 
        temp: realSystem.temp, 
        networkIO: realSystem.networkIO || { bytesSent: 0, bytesRecv: 0 },
        lastUpdate: 'Только что (Live)',
        os: realSystem.os,
        isLive: true
      }, ...mockSystemStats] 
    : mockSystemStats;

  return (
    <div className="space-y-6">
      {!realSystem && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-900">
          <p className="font-medium">ℹ️ Данные о системе ещё не загружены</p>
          <p className="text-sm">Нажмите кнопку <strong>"Запустить аудит"</strong> для получения информации об этом ПК</p>
        </div>
      )}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Контроль рабочих станций</h2>
          <p className="text-slate-500">Инвентаризация и системные настройки в реальном времени</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {systems.map((pc) => (
          // Fixed: Property 'isLive' now exists on all elements of the systems array
          <div key={pc.name} className={`bg-white rounded-2xl border ${pc.isLive ? 'border-blue-400 ring-2 ring-blue-50' : 'border-slate-200'} shadow-sm overflow-hidden flex flex-col md:flex-row transition-all`}>
            <div className="p-6 md:w-64 border-b md:border-b-0 md:border-r border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-slate-800 text-lg">{pc.name}</h3>
                {pc.isLive && <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded font-black uppercase">Live</span>}
              </div>
              <p className="text-xs text-slate-400 mb-2">{pc.os}</p>
              <p className="text-[10px] text-slate-400 mb-4 uppercase font-bold tracking-wider">{pc.lastUpdate}</p>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2 text-slate-500">
                    <ShieldCheck size={14} className={pc.avStatus === 'Active' ? 'text-green-500' : 'text-red-500'} />
                    Антивирус
                  </div>
                  <span className={`font-bold ${pc.avStatus === 'Active' ? 'text-green-600' : 'text-red-600'}`}>{pc.avStatus}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Activity size={14} className={pc.firewall === 'Enabled' ? 'text-green-500' : 'text-red-500'} />
                    Файрвол
                  </div>
                  <span className={`font-bold ${pc.firewall === 'Enabled' ? 'text-green-600' : 'text-red-600'}`}>{pc.firewall}</span>
                </div>
              </div>
            </div>

            <div className="flex-1 p-6">
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
                <StatCircle label="CPU" value={pc.cpu} icon={<Cpu size={16}/>} />
                <StatCircle label="RAM" value={pc.ram} icon={<Activity size={16}/>} />
                <StatCircle label="DISK" value={pc.disk} icon={<HardDrive size={16}/>} />
                <StatCircle label="TEMP" value={pc.temp} icon={<Thermometer size={16}/>} isTemp />
                <NetworkLoad sent={pc.networkIO?.bytesSent || 0} received={pc.networkIO?.bytesRecv || 0} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const NetworkLoad = ({ sent, received }: any) => {
  const totalMB = sent + received;
  const maxBar = Math.max(sent, received, 100);
  
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div className="p-3 rounded-full bg-purple-50 text-purple-600 mb-3">
        <Wifi size={16} />
      </div>
      <div className="text-sm font-bold text-slate-800 mb-2">
        Сеть
      </div>
      <div className="text-[11px] text-slate-500 mb-3 space-y-1">
        <div className="flex items-center justify-center gap-1">
          <span className="text-[9px] font-bold">↑</span>
          <span>{sent.toFixed(1)} МБ</span>
        </div>
        <div className="flex items-center justify-center gap-1">
          <span className="text-[9px] font-bold">↓</span>
          <span>{received.toFixed(1)} МБ</span>
        </div>
      </div>
      <div className="w-full space-y-1">
        <div className="flex gap-1 text-[9px]">
          <div className="flex-1 bg-blue-100 rounded h-1" style={{ width: `${(sent / maxBar) * 100}%` }}>
            <div className="h-full bg-blue-500 rounded"></div>
          </div>
        </div>
        <div className="flex gap-1 text-[9px]">
          <div className="flex-1 bg-green-100 rounded h-1" style={{ width: `${(received / maxBar) * 100}%` }}>
            <div className="h-full bg-green-500 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

const StatCircle = ({ label, value, icon, isTemp }: any) => {
  const color = value > 85 ? 'text-red-500' : value > 65 ? 'text-yellow-500' : 'text-blue-500';
  const bgColor = value > 85 ? 'bg-red-50' : value > 65 ? 'bg-yellow-50' : 'bg-blue-50';

  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div className={`p-3 rounded-full ${bgColor} ${color} mb-3`}>
        {icon}
      </div>
      <div className="text-2xl font-black text-slate-800">
        {Math.round(value)}{isTemp ? '°C' : '%'}
      </div>
      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</div>
      <div className="w-full h-1.5 bg-slate-100 rounded-full mt-3 overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-1000 ${color.replace('text-', 'bg-')}`} 
          style={{ width: `${value}%` }}
        ></div>
      </div>
    </div>
  );
}

export default DeviceMonitor;
