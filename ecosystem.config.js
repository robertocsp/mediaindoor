module.exports = {
  apps: [{
    name: 'media-indoor-backend',
    script: 'loader.js',

    // Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
    //args: 'one two',
    instances: 1,
    autorestart: true,
    watch: false,
    watch_options: {
      usePolling: true
    },
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      MONGODB_URI: 'mongodb://mongo/db_anunciostv',
      PASS_SECRET: 'FAKsJ9hP5C'
    },
    env_production: {
      NODE_ENV: 'production'
    }
  }]
};
