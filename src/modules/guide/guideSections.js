// User Guide structure: which sections exist, who sees them, and the screenshots with marker
// positions (x / y in % of the image). The texts per language live in ./text/*.js under the same key.
// `module` = permission module the user must be able to view; 'always' = everyone.

export const GUIDE_SECTIONS = [
  {
    key: 'gettingStarted', module: 'always',
    shots: [{ src: '/guide/login.jpg', markers: [[79, 47], [79, 58], [80, 75]] }],
  },
  {
    key: 'dashboard', module: 'dashboard',
    shots: [{ src: '/guide/dashboard.jpg', markers: [[27, 15], [91, 15], [26, 24], [45, 64]] }],
  },
  {
    key: 'investment', module: 'investment',
    shots: [
      { src: '/guide/investment.jpg', markers: [[26, 16], [36, 29], [91, 25], [78, 57], [94, 57]] },
      { src: '/guide/investment-add.jpg', markers: [[27, 25], [42, 24], [56, 24], [30, 49], [25, 55], [76, 65], [76, 71]] },
    ],
    flow: true,
  },
  {
    key: 'employees', module: 'employees',
    shots: [
      { src: '/guide/employees.jpg', markers: [[67, 15], [84, 15], [94, 15], [70, 28], [29, 59], [94, 54]] },
      { src: '/guide/employee-details.jpg', markers: [[27, 47], [32, 60], [42, 68], [60, 72], [65, 72], [85, 64], [85, 77]] },
    ],
    flow: true,
  },
  {
    key: 'pieceWork', module: 'production',
    shots: [{ src: '/guide/piecework.jpg', markers: [[91, 15], [69, 15], [78, 15], [60, 28], [55, 43], [94, 43]] }],
  },
  {
    key: 'products', module: 'products',
    shots: [{ src: '/guide/products.jpg', markers: [[54, 15], [82, 15], [93, 15], [30, 22], [61, 52], [65, 55], [70, 32]] }],
  },
  {
    key: 'inventory', module: 'inventory',
    shots: [
      { src: '/guide/inventory.jpg', markers: [[36, 21], [85, 29], [52, 42], [90, 42], [95, 15]] },
      { src: '/guide/inventory-batches.jpg', markers: [[77, 15], [57, 32], [29, 55], [24, 70], [64, 70], [85, 70], [92, 70]] },
    ],
    flow: true,
  },
  {
    key: 'sales', module: 'sales',
    shots: [
      { src: '/guide/sales-new.jpg', markers: [[33, 15], [44, 31], [46, 37], [42, 49], [81, 43], [95, 51], [93, 59], [85, 71], [85, 78]] },
      { src: '/guide/sales-list.jpg', markers: [[56, 15], [75, 15], [83, 15], [93, 15], [78, 40], [91, 33], [25, 33]] },
    ],
    flow: true,
  },
  {
    key: 'revenue', module: 'revenue',
    shots: [{ src: '/guide/revenue.jpg', markers: [[35, 20], [72, 20], [93, 20], [34, 36], [92, 36]] }],
  },
  {
    key: 'settings', module: 'settings',
    shots: [{ src: '/guide/settings.jpg', markers: [[36, 19], [30, 27], [27, 37], [29, 46], [27, 56], [30, 86]] }],
  },
];

// Screen path → guide section (the "?" button in the top bar opens the guide of the current screen).
export const sectionForPath = (pathname) => {
  const seg = pathname.replace(/^\/+/, '').split('/')[0];
  const map = {
    dashboard: 'dashboard', investment: 'investment', vendors: 'investment', employees: 'employees',
    production: 'pieceWork', 'production-history': 'pieceWork', products: 'products', inventory: 'inventory',
    sales: 'sales', print: 'sales', revenue: 'revenue', settings: 'settings',
  };
  return map[seg] || 'gettingStarted';
};
