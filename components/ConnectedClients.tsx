import React from 'react';
import { Server, Power, AlertCircle, CheckCircle, Clock, RefreshCw } from 'lucide-react';

interface ClientData {
  client_id: string;
  hostname: string;
  ip: string;
  os: string;
  cpu: number;
  ram: number;
  disk: number;
  temp: number;
  processes: number;
  firewall: string;
  avStatus: string;
  lastSeen: string;
  status: string;
  uptime: string;
}

interface ConnectedClientsProps {
  clients?: ClientData[];
  onAudit?: () => Promise<void>;
  isScanning?: boolean;
}

const ConnectedClients: React.FC<ConnectedClientsProps> = ({ clients = [], onAudit, isScanning = false }) => {
  const getStatusIcon = (status: string) => {
    return status === 'Online' 
      ? <CheckCircle className="w-5 h-5 text-green-500" />
      : <AlertCircle className="w-5 h-5 text-red-500" />;
  };

  const getSecurityStatus = (firewall: string, av: string) => {
    if (firewall === 'Enabled' && av === 'Active') {
      return { color: 'text-green-500', label: 'Защищен' };
    } else if (firewall === 'Disabled' || av === 'Disabled') {
      return { color: 'text-red-500', label: 'Уязвим' };
    } else {
      return { color: 'text-yellow-500', label: 'Предупреждение' };
    }
  };

  const formatLastSeen = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diff < 60) return 'только что';
      if (diff < 3600) return '{} мин. назад'.replace('{}', Math.floor(diff / 60).toString());
      if (diff < 86400) return '{} ч. назад'.replace('{}', Math.floor(diff / 3600).toString());
      return date.toLocaleDateString('ru-RU');
    } catch {
      return 'неизвестно';
    }
  };

  if (clients.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Server className="w-5 h-5" />
            Подключенные ПК
          </h3>
          <button
            onClick={onAudit}
            disabled={isScanning}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-sm"
          >
            <RefreshCw size={16} className={isScanning ? 'animate-spin' : ''} />
            {isScanning ? 'Обновление...' : 'Запустить аудит ПК'}
          </button>
        </div>
        <div className="text-center py-8 text-gray-500">
          <p className="font-medium mb-2">Нет подключенных клиентов</p>
          <p className="text-sm">Нажмите кнопку выше для поиска удалённых клиентов</p>
          <p className="text-sm mt-2">
            Установите agent_client.py на другие ПК в сети
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Server className="w-5 h-5" />
            Подключенные ПК ({clients.length})
          </h3>
          <button
            onClick={onAudit}
            disabled={isScanning}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-sm"
          >
            <RefreshCw size={16} className={isScanning ? 'animate-spin' : ''} />
            {isScanning ? 'Обновление...' : 'Запустить аудит ПК'}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Компьютер</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">IP</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">CPU</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">RAM</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Диск</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Безопасность</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Статус</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Обновлено</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => {
                const security = getSecurityStatus(client.firewall, client.avStatus);
                const cpuColor = client.cpu > 80 ? 'text-red-500' : client.cpu > 50 ? 'text-yellow-500' : 'text-green-500';
                const ramColor = client.ram > 80 ? 'text-red-500' : client.ram > 50 ? 'text-yellow-500' : 'text-green-500';
                const diskColor = client.disk > 80 ? 'text-red-500' : client.disk > 50 ? 'text-yellow-500' : 'text-green-500';

                return (
                  <tr key={client.client_id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium text-gray-900">{client.hostname}</div>
                        <div className="text-xs text-gray-500">{client.os}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-700">{client.ip}</td>
                    <td className="py-3 px-4 text-center">
                      <div className={cpuColor + ' font-medium'}>{client.cpu.toFixed(1)}%</div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className={ramColor + ' font-medium'}>{client.ram.toFixed(1)}%</div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className={diskColor + ' font-medium'}>{client.disk.toFixed(1)}%</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className={security.color + ' text-sm font-medium'}>
                        {security.label}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        FW: {client.firewall} | AV: {client.avStatus}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(client.status)}
                        <span className="text-gray-700">{client.status}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-700">
                      <div className="flex items-center gap-2 text-xs">
                        <Clock className="w-4 h-4" />
                        {formatLastSeen(client.lastSeen)}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 p-4 bg-blue-50 rounded border border-blue-200">
          <p className="text-sm text-blue-900">
            <strong>Для добавления клиента:</strong> Запустите на другом ПК: 
            <code className="bg-blue-100 px-2 py-1 rounded text-xs ml-2">
              python agent_client.py http://[ВАШ_IP]:5000
            </code>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConnectedClients;
