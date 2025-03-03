require('dotenv').config();
const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');
const { Umzug, SequelizeStorage } = require('umzug');
const { createClient } = require('redis');
const Redis = require('ioredis');

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
      host: process.env.DB_HOST,
      dialect: 'postgres',
      logging: false,
      pool: {
        max: 20,
        min: 5,
        acquire: 30000,
        idle: 10000
    }
    }
  );

sequelize.authenticate()
    .then(() => console.log('Connected to database:', process.env.DB_NAME))
    .catch((err) => console.error('Database connection error:', err));

const User = sequelize.define('User', {
    balance: {
        type: DataTypes.INTEGER,
        allowNull: false,
    }
});

const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});
redisClient.connect()
    .then(() => console.log('Connected to Redis'))
    .catch(err => console.error('Redis connection error:', err));

const umzug = new Umzug({
    migrations: {
        glob: 'migrations/*.js'
    },
    context: sequelize.getQueryInterface(),
    storage: new SequelizeStorage({ sequelize }),
    logger: console,
});

const app = express();
app.use(express.json());
const redis = new Redis({ host: 'localhost', port: 6379 });

app.patch('/balance', async (req, res) => {
    const { userId, amount } = req.body;
    if (!userId || !amount) return res.status(400).send('Missing parameters');
    
    const balanceKey = `user:${userId}:balance`;

    try {
        let balance = await redis.get(balanceKey);
        
        if (balance === null) {
            const user = await User.findByPk(userId);
            if (!user) return res.status(404).send('User not found');

            balance = user.balance;
            await redis.set(balanceKey, balance, 'EX', 60);
        }

        balance = parseInt(balance);
        
        if (balance + amount < 0) {
            console.log(`Insufficient funds for user ${userId}. Requested: ${amount}, Current balance: ${balance}`);
            return res.status(422).send('Insufficient funds for transaction');
        }

        balance += amount;

        await redis.set(balanceKey, balance);
        res.send({ balance });

        User.update({ balance }, { where: { id: userId } });
    } catch (error) {
        console.error(`Error processing balance update for user ${userId}:`, error.message);
        res.status(500).send(error.message);
    }
});

async function createInitialUser() {
    const [user, created] = await User.findOrCreate({
        where: { id: 1 },
        defaults: { balance: 10000 }
    });

    if (!created) {
        await user.update({ balance: 10000 });
        console.log('User existed, balance reset to 10000');
    } else {
        console.log('Initial user created with balance 10000');
    }

    const [results] = await sequelize.query('SELECT * FROM "Users"');
    console.log('Users in DB:', results);
}

(async () => {
    try {
        await sequelize.authenticate();
        console.log('~~> 1. Database connected');
        
        console.log('~~> 2. Checking migrations...');
        const pendingMigrations = await umzug.pending();

        if (pendingMigrations.length > 0) {
            console.log('Pending migrations:', pendingMigrations);
            await umzug.up();
            console.log('Migrations applied successfully');
        } else {
            console.log('No pending migrations.');
        }

        console.log('~~> 3. Running DB sync...');
        await sequelize.sync();
        
        await createInitialUser();

        const server = app.listen(process.env.PORT || 3000, () => {
            console.log(`~~> 4. Server running on port ${process.env.PORT || 3000}`);
        });

        server.keepAliveTimeout = 120 * 1000;
        server.headersTimeout = 125 * 1000; 
    } catch (error) {
        console.error('Error during migrations or server startup:', error);
    }
})();
