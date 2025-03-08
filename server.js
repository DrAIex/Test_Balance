require('dotenv').config();
const express = require('express');
const { sequelize } = require('./models');
const UserService = require('./services/userService');
const UserController = require('./controllers/userController');

const app = express();
app.use(express.json());

(async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected');

        await UserService.createInitialUser();

        app.patch('/balance', UserController.updateBalance);
        app.get('/balance/:userId', UserController.getBalance);

        const server = app.listen(process.env.PORT || 3000, () => {
            console.log(`Server running on port ${process.env.PORT || 3000}`);
        });

        server.keepAliveTimeout = 120 * 1000;
        server.headersTimeout = 125 * 1000;
    } catch (error) {
        console.error('Error during server startup:', error);
    }
})();
