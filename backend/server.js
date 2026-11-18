
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10
});

// Test database connection
app.get('/api/test', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT DATABASE() AS database_name');
    res.json({
      message: 'Backend connected to MySQL successfully',
      database: rows[0].database_name
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DASHBOARD
app.get('/api/dashboard', async (req, res) => {
  try {
    const [[fruits]] = await db.query(
      'SELECT COUNT(*) AS total FROM fruits'
    );
    const [[suppliers]] = await db.query(
      'SELECT COUNT(*) AS total FROM suppliers'
    );
    const [[vendors]] = await db.query(
      'SELECT COUNT(*) AS total FROM vendors'
    );
    const [[sales]] = await db.query(`
      SELECT COALESCE(SUM(sd.quantity * sd.unit_price), 0) AS total
      FROM sales_details sd
    `);
    const [[purchases]] = await db.query(
      'SELECT COUNT(*) AS total FROM purchases'
    );
    const [[stock]] = await db.query(`
      SELECT COALESCE(SUM(quantity_available), 0) AS total
      FROM stock
    `);

    res.json({
      fruits: fruits.total,
      suppliers: suppliers.total,
      vendors: vendors.total,
      sales: Number(sales.total),
      purchases: purchases.total,
      stock: stock.total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// FRUITS
app.get('/api/fruits', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM fruits ORDER BY fruit_id');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/fruits', async (req, res) => {
  try {
    const { fruit_name, description, status } = req.body;
    const [result] = await db.query(
      'INSERT INTO fruits (fruit_name, description, status) VALUES (?, ?, ?)',
      [fruit_name, description || null, status || 'Available']
    );
    res.status(201).json({ fruit_id: result.insertId });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/fruits/:id', async (req, res) => {
  try {
    const { fruit_name, description, status } = req.body;
    await db.query(
      `UPDATE fruits
       SET fruit_name = ?, description = ?, status = ?
       WHERE fruit_id = ?`,
      [fruit_name, description || null, status, req.params.id]
    );
    res.json({ message: 'Fruit updated successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/fruits/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM fruits WHERE fruit_id = ?', [req.params.id]);
    res.json({ message: 'Fruit deleted successfully' });
  } catch (error) {
    res.status(400).json({
      error: 'Could not delete fruit. It may be used in purchases, sales or stock.'
    });
  }
});

// SUPPLIERS
app.get('/api/suppliers', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM suppliers ORDER BY supplier_id'
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/suppliers', async (req, res) => {
  try {
    const { supplier_name, phone, address, email } = req.body;
    const [result] = await db.query(
      `INSERT INTO suppliers (supplier_name, phone, address, email)
       VALUES (?, ?, ?, ?)`,
      [supplier_name, phone || null, address || null, email || null]
    );
    res.status(201).json({ supplier_id: result.insertId });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/suppliers/:id', async (req, res) => {
  try {
    const { supplier_name, phone, address, email } = req.body;
    await db.query(
      `UPDATE suppliers
       SET supplier_name = ?, phone = ?, address = ?, email = ?
       WHERE supplier_id = ?`,
      [supplier_name, phone || null, address || null, email || null, req.params.id]
    );
    res.json({ message: 'Supplier updated successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/suppliers/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM suppliers WHERE supplier_id = ?', [req.params.id]);
    res.json({ message: 'Supplier deleted successfully' });
  } catch (error) {
    res.status(400).json({
      error: 'Could not delete supplier. It may have existing purchases.'
    });
  }
});

// VENDORS
app.get('/api/vendors', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM vendors ORDER BY vendor_id');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/vendors', async (req, res) => {
  try {
    const {
      vendor_name, business_name, phone, location, registration_date, status
    } = req.body;

    const [result] = await db.query(
      `INSERT INTO vendors
       (vendor_name, business_name, phone, location, registration_date, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        vendor_name,
        business_name || null,
        phone || null,
        location || null,
        registration_date || null,
        status || 'Active'
      ]
    );

    res.status(201).json({ vendor_id: result.insertId });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/vendors/:id', async (req, res) => {
  try {
    const {
      vendor_name, business_name, phone, location, registration_date, status
    } = req.body;

    await db.query(
      `UPDATE vendors SET
       vendor_name = ?, business_name = ?, phone = ?,
       location = ?, registration_date = ?, status = ?
       WHERE vendor_id = ?`,
      [
        vendor_name,
        business_name || null,
        phone || null,
        location || null,
        registration_date || null,
        status || 'Active',
        req.params.id
      ]
    );

    res.json({ message: 'Vendor updated successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/vendors/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM vendors WHERE vendor_id = ?', [req.params.id]);
    res.json({ message: 'Vendor deleted successfully' });
  } catch (error) {
    res.status(400).json({
      error: 'Could not delete vendor. The vendor may have existing sales.'
    });
  }
});

// PURCHASES
app.get('/api/purchases', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.purchase_id, p.supplier_id, p.fruit_id,
             p.quantity, p.purchase_date,
             s.supplier_name, f.fruit_name
      FROM purchases p
      JOIN suppliers s ON p.supplier_id = s.supplier_id
      JOIN fruits f ON p.fruit_id = f.fruit_id
      ORDER BY p.purchase_date DESC, p.purchase_id DESC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/purchases', async (req, res) => {
  try {
    const { supplier_id, fruit_id, quantity, purchase_date } = req.body;

    if (!supplier_id || !fruit_id || Number(quantity) <= 0) {
      return res.status(400).json({ error: 'Enter valid purchase details.' });
    }

    const [result] = await db.query(
      `INSERT INTO purchases
       (supplier_id, fruit_id, quantity, purchase_date)
       VALUES (?, ?, ?, ?)`,
      [supplier_id, fruit_id, quantity, purchase_date || new Date().toISOString().slice(0, 10)]
    );

    res.status(201).json({ purchase_id: result.insertId });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/purchases/:id', async (req, res) => {
  try {
    const { supplier_id, fruit_id, quantity, purchase_date } = req.body;

    await db.query(
      `UPDATE purchases
       SET supplier_id = ?, fruit_id = ?, quantity = ?, purchase_date = ?
       WHERE purchase_id = ?`,
      [supplier_id, fruit_id, quantity, purchase_date, req.params.id]
    );

    res.json({ message: 'Purchase updated successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/purchases/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM purchases WHERE purchase_id = ?', [req.params.id]);
    res.json({ message: 'Purchase deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// SALES
app.get('/api/sales', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT s.sale_id, s.vendor_id, s.fruit_id, s.quantity, s.sale_date,
             v.vendor_name, f.fruit_name,
             COALESCE(SUM(sd.quantity * sd.unit_price), 0) AS total,
             GROUP_CONCAT(
               CONCAT(sd.package_size, ':', sd.quantity, ':', sd.unit_price)
               SEPARATOR '|'
             ) AS details
      FROM sales s
      JOIN vendors v ON s.vendor_id = v.vendor_id
      JOIN fruits f ON s.fruit_id = f.fruit_id
      LEFT JOIN sales_details sd ON s.sale_id = sd.sale_id
      GROUP BY s.sale_id
      ORDER BY s.sale_date DESC, s.sale_id DESC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/sales', async (req, res) => {
  const connection = await db.getConnection();

  try {
    const {
      vendor_id, fruit_id, quantity, sale_date,
      package_size, unit_price
    } = req.body;

    if (
      !vendor_id || !fruit_id || Number(quantity) <= 0 ||
      !['Small', 'Medium', 'Large'].includes(package_size) ||
      Number(unit_price) <= 0
    ) {
      return res.status(400).json({ error: 'Enter valid sale details.' });
    }

    await connection.beginTransaction();

    const [sale] = await connection.query(
      `INSERT INTO sales (vendor_id, fruit_id, quantity, sale_date)
       VALUES (?, ?, ?, ?)`,
      [
        vendor_id, fruit_id, quantity,
        sale_date || new Date().toISOString().slice(0, 10)
      ]
    );

    await connection.query(
      `INSERT INTO sales_details
       (sale_id, package_size, quantity, unit_price)
       VALUES (?, ?, ?, ?)`,
      [sale.insertId, package_size, quantity, unit_price]
    );

    await connection.commit();

    res.status(201).json({ sale_id: sale.insertId });
  } catch (error) {
    await connection.rollback();
    res.status(400).json({ error: error.message });
  } finally {
    connection.release();
  }
});

app.put('/api/sales/:id', async (req, res) => {
  const connection = await db.getConnection();

  try {
    const {
      vendor_id, fruit_id, quantity, sale_date,
      package_size, unit_price
    } = req.body;

    await connection.beginTransaction();

    await connection.query(
      `UPDATE sales
       SET vendor_id = ?, fruit_id = ?, quantity = ?, sale_date = ?
       WHERE sale_id = ?`,
      [vendor_id, fruit_id, quantity, sale_date, req.params.id]
    );

    await connection.query(
      'DELETE FROM sales_details WHERE sale_id = ?',
      [req.params.id]
    );

    await connection.query(
      `INSERT INTO sales_details
       (sale_id, package_size, quantity, unit_price)
       VALUES (?, ?, ?, ?)`,
      [req.params.id, package_size, quantity, unit_price]
    );

    await connection.commit();
    res.json({ message: 'Sale updated successfully' });
  } catch (error) {
    await connection.rollback();
    res.status(400).json({ error: error.message });
  } finally {
    connection.release();
  }
});

app.delete('/api/sales/:id', async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [payments] = await connection.query(
      'SELECT payment_id FROM payments WHERE sale_id = ?',
      [req.params.id]
    );

    if (payments.length > 0) {
      await connection.rollback();
      return res.status(400).json({
        error: 'This sale has payments. Delete or resolve its payments first.'
      });
    }

    await connection.query(
      'DELETE FROM sales_details WHERE sale_id = ?',
      [req.params.id]
    );

    await connection.query(
      'DELETE FROM sales WHERE sale_id = ?',
      [req.params.id]
    );

    await connection.commit();
    res.json({ message: 'Sale deleted successfully' });
  } catch (error) {
    await connection.rollback();
    res.status(400).json({ error: error.message });
  } finally {
    connection.release();
  }
});

// STOCK
app.get('/api/stock', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT st.stock_id, st.fruit_id, f.fruit_name,
             st.package_size, st.quantity_available, st.last_updated
      FROM stock st
      JOIN fruits f ON st.fruit_id = f.fruit_id
      ORDER BY f.fruit_name, st.package_size
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/stock', async (req, res) => {
  try {
    const { fruit_id, package_size, quantity_available } = req.body;

    if (
      !fruit_id ||
      !['Small', 'Medium', 'Large'].includes(package_size) ||
      Number(quantity_available) < 0
    ) {
      return res.status(400).json({ error: 'Enter valid stock details.' });
    }

    const [existing] = await db.query(
      `SELECT stock_id FROM stock
       WHERE fruit_id = ? AND package_size = ?`,
      [fruit_id, package_size]
    );

    if (existing.length > 0) {
      await db.query(
        'UPDATE stock SET quantity_available = ? WHERE stock_id = ?',
        [quantity_available, existing[0].stock_id]
      );
      return res.json({ message: 'Stock quantity updated successfully' });
    }

    const [result] = await db.query(
      `INSERT INTO stock (fruit_id, package_size, quantity_available)
       VALUES (?, ?, ?)`,
      [fruit_id, package_size, quantity_available]
    );

    res.status(201).json({ stock_id: result.insertId });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/stock/:id', async (req, res) => {
  try {
    const { quantity_available } = req.body;

    if (Number(quantity_available) < 0) {
      return res.status(400).json({ error: 'Stock cannot be negative.' });
    }

    await db.query(
      'UPDATE stock SET quantity_available = ? WHERE stock_id = ?',
      [quantity_available, req.params.id]
    );

    res.json({ message: 'Stock updated successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/stock/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM stock WHERE stock_id = ?', [req.params.id]);
    res.json({ message: 'Stock record deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PAYMENTS
app.get('/api/payments', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.*, s.sale_date, v.vendor_name
      FROM payments p
      JOIN sales s ON p.sale_id = s.sale_id
      JOIN vendors v ON s.vendor_id = v.vendor_id
      ORDER BY p.payment_date DESC, p.payment_id DESC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/payments', async (req, res) => {
  try {
    const {
      sale_id, amount_paid, payment_method, payment_date, payment_status
    } = req.body;

    if (
      !sale_id || Number(amount_paid) <= 0 ||
      !['Cash', 'Mobile Money', 'Bank Transfer'].includes(payment_method) ||
      !['Paid', 'Pending'].includes(payment_status)
    ) {
      return res.status(400).json({ error: 'Enter valid payment details.' });
    }

    const [result] = await db.query(
      `INSERT INTO payments
       (sale_id, amount_paid, payment_method, payment_date, payment_status)
       VALUES (?, ?, ?, ?, ?)`,
      [
        sale_id, amount_paid, payment_method,
        payment_date || new Date().toISOString().slice(0, 10),
        payment_status
      ]
    );

    res.status(201).json({ payment_id: result.insertId });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/payments/:id', async (req, res) => {
  try {
    const { amount_paid, payment_method, payment_date, payment_status } = req.body;

    await db.query(
      `UPDATE payments SET
       amount_paid = ?, payment_method = ?,
       payment_date = ?, payment_status = ?
       WHERE payment_id = ?`,
      [amount_paid, payment_method, payment_date, payment_status, req.params.id]
    );

    res.json({ message: 'Payment updated successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/payments/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM payments WHERE payment_id = ?', [req.params.id]);
    res.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// REPORTS
app.get('/api/reports', async (req, res) => {
  try {
    const [[sales]] = await db.query(`
      SELECT COALESCE(SUM(quantity * unit_price), 0) AS total
      FROM sales_details
    `);

    const [[payments]] = await db.query(`
      SELECT COALESCE(SUM(amount_paid), 0) AS total
      FROM payments
      WHERE payment_status = 'Paid'
    `);

    const [[pending]] = await db.query(`
      SELECT COALESCE(SUM(amount_paid), 0) AS total
      FROM payments
      WHERE payment_status = 'Pending'
    `);

    const [[purchaseCount]] = await db.query(
      'SELECT COUNT(*) AS total FROM purchases'
    );

    const [[stock]] = await db.query(`
      SELECT COALESCE(SUM(quantity_available), 0) AS total
      FROM stock
    `);

    res.json({
      totalSales: Number(sales.total),
      paymentsReceived: Number(payments.total),
      pendingPayments: Number(pending.total),
      numberOfPurchases: purchaseCount.total,
      totalStock: stock.total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// START SERVER
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Batloung Farm backend running on port ${PORT}`);
});
