module.exports = {
  "development": {
    "use_env_variable": process.env.DATABASE_URL,
    "dialect": "postgres",
    "ssl": true,
    "dialectOptions": {
      "ssl": true
    }
  },
  "test": {
    "use_env_variable": process.env.DATABASE_URL,
    "dialect": "postgres",
    "ssl": true,
    "dialectOptions": {
      "ssl": true
    }
  },
  "production": {
    "use_env_variable": process.env.DATABASE_URL,
    "dialect": "postgres",
    "ssl": true,
    "dialectOptions": {
      "ssl": true
    }
  }
}
