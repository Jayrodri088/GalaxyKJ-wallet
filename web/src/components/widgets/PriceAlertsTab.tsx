'use client';

import React, { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { X, Plus,Eye ,Save, Bell } from 'lucide-react';

interface PriceAlert {
  id: string;
  asset: string;
  type: string;
  condition: string;
  value: string;
  active: boolean;
  icon: string;
}

const initialAlerts: PriceAlert[] = [
  {
    id: '1',
    asset: 'XLM',
    type: 'Price Above',
    condition: '$0.45',
    value: '0.45',
    active: true,
    icon: 'XLM'
  },
  {
    id: '2',
    asset: 'BTC',
    type: 'Price Below',
    condition: '$25,000',
    value: '25000',
    active: true,
    icon: 'BTC'
  },
  {
    id: '3',
    asset: 'ETH',
    type: 'Price Change',
    condition: '15% in 24h',
    value: '15',
    active: false,
    icon: 'ETH'
  },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('price-alerts');
  const [alerts, setAlerts] = useState<PriceAlert[]>(initialAlerts);
  const [selectedAsset, setSelectedAsset] = useState<string>('');
  const [selectedAlertType, setSelectedAlertType] = useState<string>('');
  const [alertValue, setAlertValue] = useState<string>('');
  const [notificationSettings, setNotificationSettings] = useState({
    inApp: false,
    email: true,
    sms: true,
  });

  const handleToggleAlert = (alertId: string) => {
    setAlerts(alerts.map(alert =>
      alert.id === alertId ? { ...alert, active: !alert.active } : alert
    ));
  };

  const handleRemoveAlert = (alertId: string) => {
    setAlerts(alerts.filter(alert => alert.id !== alertId));
  };

  const handleCreateAlert = () => {
    if (!selectedAsset || !selectedAlertType || !alertValue) return;

    const newAlert: PriceAlert = {
      id: Date.now().toString(),
      asset: selectedAsset,
      type: selectedAlertType,
      condition: `${selectedAlertType === 'Price Change' ? alertValue + '%' : '$' + alertValue}`,
      value: alertValue,
      active: true,
      icon: selectedAsset
    };

    setAlerts([...alerts, newAlert]);
  
    setSelectedAsset('');
    setSelectedAlertType('');
    setAlertValue('');
  };


  const getIconColor = (asset: string) => {
    switch (asset) {
      case 'XLM': return ' bg-[#274267]/50 text-blue-700';
      case 'BTC': return 'bg-[#BD8D12]/20 text-[#BD8D12]';
      case 'ETH': return 'bg-[#236A3E]/30 text-green-500';
      default: return 'bg-purple-600';
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 p-6 text-gray-100">
      <div className="">
        <div className="flex justify-between items-center mb-8 bg-gray-900/30 backdrop-blur-md">
          <div className="flex space-y-2 flex-col">
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">Widget Configuration</h1>
            <p className="text-sm text-gray-400">Customize your dashboard with widgets and personalized views</p>
          </div>
          <div className="flex space-x-3">
            <button className="px-4 py-2 rounded-md bg-gray-900/95  text-white text-sm flex justify-center items-center gap-2"> <Eye size={16}/> Preview</button>
            <button className="px-4 py-2 rounded-md bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm flex items-center">
              <span className='flex items-center gap-2'> <Save size={16}/> Save Layout</span>
            </button>
          </div>
        </div>

        
        <div className="flex  justify-between mb-6  bg-gray-900/60   text-sm">
          <button 
            onClick={() => setActiveTab('widgets')}
            className={`mx-auto w-full py-2 flex items-center justify-center  space-x-2 ${activeTab === 'widgets' ? 'text-white bg-purple-900/30' : 'text-gray-400'}`}>
            <span className='flex items-center gap-2'> <Save size={16}/>Widgets</span>
          </button>
          <button 
            onClick={() => setActiveTab('custom-views')}
            className={`mx-auto w-full py-2 flex items-center justify-center  space-x-2 ${activeTab === 'custom-views' ? 'text-white bg-purple-900/30' : 'text-gray-400'}`}>
            <span className='flex items-center justify-center gap-2'> <Eye size={16}/>Custom Views</span>
          </button>
          <button 
            onClick={() => setActiveTab('price-alerts')}
            className={`mx-auto w-full py-2 flex items-center space-x-2 justify-center  ${activeTab === 'price-alerts' ? 'text-white bg-purple-900/50' : 'text-gray-400'}`}>
            <span className='flex items-center gap-2'> <Bell size={16}/>Price Alerts</span>
          </button>
        </div>

        {activeTab === 'widgets' && (
          <div className="p-6">
            <h2 className="text-xl font-semibold text-white">Widgets</h2>
            <p className="text-gray-400 mt-2">Hello Widgets! Configure your dashboard widgets here.</p>
          </div>
        )}

        {activeTab === 'custom-views' && (
          <div className="p-6">
            <h2 className="text-xl font-semibold text-white">Custom Views</h2>
            <p className="text-gray-400 mt-2">Hello Custom Views! Create and manage your personalized dashboard layouts.</p>
          </div>
        )}

        {activeTab === 'price-alerts' && (
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">Price Alerts</h2>
            <button className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-3 py-1.5 rounded-md">
              <Plus size={16} />
              <span className="text-sm">New Alert</span>
            </button>
          </div>
        )}
      </div>
      
      {activeTab === 'price-alerts' && (
        <>
         
          <div className="bg-gray-900/30 backdrop-blur-md border border-gray-800 rounded-lg p-6 space-y-4">
            <h3 className="text-lg font-semibold text-white">Active Alerts</h3>
            <p className="text-sm text-gray-400">Get notified when price conditions are met</p>
            
            <div className="space-y-3 mt-4">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between bg-gray-900/50 backdrop-blur-sm p-4 rounded-lg border border-gray-800"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 p-2 rounded-full ${getIconColor(alert.asset)} flex items-center justify-center  font-bold`}>
                      {alert.icon}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">
                        {alert.asset} {alert.type}
                      </div>
                      <div className="text-xs text-gray-200">
                      <span className="text-gray-500">Condition: </span>{alert.condition}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Switch
                      checked={alert.active}
                      onCheckedChange={() => handleToggleAlert(alert.id)}
                      className={`${
                        alert.active 
                          ? "data-[state=checked]:bg-purple-600" 
                          : "data-[state=unchecked]:bg-gray-800"
                      }`}
                    />
                    <button
                      onClick={() => handleRemoveAlert(alert.id)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        
          <div className="bg-gray-900/30 backdrop-blur-md border border-gray-800 rounded-lg p-6 space-y-4">
            <h3 className="text-lg font-semibold text-white">Create New Alert</h3>
            <p className="text-sm text-gray-400">Set up custom price alerts for any asset</p>

            <div className="space-y-5 mt-4">
              <div>
                <label className="text-sm text-gray-400 block mb-2">Asset</label>
                <Select value={selectedAsset} onValueChange={setSelectedAsset}>
                  <SelectTrigger className="w-full bg-gray-800 outline-0 border-0 text-gray-300">
                    <SelectValue placeholder="Select asset" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border border-gray-900 text-gray-300">
                    <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                    <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
                    <SelectItem value="XLM">Stellar (XLM)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-gray-400 block mb-2">Alert Type</label>
                <Select value={selectedAlertType} onValueChange={setSelectedAlertType}>
                  <SelectTrigger className="w-full bg-gray-800 border-0 text-gray-300">
                    <SelectValue placeholder="Select alert type" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border border-gray-900 text-gray-300">
                    <SelectItem value="Price Above">Price Above</SelectItem>
                    <SelectItem value="Price Below">Price Below</SelectItem>
                    <SelectItem value="Price Change">Price Change (%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-gray-400 block mb-2">Value</label>
                <Input
                  type="number"
                  value={alertValue}
                  onChange={(e) => setAlertValue(e.target.value)}
                  placeholder="Enter value"
                  className="bg-gray-800 border-0 text-gray-300"
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm text-gray-400 block mb-2">Notification Method</label>
                <div className="flex items-center gap-3 justify-start py-2">
                  <Switch
                    checked={notificationSettings.inApp}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({ ...notificationSettings, inApp: checked })
                    }
                    className={`${
                        notificationSettings.inApp 
                          ? "data-[state=checked]:bg-purple-600" 
                          : "data-[state=unchecked]:bg-gray-800"
                      }`}
                  />
                  <span className="text-sm text-gray-300">In-app notification</span>
                </div>
                <div className="flex items-center gap-3 justify-start py-2">
                  <Switch
                    checked={notificationSettings.email}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({ ...notificationSettings, email: checked })
                    }
                    className={`${
                        notificationSettings.email
                          ? "data-[state=checked]:bg-purple-600" 
                          : "data-[state=unchecked]:bg-gray-800"
                      }`}
                  />
                  <span className="text-sm text-gray-300">Email notification</span>
                </div>
                <div className="flex items-center gap-3 justify-start py-2">
                  <Switch
                    checked={notificationSettings.sms}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({ ...notificationSettings, sms: checked })
                    }
                    className={`${
                        notificationSettings.sms
                          ? "data-[state=checked]:bg-purple-600" 
                          : "data-[state=unchecked]:bg-gray-800"
                      }`}
                  />
                  <span className="text-sm text-gray-300">SMS notification</span>
                </div>
              </div>

              <button
                onClick={handleCreateAlert}
                className="w-full py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                disabled={!selectedAsset || !selectedAlertType || !alertValue}
              >
                Create Alert
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}