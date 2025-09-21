const express = require('express');
const { body, validationResult, param, query } = require('express-validator');
const { run, get, all } = require('../db');

const router = express.Router();
router.post('/',
  body('first_name').isLength({ min: 1 }).withMessage('First name required'),
  body('last_name').isLength({ min: 1 }).withMessage('Last name required'),
  body('phone').matches(/^\d{10}$/).withMessage('Phone must be 10 digits'),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { first_name, last_name, phone, email, account_type } = req.body;

      const existing = await all('SELECT id FROM customers WHERE phone = ? OR email = ?', [phone, email || null]);
      if (existing && existing.length > 0) {
        return res.status(409).json({ message: 'Duplicate phone or email' });
      }

      const result = await run(`INSERT INTO customers (first_name, last_name, phone, email, account_type) VALUES (?,?,?,?,?)`, [first_name, last_name, phone, email || null, account_type || null]);

      const customer = await get('SELECT * FROM customers WHERE id = ?', [result.id]);
      res.status(201).json({ message: 'Customer created', customer });
    } catch (err) {
      next(err);
    }
  });

router.get('/', async (req, res, next) => {
  try {
    let { page = 1, limit = 10, sortBy = 'created_at', order = 'desc', city, state, pincode, q } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    const offset = (page - 1) * limit;

    const whereClauses = [];
    const params = [];

    if (city) { whereClauses.push('a.city = ?'); params.push(city); }
    if (state) { whereClauses.push('a.state = ?'); params.push(state); }
    if (pincode) { whereClauses.push('a.pincode = ?'); params.push(pincode); }
    if (q) {
      whereClauses.push('(c.first_name LIKE ? OR c.last_name LIKE ? OR c.email LIKE ? OR a.line1 LIKE ? OR a.line2 LIKE ? )');
      const like = `%${q}%`;
      params.push(like, like, like, like, like);
    }

    const where = whereClauses.length ? 'WHERE ' + whereClauses.join(' AND ') : '';

    const sql = `
      SELECT c.*, group_concat(a.city || '|' || a.pincode) AS addresses_summary
      FROM customers c
      LEFT JOIN addresses a ON c.id = a.customer_id
      ${where}
      GROUP BY c.id
      ORDER BY ${sortBy} ${order}
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);
    const rows = await all(sql, params);

    const countSql = `SELECT COUNT(DISTINCT c.id) as total FROM customers c LEFT JOIN addresses a ON c.id = a.customer_id ${where}`;
    // use same params except pagination ones:
    const countParams = params.slice(0, Math.max(0, params.length - 2));
    const totalRow = await get(countSql, countParams);
    res.json({ page, limit, total: totalRow ? totalRow.total : 0, customers: rows });
  } catch (err) { next(err); }
});

router.get('/:id',
  param('id').isInt(),
  async (req, res, next) => {
    try {
      const id = req.params.id;
      const customer = await get('SELECT * FROM customers WHERE id = ?', [id]);
      if (!customer) return res.status(404).json({ message: 'Customer not found' });
      const addresses = await all('SELECT * FROM addresses WHERE customer_id = ? ORDER BY is_primary DESC, id ASC', [id]);

      customer.only_one_address = addresses.length === 1 ? 1 : 0;

      res.json({ customer, addresses });
    } catch (err) { next(err); }
  });

router.put('/:id',
  param('id').isInt(),
  body('first_name').optional().isLength({ min: 1 }),
  body('last_name').optional().isLength({ min: 1 }),
  body('phone').optional().matches(/^\d{10}$/),
  async (req, res, next) => {
    try {
      const id = req.params.id;
      const customer = await get('SELECT * FROM customers WHERE id = ?', [id]);
      if (!customer) return res.status(404).json({ message: 'Customer not found' });

      const { first_name, last_name, phone, email, account_type } = req.body;

      if (phone || email) {
        const existing = await all('SELECT id FROM customers WHERE (phone = ? OR email = ?) AND id != ?', [phone || '', email || '', id]);
        if (existing.length > 0) return res.status(409).json({ message: 'Duplicate phone or email' });
      }

      const updates = [];
      const params = [];
      if (first_name) { updates.push('first_name = ?'); params.push(first_name); }
      if (last_name) { updates.push('last_name = ?'); params.push(last_name); }
      if (phone) { updates.push('phone = ?'); params.push(phone); }
      if (email !== undefined) { updates.push('email = ?'); params.push(email); }
      if (account_type !== undefined) { updates.push('account_type = ?'); params.push(account_type); }

      if (updates.length === 0) return res.status(400).json({ message: 'No fields to update' });

      params.push(id);
      const sql = `UPDATE customers SET ${updates.join(', ')}, updated_at = datetime('now') WHERE id = ?`;
      await run(sql, params);
      const updated = await get('SELECT * FROM customers WHERE id = ?', [id]);
      res.json({ message: 'Customer updated', customer: updated });
    } catch (err) { next(err); }
  });


router.delete('/:id', param('id').isInt(), async (req, res, next) => {
  try {
    const id = req.params.id;
    const customer = await get('SELECT * FROM customers WHERE id = ?', [id]);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    await run('DELETE FROM addresses WHERE customer_id = ?', [id]);
    await run('DELETE FROM customers WHERE id = ?', [id]);
    res.json({ message: 'Customer deleted' });
  } catch (err) { next(err); }
});

router.post('/:id/update-only-one-flag', param('id').isInt(), async (req, res, next) => {
  try {
    const id = req.params.id;
    const addresses = await all('SELECT * FROM addresses WHERE customer_id = ?', [id]);
    const onlyOne = addresses.length === 1 ? 1 : 0;
    await run('UPDATE customers SET only_one_address = ?, updated_at = datetime("now") WHERE id = ?', [onlyOne, id]);
    res.json({ message: 'Flag updated', only_one_address: onlyOne });
  } catch (err) { next(err); }
});

module.exports = router;
