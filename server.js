require('dotenv').config();
const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');
const { Umzug, SequelizeStorage } = require('umzug');

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
      host: process.env.DB_HOST,
      dialect: 'postgres',
      logging: console.log,
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

app.patch('/balance', async (req, res) => {
    const { userId, amount } = req.body;
    if (!userId || !amount) return res.status(400).send('Missing parameters');

    try {
        await sequelize.transaction(async t => {
            const user = await User.findByPk(userId, { lock: t.LOCK.UPDATE, transaction: t });
            if (!user) return res.status(404).send('User not found');

            if (user.balance + amount < 0) {
                console.log(`Insufficient funds for user ${userId}. Requested: ${amount}, Current balance: ${user.balance}`);
                return res.status(402).send('Insufficient funds');
            }
            user.balance += amount;
            await user.save({ transaction: t });

            res.send({ balance: user.balance });
        });
    } catch (error) {
        console.error(`Error processing balance update for user ${userId}:`, error.message);
        res.status(500).send(error.message);
    }
});

async function createInitialUser() {
    const user = await User.findOne({ where: { id: 1 } });
    console.log('user:', user);

    if (!user) {
        await User.create({ balance: 10000 });
        console.log('Initial user created with balance 10000');

        const [results, metadata] = await sequelize.query('SELECT * FROM "Users"');
        console.log('Users in DB:', results);
    } else {
        console.log('User already exists');
    }
}

(async () => {
    try {
        console.log('Checking for pending migrations...');
        const pendingMigrations = await umzug.pending();
        
        if (pendingMigrations.length > 0) {
            console.log('Pending migrations:', pendingMigrations);
            await umzug.up();
            console.log('Migrations applied successfully');
        } else {
            console.log('No pending migrations.');
        }

        await sequelize.sync();
        await createInitialUser();

        app.listen(process.env.PORT || 3000, () => console.log(`Server running on port ${process.env.PORT || 3000}`));
    } catch (error) {
        console.error('Error during migrations or server startup:', error);
    }
})();
