// User Guide — English. Per section: title, intro, legends (one list per screenshot, in marker order),
// tasks (title + steps), optional flow (diagram boxes) and tips. Keep it short and practical.
export default {
  ui: {
    title: 'User Guide',
    subtitle: 'Short, practical help for every screen.',
    language: 'Language',
    whatIsIt: 'What is this screen for?',
    howTo: 'How to',
    flow: 'How it flows',
    tips: 'Good to know',
    screenshotHint: 'Numbers on the picture match the list below it.',
  },
  gettingStarted: {
    title: 'Getting Started',
    intro: 'Sign in with your email and password. The left menu shows only the screens your role can open. Click the ? at the top of any screen to open its guide.',
    legends: [['Your email', 'Your password', 'Sign in']],
    tasks: [
      { title: 'Sign in', steps: ['Enter your email.', 'Enter your password.', 'Click Login.'] },
      { title: 'Change your password', steps: ['Click your initials at the top right.', 'Choose Change Password.', 'Enter your current and new password (at least 8 characters).'] },
    ],
    tips: ['Forgot your password? Ask your admin to reset it (Settings → Users & Roles).', 'You are signed out automatically after 12 hours without use.'],
  },
  dashboard: {
    title: 'Dashboard',
    intro: 'Your business at a glance for the chosen period: spending, sales, money received, profit, stock value and staff.',
    legends: [['Choose a board: Overview, Sales, Inventory, Expenses, Employees.', 'Change the period: today, this week, this month or custom dates.', 'Key numbers. The small line under each shows details such as dues.', 'Charts: daily sales, payment modes, top products and more.']],
    tasks: [{ title: "Check today's sales", steps: ['Open Dashboard.', 'Set the period to Today.', 'Read Sales Revenue and Received.'] }],
    tips: ['All numbers follow the selected period.', '"Due" means money still to be received (sales) or paid (purchases).'],
  },
  investment: {
    title: 'Investment (Purchases & Expenses)',
    intro: 'Record what you buy from vendors (Purchase) and what you spend on running the business (Overhead: rent, electricity). Payments and dues are tracked per invoice.',
    legends: [
      ['Investments and Vendors lists.', 'This month: total, purchase, overhead and due.', 'Add a new purchase or expense.', 'Payment status. "Partial" shows the amount still due.', 'Invoice: download, print or send.'],
      ['Type: Purchase (from a vendor) or Overhead (expense).', 'Vendor. You can add a new vendor right here.', 'Purchase date.', 'Items: type, name, quantity, unit, rate and MRP (selling price).', 'Add more items.', 'Amount you are paying now and the payment mode.', 'Save the investment.'],
    ],
    tasks: [
      { title: 'Add a purchase', steps: ['Investment → Add Investment.', 'Type = Purchase and choose the vendor (or add a new one).', 'Add the items. For a product, enter its MRP: this becomes the selling price of the new stock.', 'Enter the amount paid now (the rest stays as due).', 'Click Save Investment.'] },
      { title: 'Pay a due later', steps: ['Click the investment in the list.', 'Add a payment with date, mode and amount.'] },
    ],
    flow: ['Purchase (product item)', 'New stock batch (IL001)', 'Sold oldest batch first'],
    tips: ['Item type Product adds stock; Material and Overhead are only expenses.', 'Leave the invoice number empty and it is created automatically.'],
  },
  employees: {
    title: 'Employees',
    intro: 'Staff list, attendance, salary or piece-rate earnings, advances and payments.',
    legends: [
      ['Search by name, code or mobile.', 'Add Expense: advance or weekly spend for many employees at once.', 'Add a new employee.', 'Summary: staff count and payroll.', 'Click an employee to open the details.', 'Edit, or make active / inactive.'],
      ['Balances: advance, total earned, pending.', 'Tabs: Salary Payslip, Attendance, Transaction History.', 'Each month: days worked, leave, earned and due.', 'Pay the month.', 'Payslip: download, print or send.', 'Record an advance or a leave.', 'Salary overview of the current month.'],
    ],
    tasks: [
      { title: 'Add an employee', steps: ['Add Employee.', 'Enter name, mobile, email and joining date.', 'Choose the type: Monthly (fixed salary) or Piece Rate (paid per piece).'] },
      { title: 'Mark a leave', steps: ['Open the employee.', 'Click Record Leave (or use the Attendance tab).', 'Pick the date and Absent or Half day.'] },
      { title: 'Give an advance / pay salary', steps: ['Record Advance: amount and mode.', 'To pay a month: Salary Payslip tab → Pay.'] },
    ],
    flow: ['Piece-work entry', 'Employee earning', 'Payment or advance adjusted'],
    tips: ['Monthly salary is reduced for leave days; a fully paid month is locked.', 'Piece-rate earnings come from Piece Work entries.', 'No salary is counted while an employee is inactive.'],
  },
  pieceWork: {
    title: 'Piece Work',
    intro: 'Record the daily work of piece-rate employees. Their pay is calculated from it.',
    legends: [['Add a new piece-work entry.', 'Filters: date, employee.', 'Download a report.', 'Summary: today and total.', 'Work done: piece code × quantity.', 'Row menu: PDF, Excel, print, send, delete.']],
    tasks: [{ title: "Add today's work", steps: ['New Piece-Work Entry.', 'Choose the employee(s).', 'For each: piece code (work) and quantity; the rate fills in automatically.', 'Save.'] }],
    tips: ['Rates come from the product\'s piece codes (Products).', 'Amount = quantity × rate. Made a mistake? Delete the entry and add it again.'],
  },
  products: {
    title: 'Products',
    intro: 'Your product list with price, stock and source (Made, Purchased or Both).',
    legends: [['Search and sort.', 'Produce / Add Stock: stock you made yourself.', 'Add a new product.', 'Filter: All, Manufacture, Purchase, Archive.', 'Price of the oldest stock left. Hover to see the next prices.', 'Source and pieces in stock.', 'Product menu.']],
    tasks: [
      { title: 'Add a product', steps: ['Add Product.', 'Enter name, cost and selling price (and piece codes if you make it).', 'Save.'] },
      { title: 'Add stock you made', steps: ['Produce / Add Stock.', 'Choose product, quantity, making cost and selling price.', 'Save: a new stock batch is created.'] },
    ],
    tips: ['The oldest stock is always sold first (FIFO), so the card shows that stock\'s price.'],
  },
  inventory: {
    title: 'Inventory',
    intro: 'Stock of every product, and every batch (lot) with its cost, price and quantity left.',
    legends: [
      ['Total stock and its buying value.', 'Search a product.', 'Pieces in stock now.', 'Open the batches of a product.', 'Quick sale.'],
      ['Date range.', 'Product summary.', 'Active (in stock) or Sold batches.', 'Batch number, e.g. IL001.', 'Selling price of this batch.', 'Adjust: increase or decrease the stock.', 'Print QR labels.'],
    ],
    tasks: [{ title: 'Fix the stock count', steps: ['Open the product (eye icon).', 'Click Adjust on the batch.', 'Enter the increase or decrease and save.'] }],
    flow: ['New stock (purchase / made)', 'Batch IL001, IL002 …', 'Sale takes the oldest batch first'],
    tips: ['Each batch keeps its own cost and selling price, so profit stays correct.'],
  },
  sales: {
    title: 'Sales',
    intro: 'Make bills, take full, part or no payment (udhaar), and collect customer dues.',
    legends: [
      ['Customer mobile; known customers fill in automatically.', 'Scan a QR label.', 'Search and add a product.', 'Quantity.', 'Discount in ₹ or %.', 'Previous due: click to collect it without a new sale.', 'Amount received now ("Pay full" fills everything).', 'Payment mode.', 'Complete the sale.'],
      ['Totals. Click the due amount to see only unpaid bills.', 'Filters.', 'Download a report.', 'New sale.', 'Paid or Due.', 'Invoice: download, print or send.', 'Click a sale to see the details.'],
    ],
    tasks: [
      { title: 'Make a sale', steps: ['Sales → New Sale.', 'Enter the customer mobile and name.', 'Add products and quantities.', 'Enter the amount received and the payment mode.', 'Complete Sale.'] },
      { title: 'Collect an old due (no new sale)', steps: ['New Sale → enter the customer mobile.', 'Click the blinking Previous due.', 'Enter the amount and mode → Settle Due.'] },
    ],
    flow: ['Sale', 'Part paid / udhaar', 'Due', 'Settle (oldest bill first)'],
    tips: ['Money received clears this bill first, then older dues.', 'If a product has batches with different prices, you are asked to pick the batch.'],
  },
  revenue: {
    title: 'Revenue',
    intro: 'All money in and out in one place: sale receipts, purchase payments and employee payments.',
    legends: [['Tabs: All, Investment, Sales, Employee.', 'Totals: received, paid and net.', 'Filters: date, type, payment mode.', 'Which module the entry comes from.', 'Amount: + money in, − money out.']],
    tasks: [{ title: "See this month's cash flow", steps: ['Open Revenue.', 'Filters → This Month.'] }],
    tips: ['Nothing to enter here: every payment appears automatically.'],
  },
  settings: {
    title: 'Settings',
    intro: 'Company details, theme, language, menu order, and users with their permissions.',
    legends: [['Search a setting.', 'Theme colour.', 'Language: English or Hindi.', 'Company & Invoice: name, GST, currency, print on/off.', 'Order of the left menu.', 'Low-stock alert level.']],
    tasks: [
      { title: 'Add a staff user', steps: ['Users & Roles → Add User.', 'Enter email, name, password and role.', 'Save.'] },
      { title: 'Allow or stop a screen for staff', steps: ['Users & Roles.', 'Tick View / Write / Delete for each module.', 'Save.'] },
      { title: 'Show print buttons', steps: ['Company & Invoice → Show print options.', 'Save.'] },
    ],
    tips: ['Only admins can manage users.'],
  },
};
