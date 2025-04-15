require('dotenv').config();
const conectarDB = require('./config/db');
const express = require('express');
const cors = require("cors");
const app = express();

// Configuración inicial
conectarDB();
app.use(cors());
app.use(express.json());

// Rutas
const AllJobs = require('./jobs/AllJobs')
app.use('/DentalArce', require('./routes/routes'));
const webhookRouter = require('./routes/webhook')
app.use('/webhook', webhookRouter);


// Endpoint de salud
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy' });
});

// Jobs
AllJobs();

// Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running at ${PORT}`);
});