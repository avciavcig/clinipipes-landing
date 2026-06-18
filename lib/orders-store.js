const fs = require('fs');
const path = require('path');

const ORDERS_DIR = path.join(__dirname, '..', 'orders');

function ensureDir() {
  if (!fs.existsSync(ORDERS_DIR)) fs.mkdirSync(ORDERS_DIR, { recursive: true });
}

function saveOrder(order) {
  ensureDir();
  const file = path.join(ORDERS_DIR, order.orderId + '.json');
  fs.writeFileSync(file, JSON.stringify(order, null, 2), 'utf8');
  return order;
}

function listOrders(limit) {
  ensureDir();
  let files = [];
  try { files = fs.readdirSync(ORDERS_DIR); } catch (e) { return []; }
  const orders = files
    .filter(function (f) { return f.endsWith('.json'); })
    .map(function (f) {
      try { return JSON.parse(fs.readFileSync(path.join(ORDERS_DIR, f), 'utf8')); }
      catch (e) { return null; }
    })
    .filter(Boolean);
  orders.sort(function (a, b) { return (b.createdAt || '').localeCompare(a.createdAt || ''); });
  return orders.slice(0, limit || 50);
}

module.exports = { saveOrder: saveOrder, listOrders: listOrders };
