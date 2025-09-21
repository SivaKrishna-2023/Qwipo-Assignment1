const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const morgan = require('morgan');

const customersRouter = require('./routes/customers');
const addressesRouter = require('./routes/addresses');
const errorHandler = require('./middlewares/errorHandler');
const logger = require('./middlewares/logger');
const { db } = require('./db');

const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(morgan('dev'));

const initSql = fs.readFileSync(path.join(__dirname, 'migrations', 'init.sql'), 'utf8');
db.exec(initSql, (err) => {
  if (err) console.error('Migration error', err);
  else console.log('Migrations applied');
});

app.use('/api/customers', customersRouter);
app.use('/api/addresses', addressesRouter);

app.get('/health', (req, res) => res.json({ ok: true, time: new Date() }));

app.use(errorHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
