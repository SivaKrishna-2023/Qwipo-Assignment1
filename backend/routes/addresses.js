const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { run, get, all } = require('../db');

const router = express.Router();

router.post('/',
  body('customer_id').isInt(),
  body('line1').isLength({ min: 1 }),
  body('city').isLength({ min: 1 }),
  body('state').isLength({ min: 1 }),
  body('pincode').isLength({ min: 3 }),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      const { customer_id, line1, line2, city, state, pincode, country, is_primary } = req.body;

      const customer = await get('SELECT * FROM customers WHERE id = ?', [customer_id]);
      if (!customer) return res.status(404).json({ message: 'Customer not found' });

      if (is_primary) {
        await run('UPDATE addresses SET is_primary = 0 WHERE customer_id = ?', [customer_id]);
      }

      const resInsert = await run(`INSERT INTO addresses (customer_id, line1, line2, city, state, pincode, country, is_primary) VALUES (?,?,?,?,?,?,?,?)`, [customer_id, line1, line2 || null, city, state, pincode, country || 'India', is_primary ? 1 : 0]);

      const count = await get('SELECT COUNT(*) as cnt FROM addresses WHERE customer_id = ?', [customer_id]);
      const onlyOne = count.cnt === 1 ? 1 : 0;
      await run('UPDATE customers SET only_one_address = ? WHERE id = ?', [onlyOne, customer_id]);

      const address = await get('SELECT * FROM addresses WHERE id = ?', [resInsert.id]);
      res.status(201).json({ message: 'Address added', address });
    } catch (err) { next(err); }
  });


router.put('/:id',
  param('id').isInt(),
  body('line1').optional().isLength({ min: 1 }),
  body('city').optional().isLength({ min: 1 }),
  async (req, res, next) => {
    try {
      const id = req.params.id;
      const addr = await get('SELECT * FROM addresses WHERE id = ?', [id]);
      if (!addr) return res.status(404).json({ message: 'Address not found' });

      const { line1, line2, city, state, pincode, is_primary } = req.body;
      const updates = [];
      const params = [];
      if (line1) { updates.push('line1 = ?'); params.push(line1); }
      if (line2 !== undefined) { updates.push('line2 = ?'); params.push(line2); }
      if (city) { updates.push('city = ?'); params.push(city); }
      if (state) { updates.push('state = ?'); params.push(state); }
      if (pincode) { updates.push('pincode = ?'); params.push(pincode); }
      if (is_primary !== undefined) {
        if (is_primary) await run('UPDATE addresses SET is_primary = 0 WHERE customer_id = ?', [addr.customer_id]);
        updates.push('is_primary = ?'); params.push(is_primary ? 1 : 0);
      }
      if (updates.length === 0) return res.status(400).json({ message: 'No updates provided' });
      params.push(id);
      await run(`UPDATE addresses SET ${updates.join(', ')}, updated_at = datetime('now') WHERE id = ?`, params);

      const updated = await get('SELECT * FROM addresses WHERE id = ?', [id]);
      res.json({ message: 'Address updated', address: updated });
    } catch (err) { next(err); }
  });

router.delete('/:id', param('id').isInt(), async (req, res, next) => {
  try {
    const id = req.params.id;
    const addr = await get('SELECT * FROM addresses WHERE id = ?', [id]);
    if (!addr) return res.status(404).json({ message: 'Address not found' });

    const customerId = addr.customer_id;
    await run('DELETE FROM addresses WHERE id = ?', [id]);

    const count = await get('SELECT COUNT(*) as cnt FROM addresses WHERE customer_id = ?', [customerId]);
    const onlyOne = count.cnt === 1 ? 1 : 0;
    await run('UPDATE customers SET only_one_address = ? WHERE id = ?', [onlyOne, customerId]);

    res.json({ message: 'Address deleted' });
  } catch (err) { next(err); }
});


router.get('/customers-with-multiple-addresses', async (req, res, next) => {
  try {
    const rows = await all(`
      SELECT c.id as customer_id, c.first_name, c.last_name, COUNT(a.id) as address_count
      FROM customers c
      JOIN addresses a ON c.id = a.customer_id
      GROUP BY c.id
      HAVING COUNT(a.id) > 1
      ORDER BY address_count DESC
    `);
    res.json({ results: rows });
  } catch (err) { next(err); }
});


router.get('/search', async (req, res, next) => {
  try {
    const { city, state, pincode } = req.query;
    const clauses = [];
    const params = [];
    if (city) { clauses.push('city = ?'); params.push(city); }
    if (state) { clauses.push('state = ?'); params.push(state); }
    if (pincode) { clauses.push('pincode = ?'); params.push(pincode); }
    if (clauses.length === 0) return res.status(400).json({ message: 'Provide at least one filter' });

    const sql = `SELECT * FROM addresses WHERE ${clauses.join(' AND ')} ORDER BY is_primary DESC, id ASC`;
    const rows = await all(sql, params);
    res.json({ results: rows });
  } catch (err) { next(err); }
});

module.exports = router;
