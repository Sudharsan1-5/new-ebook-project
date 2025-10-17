import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Key, Users, TrendingUp, Settings, Save, Eye, EyeOff, Plus, X, ArrowLeft, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface APIKey {
  id: string;
  service_name: string;
  api_key: string;
  is_active: boolean;
  usage_count: number;
  last_used_at: string | null;
  created_at: string;
}

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  subscription_tier: string;
  ebooks_created: number;
  ebooks_limit: number;
  created_at: string;
}

interface AdminPanelProps {
  onNavigateToDashboard?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onNavigateToDashboard }) => {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'api-keys' | 'users' | 'analytics'>('api-keys');

  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [showKeys, setShowKeys] = useState<{ [key: string]: boolean }>({});
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [keyValue, setKeyValue] = useState('');

  const [newKeyService, setNewKeyService] = useState<'mistral' | 'stability_ai'>('mistral');
  const [newKeyValue, setNewKeyValue] = useState('');
  const [showNewKeyForm, setShowNewKeyForm] = useState(false);

  useEffect(() => {
    loadApiKeys();
    loadUsers();
  }, []);

  const loadApiKeys = async () => {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApiKeys(data || []);
    } catch (error: any) {
      console.error('Error loading API keys:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      console.error('Error loading users:', error);
    }
  };

  const handleAddApiKey = async () => {
    if (!newKeyValue.trim()) {
      setMessage('Please enter an API key');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('api_keys')
        .insert({
          service_name: newKeyService,
          api_key: newKeyValue,
          is_active: true,
          created_by: user?.id
        });

      if (error) throw error;

      setMessage('API key added successfully');
      setNewKeyValue('');
      setShowNewKeyForm(false);
      await loadApiKeys();
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateApiKey = async (id: string, updates: Partial<APIKey>) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('api_keys')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setMessage('API key updated successfully');
      setEditingKey(null);
      setKeyValue('');
      await loadApiKeys();
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleKeyStatus = async (id: string, currentStatus: boolean) => {
    await handleUpdateApiKey(id, { is_active: !currentStatus });
  };

  const handleDeleteApiKey = async (id: string) => {
    if (!confirm('Are you sure you want to delete this API key?')) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setMessage('API key deleted successfully');
      await loadApiKeys();
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUserTier = async (userId: string, tier: string, limit: number) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          subscription_tier: tier,
          ebooks_limit: limit
        })
        .eq('id', userId);

      if (error) throw error;

      setMessage('User subscription updated successfully');
      await loadUsers();
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const renderApiKeysTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">API Key Management</h2>
          <p className="text-gray-600 mt-1">Manage API keys for Mistral AI and Stability AI</p>
        </div>
        <Button variant="primary" onClick={() => setShowNewKeyForm(true)}>
          <Plus className="w-5 h-5 mr-2" />
          Add API Key
        </Button>
      </div>

      {showNewKeyForm && (
        <div className="bg-white border-2 border-blue-200 rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Add New API Key</h3>
            <button onClick={() => setShowNewKeyForm(false)}>
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Service</label>
              <select
                value={newKeyService}
                onChange={(e) => setNewKeyService(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="mistral">Mistral AI</option>
                <option value="stability_ai">Stability AI</option>
              </select>
            </div>

            <Input
              label="API Key"
              type="password"
              value={newKeyValue}
              onChange={(e) => setNewKeyValue(e.target.value)}
              placeholder="Enter API key"
            />

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowNewKeyForm(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleAddApiKey} loading={loading}>
                <Save className="w-4 h-4 mr-2" />
                Save Key
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {apiKeys.length === 0 ? (
          <div className="bg-gray-50 rounded-xl p-12 text-center">
            <Key className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No API keys configured yet</p>
            <p className="text-sm text-gray-500 mt-1">Add your first API key to enable AI generation</p>
          </div>
        ) : (
          apiKeys.map((key) => (
            <div key={key.id} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {key.service_name === 'mistral' ? 'Mistral AI' : 'Stability AI'}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        key.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {key.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {editingKey === key.id ? (
                      <div className="flex items-center space-x-2">
                        <Input
                          type="password"
                          value={keyValue}
                          onChange={(e) => setKeyValue(e.target.value)}
                          placeholder="Enter new API key"
                          className="flex-1"
                        />
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleUpdateApiKey(key.id, { api_key: keyValue })}
                        >
                          <Save className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingKey(null);
                            setKeyValue('');
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <code className="text-sm bg-gray-100 px-3 py-1 rounded font-mono flex-1">
                          {showKeys[key.id]
                            ? key.api_key
                            : '•'.repeat(32)}
                        </code>
                        <button
                          onClick={() =>
                            setShowKeys((prev) => ({ ...prev, [key.id]: !prev[key.id] }))
                          }
                          className="text-gray-500 hover:text-gray-700"
                        >
                          {showKeys[key.id] ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    )}

                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>Used: {key.usage_count} times</span>
                      {key.last_used_at && (
                        <span>
                          Last used: {new Date(key.last_used_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingKey(key.id);
                      setKeyValue(key.api_key);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant={key.is_active ? 'secondary' : 'primary'}
                    size="sm"
                    onClick={() => handleToggleKeyStatus(key.id, key.is_active)}
                  >
                    {key.is_active ? 'Disable' : 'Enable'}
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteApiKey(key.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderUsersTab = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
        <p className="text-gray-600 mt-1">Manage user subscriptions and limits</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Subscription
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                eBooks
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Joined
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((userProfile) => (
              <tr key={userProfile.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {userProfile.email}
                    </div>
                    <div className="text-sm text-gray-500">{userProfile.full_name || 'N/A'}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={userProfile.subscription_tier}
                    onChange={(e) => {
                      const tier = e.target.value;
                      const limits = { free: 1, basic: 5, pro: 999 };
                      handleUpdateUserTier(userProfile.id, tier, limits[tier as keyof typeof limits]);
                    }}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="free">Free</option>
                    <option value="basic">Basic</option>
                    <option value="pro">Pro</option>
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {userProfile.ebooks_created} / {userProfile.ebooks_limit}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(userProfile.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderAnalyticsTab = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Analytics & Usage</h2>
        <p className="text-gray-600 mt-1">Track platform usage and metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{users.length}</p>
            </div>
            <Users className="w-12 h-12 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total API Keys</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{apiKeys.length}</p>
            </div>
            <Key className="w-12 h-12 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total API Calls</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {apiKeys.reduce((sum, key) => sum + key.usage_count, 0)}
              </p>
            </div>
            <TrendingUp className="w-12 h-12 text-purple-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription Distribution</h3>
        <div className="space-y-3">
          {['free', 'basic', 'pro'].map((tier) => {
            const count = users.filter((u) => u.subscription_tier === tier).length;
            const percentage = users.length > 0 ? (count / users.length) * 100 : 0;

            return (
              <div key={tier}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700 capitalize">{tier}</span>
                  <span className="text-gray-600">
                    {count} users ({percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      tier === 'free'
                        ? 'bg-gray-500'
                        : tier === 'basic'
                        ? 'bg-blue-500'
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-red-600 p-2 rounded-lg">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user?.email}</span>
              {onNavigateToDashboard && (
                <Button variant="outline" size="sm" onClick={onNavigateToDashboard}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {message && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-900">{message}</p>
          </div>
        )}

        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('api-keys')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'api-keys'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Key className="w-5 h-5 inline-block mr-2" />
                API Keys
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'users'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Users className="w-5 h-5 inline-block mr-2" />
                Users
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'analytics'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <TrendingUp className="w-5 h-5 inline-block mr-2" />
                Analytics
              </button>
            </nav>
          </div>
        </div>

        {activeTab === 'api-keys' && renderApiKeysTab()}
        {activeTab === 'users' && renderUsersTab()}
        {activeTab === 'analytics' && renderAnalyticsTab()}
      </main>
    </div>
  );
};
