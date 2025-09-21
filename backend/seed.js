const fs = require('fs');
const path = require('path');
const { db } = require('./db');

const sql = fs.readFileSync(path.join(__dirname, 'migrations', 'init.sql'), 'utf8');

db.exec(sql, (err) => {
  if (err) {
    console.error('Failed to initialize DB', err);
    process.exit(1);
  }
  console.log('DB initialized');

  const insertCustomer = `INSERT INTO customers (first_name, last_name, phone, email, account_type, only_one_address) VALUES (?,?,?,?,?,?)`;
  const insertAddress = `INSERT INTO addresses (customer_id, line1, line2, city, state, pincode, country, is_primary) VALUES (?,?,?,?,?,?,?,?)`;

  db.run(insertCustomer, ['Sita', 'Kumar', '9876543210', 'sita@example.com', 'regular', 1], function(err) {
    if (!err) {
      const cid = this.lastID;
      db.run(insertAddress, [cid, 'House 1', 'Near Park', 'Vijayawada', 'AP', '520001', 'India', 1]);
    }
  });

  db.run(insertCustomer, ['Ravi', 'Shah', '9123456780', 'ravi@example.com', 'premium', 0], function(err) {
    if (!err) {
      const cid = this.lastID;
      db.run(insertAddress, [cid, 'Flat 302', 'MG Road', 'Hyderabad', 'Telangana', '500001', 'India', 1]);
      db.run(insertAddress, [cid, 'Office 5', 'Banjara Hills', 'Hyderabad', 'Telangana', '500034', 'India', 0]);
    }
  });

  console.log('Seed data inserted (if not present).');
  process.exit(0);
});
