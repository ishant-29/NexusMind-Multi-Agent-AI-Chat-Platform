module.exports = {
  apps: [
    {
      name: 'gateway-service',
      script: './services/gateway-service/index.js',
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'auth-service',
      script: './services/auth-service/dist/index.js',
      env: {
        NODE_ENV: 'production',
        PORT: 4000
      }
    },
    {
      name: 'user-service',
      script: './services/user-service/dist/index.js',
      env: {
        NODE_ENV: 'production',
        PORT: 4001
      }
    },
    {
      name: 'conversation-service',
      script: './services/conversation-service/dist/index.js',
      env: {
        NODE_ENV: 'production',
        PORT: 4002
      }
    },
    {
      name: 'file-service',
      script: './services/file-service/dist/index.js',
      env: {
        NODE_ENV: 'production',
        PORT: 4003
      }
    },
    {
      name: 'agent-service',
      script: 'python',
      args: '-m uvicorn main:app --host 127.0.0.1 --port 7777',
      cwd: './services/agent-service',
      interpreter: 'none',
      env: {
        PYTHONUTF8: '1'
      }
    }
  ]
};
