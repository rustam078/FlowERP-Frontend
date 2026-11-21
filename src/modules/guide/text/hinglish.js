// User Guide — Hinglish (Roman script; same keys and order as en.js).
export default {
  ui: {
    title: 'User Guide',
    subtitle: 'Har screen ke liye chhoti aur kaam ki help.',
    language: 'Language',
    whatIsIt: 'Ye screen kis kaam ki hai?',
    howTo: 'Kaise karein',
    flow: 'Kaam kaise aage badhta hai',
    tips: 'Dhyan rakhein',
    screenshotHint: 'Photo par bane number neeche ki list se match karte hain.',
  },
  gettingStarted: {
    title: 'Shuruaat',
    intro: 'Apne email aur password se login karein. Left menu mein sirf wahi screens dikhti hain jinki aapko permission hai. Kisi bhi screen par upar ? dabakar uska guide kholein.',
    legends: [['Aapka email', 'Aapka password', 'Login karein']],
    tasks: [
      { title: 'Login karein', steps: ['Apna email likhein.', 'Apna password likhein.', 'Login dabayein.'] },
      { title: 'Password badlein', steps: ['Upar right mein apne naam ke letters par click karein.', 'Change Password chunein.', 'Purana aur naya password likhein (kam se kam 8 characters).'] },
    ],
    tips: ['Password bhool gaye? Admin se reset karwayein (Settings → Users & Roles).', '12 ghante use na karne par aap apne aap logout ho jaate hain.'],
  },
  dashboard: {
    title: 'Dashboard',
    intro: 'Chuni hui period mein business ki poori jhalak: kharcha, sale, mila hua paisa, profit, stock value aur staff.',
    legends: [['Board chunein: Overview, Sales, Inventory, Expenses, Employees.', 'Period badlein: aaj, is hafte, is mahine ya apni dates.', 'Main numbers. Har ek ke neeche chhoti line mein due jaisi details hain.', 'Charts: roz ki sale, payment mode, top products.']],
    tasks: [{ title: 'Aaj ki sale dekhein', steps: ['Dashboard kholein.', 'Period Today chunein.', 'Sales Revenue aur Received dekhein.'] }],
    tips: ['Saare numbers chuni hui period ke hisaab se hain.', '"Due" matlab jo paisa abhi milna (sale) ya dena (purchase) baaki hai.'],
  },
  investment: {
    title: 'Investment (Kharid aur Kharche)',
    intro: 'Vendor se kharida maal (Purchase) aur business chalane ka kharcha (Overhead: rent, bijli) yahan likhein. Har bill ka payment aur due alag dikhta hai.',
    legends: [
      ['Investments aur Vendors ki list.', 'Is mahine: total, purchase, overhead aur due.', 'Nayi purchase ya naya kharcha jodein.', 'Payment status. "Partial" mein baaki amount dikhta hai.', 'Bill: download, print ya send.'],
      ['Type: Purchase (vendor se) ya Overhead (kharcha).', 'Vendor. Naya vendor yahin add kar sakte hain.', 'Purchase ki date.', 'Items: type, naam, quantity, unit, rate aur MRP (bechne ki keemat).', 'Aur items jodein.', 'Abhi di jaane wali amount aur payment mode.', 'Save karein.'],
    ],
    tasks: [
      { title: 'Nayi purchase jodein', steps: ['Investment → Add Investment.', 'Type = Purchase aur vendor chunein (ya naya add karein).', 'Items jodein. Product ke liye MRP likhein: yahi naye stock ki bechne ki keemat banti hai.', 'Abhi di gayi amount likhein (baaki due rahega).', 'Save Investment dabayein.'] },
      { title: 'Baad mein due chukayein', steps: ['List mein us investment par click karein.', 'Date, mode aur amount ke saath payment jodein.'] },
    ],
    flow: ['Purchase (product item)', 'Naya stock batch (IL001)', 'Pehle purana batch bikta hai'],
    tips: ['Product item se stock badhta hai; Material aur Overhead sirf kharche hain.', 'Bill number khaali chhodein to apne aap ban jaata hai.'],
  },
  employees: {
    title: 'Employees',
    intro: 'Staff ki list, attendance, salary ya piece-rate ki kamai, advance aur payments.',
    legends: [
      ['Naam, code ya mobile se search karein.', 'Add Expense: kai employees ko ek saath advance ya hafte ka kharcha.', 'Naya employee jodein.', 'Summary: staff ki ginti aur payroll.', 'Details ke liye employee par click karein.', 'Edit karein, ya active / inactive karein.'],
      ['Balance: advance, kul kamai, baaki.', 'Tabs: Salary Payslip, Attendance, Transaction History.', 'Har mahina: kaam ke din, chhutti, kamai aur due.', 'Mahine ka payment karein.', 'Payslip: download, print ya send.', 'Advance ya chhutti record karein.', 'Is mahine ki salary ka summary.'],
    ],
    tasks: [
      { title: 'Naya employee jodein', steps: ['Add Employee dabayein.', 'Naam, mobile, email aur joining date likhein.', 'Type chunein: Monthly (fixed salary) ya Piece Rate (har piece ka paisa).'] },
      { title: 'Chhutti mark karein', steps: ['Employee kholein.', 'Record Leave dabayein (ya Attendance tab).', 'Date aur Absent ya Half day chunein.'] },
      { title: 'Advance dein / salary dein', steps: ['Record Advance: amount aur mode.', 'Mahine ka payment: Salary Payslip tab → Pay.'] },
    ],
    flow: ['Piece-work entry', 'Employee ki kamai', 'Payment ya advance adjust'],
    tips: ['Chhutti ke dinon ki salary katti hai; poora paid mahina lock ho jaata hai.', 'Piece-rate ki kamai Piece Work entries se banti hai.', 'Inactive rehne ke dinon ki salary nahi judti.'],
  },
  pieceWork: {
    title: 'Piece Work',
    intro: 'Piece-rate employees ka roz ka kaam likhein. Isi se unka paisa banta hai.',
    legends: [['Nayi piece-work entry jodein.', 'Filters: date, employee.', 'Report download karein.', 'Summary: aaj ka aur total.', 'Kiya gaya kaam: piece code × quantity.', 'Row menu: PDF, Excel, print, send, delete.']],
    tasks: [{ title: 'Aaj ka kaam jodein', steps: ['New Piece-Work Entry dabayein.', 'Employee chunein.', 'Har ek ke liye piece code (kaam) aur quantity; rate apne aap bharta hai.', 'Save karein.'] }],
    tips: ['Rate product ke piece code se aata hai (Products).', 'Amount = quantity × rate. Galti hui? Entry delete karke phir se jodein.'],
  },
  products: {
    title: 'Products',
    intro: 'Aapke products ki list: keemat, stock aur source (Made, Purchased ya Both).',
    legends: [['Search aur sort.', 'Produce / Add Stock: khud banaya stock jodein.', 'Naya product jodein.', 'Filter: All, Manufacture, Purchase, Archive.', 'Bache hue sabse purane stock ki keemat. Mouse le jaayein to aage ki keemtein dikhti hain.', 'Source aur stock mein pieces.', 'Product ka menu.']],
    tasks: [
      { title: 'Naya product jodein', steps: ['Add Product dabayein.', 'Naam, cost aur selling price likhein (banate hain to piece codes bhi).', 'Save karein.'] },
      { title: 'Khud banaya stock jodein', steps: ['Produce / Add Stock dabayein.', 'Product, quantity, banane ki cost aur selling price chunein.', 'Save karein: naya stock batch ban jaata hai.'] },
    ],
    tips: ['Hamesha sabse purana stock pehle bikta hai (FIFO), isliye card par usi ki keemat dikhti hai.'],
  },
  inventory: {
    title: 'Inventory',
    intro: 'Har product ka stock, aur har batch (lot) ki cost, keemat aur bachi quantity.',
    legends: [
      ['Kul stock aur uski buying value.', 'Product search karein.', 'Abhi stock mein pieces.', 'Product ke batches kholein.', 'Turant sale.'],
      ['Date range.', 'Product ka summary.', 'Active (stock mein) ya Sold batches.', 'Batch number, jaise IL001.', 'Is batch ki bechne ki keemat.', 'Adjust: stock badhayein ya ghatayein.', 'QR labels print karein.'],
    ],
    tasks: [{ title: 'Stock ki ginti sahi karein', steps: ['Product kholein (aankh wala icon).', 'Batch par Adjust dabayein.', 'Badhana ya ghatana likhein aur save karein.'] }],
    flow: ['Naya stock (purchase / banaya)', 'Batch IL001, IL002 …', 'Sale mein pehle purana batch'],
    tips: ['Har batch ki apni cost aur keemat hoti hai, isliye profit sahi rehta hai.'],
  },
  sales: {
    title: 'Sales',
    intro: 'Bill banayein, poora, aadha ya bina paisa (udhaar) lein, aur customer ka due vasool karein.',
    legends: [
      ['Customer ka mobile; purane customer apne aap bhar jaate hain.', 'QR label scan karein.', 'Product search karke jodein.', 'Quantity.', '₹ ya % mein discount.', 'Previous due: click karke bina nayi sale ke vasool karein.', 'Abhi mili amount ("Pay full" sab bhar deta hai).', 'Payment mode.', 'Sale complete karein.'],
      ['Total. Due amount par click karein to sirf baaki wale bills dikhenge.', 'Filters.', 'Report download karein.', 'Nayi sale.', 'Paid ya Due.', 'Bill: download, print ya send.', 'Details ke liye sale par click karein.'],
    ],
    tasks: [
      { title: 'Sale karein', steps: ['Sales → New Sale.', 'Customer ka mobile aur naam likhein.', 'Products aur quantity jodein.', 'Mili amount aur payment mode bharein.', 'Complete Sale dabayein.'] },
      { title: 'Purana due vasool karein (bina nayi sale)', steps: ['New Sale → customer ka mobile likhein.', 'Chamakte hue Previous due par click karein.', 'Amount aur mode bharein → Settle Due.'] },
    ],
    flow: ['Sale', 'Aadha payment / udhaar', 'Due', 'Vasooli (pehle purana bill)'],
    tips: ['Mili amount pehle isi bill mein, phir purane due mein jaati hai.', 'Kisi product ke batches ki keemat alag ho to batch chunne ko kaha jaata hai.'],
  },
  revenue: {
    title: 'Revenue',
    intro: 'Aane-jaane wala saara paisa ek jagah: sale ki amount, purchase ke payments aur employees ke payments.',
    legends: [['Tabs: All, Investment, Sales, Employee.', 'Total: mila, diya aur net.', 'Filters: date, type, payment mode.', 'Entry kis module se aayi.', 'Amount: + aaya paisa, − gaya paisa.']],
    tasks: [{ title: 'Is mahine ka cash flow dekhein', steps: ['Revenue kholein.', 'Filters → This Month.'] }],
    tips: ['Yahan kuch bharna nahi hai: har payment apne aap dikhta hai.'],
  },
  settings: {
    title: 'Settings',
    intro: 'Company ki details, theme, language, menu ka order, aur users va unki permissions.',
    legends: [['Setting search karein.', 'Theme ka rang.', 'Language: English ya Hindi.', 'Company & Invoice: naam, GST, currency, print on/off.', 'Left menu ka order.', 'Kam stock ki warning ka level.']],
    tasks: [
      { title: 'Staff user jodein', steps: ['Users & Roles → Add User.', 'Email, naam, password aur role bharein.', 'Save karein.'] },
      { title: 'Staff ke liye screen on/off karein', steps: ['Users & Roles kholein.', 'Har module ke liye View / Write / Delete tick karein.', 'Save karein.'] },
      { title: 'Print buttons dikhayein', steps: ['Company & Invoice → Show print options.', 'Save karein.'] },
    ],
    tips: ['Users sirf admin hi bana ya badal sakte hain.'],
  },
};
