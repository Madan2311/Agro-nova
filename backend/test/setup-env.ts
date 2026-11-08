process.env.NODE_ENV = 'test';
process.env.MONGODB_URI =
    'mongodb://root:ba9c5e10acfdceefc02e6ba306a32193@localhost:27017/productos_e2e?authSource=admin';
process.env.JWT_SECRET = '2241426543c05da582060ad82884f18343e4a848484fd52ca71465d32d62b6748bb38f7d4fc5f5b943ea423faa8e901';
process.env.JWT_EXPIRES_IN = '1h';
process.env.ADMIN_EMAIL = 'admin-e2e@test.com';
process.env.ADMIN_PASSWORD = 'Admin12345';