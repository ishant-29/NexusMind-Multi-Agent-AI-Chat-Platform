'use client';

import { useState } from 'react';
import { agentService, authService, conversationService, fileService, userService } from '@/lib/services/serviceClient';

export default function TestIntegrationPage() {
  const [results, setResults] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const testService = async (name: string, testFn: () => Promise<any>) => {
    setLoading((prev) => ({ ...prev, [name]: true }));
    try {
      const result = await testFn();
      setResults((prev) => ({ ...prev, [name]: { success: true, data: result } }));
    } catch (error: any) {
      setResults((prev) => ({ ...prev, [name]: { success: false, error: error.message } }));
    } finally {
      setLoading((prev) => ({ ...prev, [name]: false }));
    }
  };

  const tests = [
    {
      name: 'Agent Service - List Agents',
      test: () => agentService.listAgents(),
    },
    {
      name: 'Agent Service - Get Stats',
      test: () => agentService.getStats(),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
          🧪 Microservices Integration Test
        </h1>

        <div className="space-y-4">
          {tests.map((test) => (
            <div
              key={test.name}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {test.name}
                </h2>
                <button
                  onClick={() => testService(test.name, test.test)}
                  disabled={loading[test.name]}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading[test.name] ? 'Testing...' : 'Run Test'}
                </button>
              </div>

              {results[test.name] && (
                <div className="mt-4">
                  {results[test.name].success ? (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-green-600 dark:text-green-400">✓</span>
                        <span className="font-medium text-green-900 dark:text-green-100">
                          Success
                        </span>
                      </div>
                      <pre className="text-xs text-green-800 dark:text-green-200 overflow-auto max-h-64">
                        {JSON.stringify(results[test.name].data, null, 2)}
                      </pre>
                    </div>
                  ) : (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-red-600 dark:text-red-400">✗</span>
                        <span className="font-medium text-red-900 dark:text-red-100">
                          Failed
                        </span>
                      </div>
                      <p className="text-sm text-red-800 dark:text-red-200">
                        {results[test.name].error}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
            📋 Service Status
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-32 text-gray-600 dark:text-gray-400">Auth Service:</span>
              <code className="text-blue-600 dark:text-blue-400">http://localhost:4000</code>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-32 text-gray-600 dark:text-gray-400">User Service:</span>
              <code className="text-blue-600 dark:text-blue-400">http://localhost:4001</code>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-32 text-gray-600 dark:text-gray-400">Conversation:</span>
              <code className="text-blue-600 dark:text-blue-400">http://localhost:4002</code>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-32 text-gray-600 dark:text-gray-400">File Service:</span>
              <code className="text-blue-600 dark:text-blue-400">http://localhost:4003</code>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-32 text-gray-600 dark:text-gray-400">Agent Service:</span>
              <code className="text-blue-600 dark:text-blue-400">http://localhost:7777</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
