
import React, { useState } from 'react';
import { Globe, Smartphone, Server, Cpu, Printer, Monitor, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { Device } from '../types';

interface NetworkScannerProps {
  realDevices?: any[];
  onAudit?: () => Promise<void>;
  isScanning?: boolean;
}

const NetworkScanner: React.FC<NetworkScannerProps> = ({ realDevices = [], onAudit, isScanning = false }) => {
  const [filter, setFilter] = useState('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Используем только реальные устройства
  const devicesToDisplay = realDevices.map((d, idx) => ({
    ...d,
    id: d.id || `device-${idx}`,
    os: d.os || 'Auto-detected',
    type: d.type || 'Workstation',
    status: d.status || 'Online',
  }));

  const filteredDevices = filter === 'All' 
    ? devicesToDisplay 
    : devicesToDisplay.filter((d: any) => d.type === filter);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Router': return <Globe size={16} className="text-orange-600" />;
      case 'Workstation': return <Monitor size={16} className="text-blue-600" />;
      case 'Server': return <Server size={16} className="text-purple-600" />;
      case 'Printer': return <Printer size={16} className="text-green-600" />;
      case 'IoT': return <Smartphone size={16} className="text-cyan-600" />;
      default: return <Cpu size={16} className="text-slate-600" />;
    }
  };

  const typeLabels: { [key: string]: string } = {
    'Router': 'Маршрутизатор',
    'Workstation': 'Рабочая станция',
    'Server': 'Сервер',
    'Printer': 'Принтер',
    'IoT': 'IoT устройство'
  };

  return (
    <div className="space-y-6">
      {(!realDevices || realDevices.length === 0) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-900">
          <p className="font-medium">ℹ️ Данные о сети ещё не загружены</p>
          <p className="text-sm">Нажмите кнопку <strong>"Запустить аудит"</strong> для сканирования сети</p>
        </div>
      )}
      
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Сетевое окружение</h2>
          <p className="text-slate-500">Найдено: {devicesToDisplay.length} активных узлов</p>
        </div>
        <div className="flex gap-2 flex-col sm:flex-row">
          <button
            onClick={onAudit}
            disabled={isScanning}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-sm"
          >
            <RefreshCw size={16} className={isScanning ? 'animate-spin' : ''} />
            {isScanning ? 'Сканирование...' : 'Запустить аудит сканера'}
          </button>
        </div>
      </div>

      {/* Фильтры */}
      <div className="flex gap-2 flex-wrap">
        {['All', 'Workstation', 'Server', 'Router', 'Printer'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === f ? 'bg-slate-800 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {f === 'All' ? 'Все' : f}
          </button>
        ))}
      </div>

      {/* Компактная таблица */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Устройство</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">IP адрес</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">MAC адрес</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Тип</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Статус</th>
              </tr>
            </thead>
            <tbody>
              {filteredDevices.length > 0 ? (
                filteredDevices.map((device: any) => (
                  <tr 
                    key={device.id} 
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => setExpandedId(expandedId === device.id ? null : device.id)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-800">{device.hostname}</span>
                        {expandedId === device.id && <ChevronUp size={16} className="text-slate-400" />}
                        {expandedId !== device.id && <ChevronDown size={16} className="text-slate-400" />}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600">{device.ip}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{device.mac || 'Unknown'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(device.type)}
                        <span className="text-slate-600">{typeLabels[device.type] || device.type}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 text-green-800 text-xs font-medium">
                        <span className="w-2 h-2 rounded-full bg-green-600 animate-pulse"></span>
                        Online
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    Нет устройств для отображения
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Статистика по типам */}
      {devicesToDisplay.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {['Router', 'Workstation', 'Server', 'Printer', 'IoT'].map(type => {
            const count = devicesToDisplay.filter((d: any) => d.type === type).length;
            return count > 0 ? (
              <div key={type} className="bg-white border border-slate-200 rounded-lg p-3 text-center">
                <div className="flex justify-center mb-1">
                  {getTypeIcon(type)}
                </div>
                <div className="text-xl font-bold text-slate-800">{count}</div>
                <div className="text-xs text-slate-500">{typeLabels[type]}</div>
              </div>
            ) : null;
          })}
        </div>
      )}
    </div>
  );
};

export default NetworkScanner;
