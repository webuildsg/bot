module.exports = {
  apps: [{
    name: 'index',
    script: './index.js',
    watch: true,
    ignore_watch: ['uploads', 'data', 'data/users', '.git'],
    env: {
      'NODE_ENV': 'development'
    },
    env_production: {
      'NODE_ENV': 'production'
    }
  }
  ]
}
