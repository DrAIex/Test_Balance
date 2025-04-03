require('dotenv').config();
const express = require('express');
const { sequelize } = require('./models');
const { Umzug, SequelizeStorage } = require('umzug');
const balanceRoutes = require('./routes/balanceRoutes');

const app = express();
app.use(express.json());

// Настраиваем Umzug для миграций
const umzug = new Umzug({
  migrations: { glob: 'migrations/*.js' },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize }),
  logger: console,
});

(async () => {
  try {
    // Подключаемся к базе данных
    await sequelize.authenticate();
    console.log('Database connected');

    // Запускаем миграции
    await umzug.up();
    console.log('Migrations completed');

    // Подключаем маршруты
    app.use('/balance', balanceRoutes);

    // Запускаем сервер
    const server = app.listen(process.env.PORT || 3000, () => {
      console.log(`Server running on port ${process.env.PORT || 3000}`);
    });

    server.keepAliveTimeout = 120 * 1000;
    server.headersTimeout = 125 * 1000;
  } catch (error) {
    console.error('Error during server startup:', error);
    process.exit(1);
  }
})();
