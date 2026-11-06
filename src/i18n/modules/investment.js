// Investment module static-text dictionary. Auto-merged by translations.js.
// Keys are namespaced investment.* ; keep English values exactly as the UI reads.
export default {
  en: {
    // Enum options (type / item type / unit)
    'investment.typeOption.PURCHASE': 'Purchase',
    'investment.typeOption.OVERHEAD': 'Overhead',
    'investment.itemTypeOption.MATERIAL': 'Material',
    'investment.itemTypeOption.PRODUCT': 'Product',
    'investment.unit.NOS': 'Nos',
    'investment.unit.PIECE': 'Piece',
    'investment.unit.METER': 'Meter',
    'investment.unit.KG': 'Kilogram',
    'investment.unit.ROLL': 'Roll',
    'investment.unit.GRAM': 'Gram',
    'investment.unit.BUNDLE': 'Bundle',
    'investment.unit.LITER': 'Liter',
    'investment.unit.BOX': 'Box',
    'investment.unit.DOZEN': 'Dozen',
    'investment.unit.PACKET': 'Packet',
    'investment.unit.PAIR': 'Pair',

    // Status pills
    'investment.active': 'Active',
    'investment.inactive': 'Inactive',
    'investment.status.paid': 'Paid',
    'investment.status.partial': 'Partial',
    'investment.status.unpaid': 'Unpaid',

    // Tabs
    'investment.tab.investments': 'Investments',
    'investment.tab.vendors': 'Vendors',

    // Investment tab header + inline summary
    'investment.title': 'Investment',
    'investment.headingInfo': 'Manage raw material purchases, purchased products and business expenses.',
    'investment.summary.currentMonth': 'Current Month:',
    'investment.summary.total': 'Total:',
    'investment.summary.purchase': 'Purchase:',
    'investment.summary.overhead': 'Overhead:',
    'investment.summary.due': 'Due:',
    'investment.dueFilterOn': 'Showing only records with a pending due — click to clear',
    'investment.dueFilterOff': 'Click to show only records with a pending due',

    // Filter popover
    'investment.filter.dateFrom': 'Date From',
    'investment.filter.dateTo': 'Date To',
    'investment.filter.vendor': 'Vendor',
    'investment.filter.allVendors': 'All Vendors',
    'investment.filter.investmentType': 'Investment Type',
    'investment.filter.allTypes': 'All Types',
    'investment.filter.paymentStatus': 'Payment Status',
    'investment.filter.allPayments': 'All Payments',
    'investment.filter.searchPlaceholder': 'Invoice number …',

    // Primary buttons
    'investment.addInvestment': 'Add Investment',
    'investment.addVendor': 'Add Vendor',

    // Investment table columns
    'investment.col.invoiceNo': 'Invoice No',
    'investment.col.vendor': 'Vendor',
    'investment.col.type': 'Type',
    'investment.col.purchaseDate': 'Purchase Date',
    'investment.col.items': 'Items',
    'investment.col.grandTotal': 'Grand Total',
    'investment.col.amountReceived': 'Amount Received',
    'investment.col.payment': 'Payment',
    'investment.col.action': 'Action',
    'investment.duePrefix': 'Due',

    // Action tooltips
    'investment.tooltip.downloadInvoice': 'Download Invoice PDF',
    'investment.tooltip.printInvoice': 'Print Invoice',
    'investment.tooltip.editVendor': 'Edit Vendor',
    'investment.tooltip.deactivate': 'Deactivate',
    'investment.tooltip.activate': 'Activate',

    // Vendor table columns
    'investment.vendorCol.name': 'Vendor Name',
    'investment.vendorCol.gstNumber': 'GST Number',
    'investment.vendorCol.phone': 'Phone',
    'investment.vendorCol.email': 'Email',
    'investment.vendorCol.notProvided': 'Not Provided',

    // Purchase item rows
    'investment.itemCol.sno': 'S.No',
    'investment.itemCol.itemType': 'Item Type',
    'investment.itemCol.itemName': 'Item Name',
    'investment.itemCol.itemNamePlaceholder': 'Item name',
    'investment.itemCol.qty': 'Qty',
    'investment.itemCol.unit': 'Unit',
    'investment.itemCol.rate': 'Rate',
    'investment.itemCol.mrp': 'MRP',
    'investment.itemCol.mrpTooltip': 'Selling price (MRP) for this stock — required for every product.',

    // Overhead rows
    'investment.overheadCol.expenseName': 'Expense Name',
    'investment.overheadCol.expenseNamePlaceholder': 'Expense name',

    // Drawer item table
    'investment.drawerCol.item': 'Item',
    'investment.drawerCol.qty': 'Qty',
    'investment.drawerCol.unit': 'Unit',
    'investment.drawerCol.rate': 'Rate',

    // Vendor recent investments columns
    'investment.recentCol.reference': 'Reference',

    // Pagination
    'investment.pagination.showing': 'Showing',
    'investment.pagination.to': 'to',
    'investment.pagination.of': 'of',
    'investment.pagination.entries': 'entries',

    // Empty states
    'investment.empty.noInvestmentsTitle': 'No Investments Found',
    'investment.empty.noInvestmentsDesc': 'Click "Add Investment" to record your first investment.',
    'investment.empty.noVendorsTitle': 'No Vendors Found',
    'investment.empty.noVendorsDesc': 'Click "Add Vendor" to register your first vendor.',
    'investment.empty.noItems': 'No items',
    'investment.empty.noDetails': 'No details available',
    'investment.empty.noPayments': 'No payments recorded yet.',

    // Vendor tab header
    'investment.vendorMgmt': 'Vendor Management',
    'investment.vendorMgmtInfo': 'Manage suppliers and vendor information.',
    'investment.vendorSummary.total': 'Total:',
    'investment.vendorSummary.active': 'Active:',
    'investment.vendorSummary.inactive': 'Inactive:',
    'investment.vendorSearchPlaceholder': 'Search by name, GST, phone, email…',

    // View drawer
    'investment.drawer.title': 'Investment Details',
    'investment.drawer.invoicePdf': 'Invoice PDF',
    'investment.drawer.invoiceNumber': 'Invoice Number',
    'investment.drawer.vendor': 'Vendor',
    'investment.drawer.purchaseDate': 'Purchase Date',
    'investment.drawer.type': 'Type',
    'investment.drawer.remarks': 'Remarks',
    'investment.drawer.items': 'Items',
    'investment.drawer.summary': 'Summary',
    'investment.drawer.subtotal': 'Subtotal',
    'investment.drawer.gst': 'GST',
    'investment.drawer.discount': 'Discount',
    'investment.drawer.grandTotal': 'Grand Total',
    'investment.drawer.payments': 'Payments',
    'investment.drawer.paid': 'Paid',
    'investment.drawer.due': 'Due',
    'investment.drawer.referencePlaceholder': 'Reference / txn id (optional)',
    'investment.drawer.paymentDatePlaceholder': 'Payment date',
    'investment.drawer.paymentHistory': 'Payment History',
    'investment.drawer.ref': 'Ref:',
    'investment.drawer.thisInvoice': 'This invoice',
    'investment.drawer.previousDueSuffix': '(previous due)',
    'investment.drawer.clearedVia': 'Cleared via payment on',

    // Payment modes
    'investment.mode.cash': 'Cash',
    'investment.mode.upi': 'UPI',
    'investment.mode.creditCard': 'Credit Card',
    'investment.mode.debitCard': 'Debit Card',
    'investment.mode.netBanking': 'Net Banking',

    // Add Investment full page
    'investment.addNewInvestment': 'Add New Investment',
    'investment.form.investmentType': 'Investment Type',
    'investment.form.selectType': 'Select Type',
    'investment.form.typeRequired': 'Please select a type.',
    'investment.form.vendor': 'Vendor',
    'investment.form.vendorRequired': 'Please select a vendor.',
    'investment.form.selectVendor': 'Select or search vendor',
    'investment.form.newVendor': 'new vendor',
    'investment.form.purchaseDate': 'Purchase Date',
    'investment.form.dateRequired': 'Please select a date.',
    'investment.form.invoiceNumber': 'Invoice Number',
    'investment.form.invoiceAuto': 'Auto Generated if left blank',
    'investment.form.gstPercent': 'GST %',
    'investment.form.discount': 'Discount',

    // Inline vendor quick-add
    'investment.quickVendor.title': 'Add new vendor',
    'investment.quickVendor.name': 'Name',
    'investment.quickVendor.namePlaceholder': 'Vendor name',
    'investment.quickVendor.phone': 'Phone',
    'investment.quickVendor.phonePlaceholder': '10-digit phone number',
    'investment.quickVendor.addSelect': 'Add & select',

    // Items section
    'investment.expenseItems': 'Expense Items',
    'investment.purchaseItems': 'Purchase Items',
    'investment.expense': 'Expense',
    'investment.item': 'Item',
    'investment.invoice': 'Invoice',

    // Bill summary + payment card
    'investment.bill.subtotal': 'Subtotal',
    'investment.bill.gst': 'GST',
    'investment.bill.discount': 'Discount',
    'investment.bill.grandTotal': 'Grand Total',
    'investment.bill.payment': 'Payment',
    'investment.bill.previousDues': 'Previous dues',
    'investment.bill.previousDuesOldest': 'Previous dues · oldest first',
    'investment.bill.cleared': 'cleared',
    'investment.bill.partial': 'partial',
    'investment.bill.pending': 'pending',
    'investment.bill.totalOverdue': 'Total overdue',
    'investment.bill.thisInvoice': 'This invoice',
    'investment.bill.previousOverdue': 'Previous overdue',
    'investment.bill.totalOutstanding': 'Total outstanding',
    'investment.bill.amountPayingNow': 'Amount paying now',
    'investment.bill.paymentRefPlaceholder': 'Payment reference / txn id (optional)',

    // Action buttons
    'investment.saveInvestment': 'Save Investment',

    // Payment confirmation dialog
    'investment.confirm.title': 'Confirm Investment',
    'investment.confirm.confirmText': 'Confirm & Save',
    'investment.confirm.paymentMode': 'Payment Mode',
    'investment.confirm.currentBill': 'Current Bill',
    'investment.confirm.previousDues': 'Previous Dues',
    'investment.confirm.amountPaid': 'Amount Paid',

    // Add / edit vendor modal
    'investment.vendorModal.editTitle': 'Edit Vendor',
    'investment.vendorModal.addTitle': 'Add New Vendor',
    'investment.vendorModal.name': 'Vendor Name',
    'investment.vendorModal.nameRequired': 'Vendor name is required.',
    'investment.vendorModal.namePlaceholder': 'Enter vendor name',
    'investment.vendorModal.phone': 'Phone',
    'investment.vendorModal.phoneRequired': 'Phone is required.',
    'investment.vendorModal.phoneInvalid': 'Enter a valid 10-digit number',
    'investment.vendorModal.phonePlaceholder': 'Enter phone number',
    'investment.vendorModal.gstNumber': 'GST Number',
    'investment.vendorModal.gstPlaceholder': 'Enter GST number',
    'investment.vendorModal.email': 'Email',
    'investment.vendorModal.emailInvalid': 'Please enter a valid email.',
    'investment.vendorModal.emailPlaceholder': 'Enter email address',
    'investment.vendorModal.address': 'Address',
    'investment.vendorModal.addressRequired': 'Address is required.',
    'investment.vendorModal.addressPlaceholder': 'Enter full address',
    'investment.vendorModal.updateVendor': 'Update Vendor',
    'investment.vendorModal.saveVendor': 'Save Vendor',

    // Toasts / notifications
    'investment.toast.paymentRecorded': 'Payment Recorded',
    'investment.toast.paymentFailed': 'Payment Failed',
    'investment.toast.enterValidPayment': 'Enter a valid payment amount',
    'investment.toast.investmentSaved': 'Investment Saved',
    'investment.toast.investmentSavedDesc': 'Investment created successfully.',
    'investment.toast.saveFailed': 'Save Failed',
    'investment.toast.vendorSaved': 'Vendor Saved',
    'investment.toast.vendorSavedDesc': 'Vendor created successfully.',
    'investment.toast.vendorUpdated': 'Vendor Updated',
    'investment.toast.vendorUpdatedDesc': 'Vendor updated successfully.',
    'investment.toast.updateFailed': 'Update Failed',
    'investment.toast.statusUpdated': 'Status Updated',
    'investment.toast.statusUpdatedDesc': 'Vendor status updated.',
    'investment.toast.invoiceDownloadFailed': 'Invoice download failed',
    'investment.toast.invoiceDownloadFailedDesc': 'Could not generate the invoice PDF.',
    'investment.toast.invoicePrintFailed': 'Invoice print failed',
    'investment.toast.mrpRequired': 'Selling price (MRP) is required for every product item.',
    'investment.toast.checkDetails': 'Check details',
    'investment.toast.vendorAdded': 'Vendor added',
    'investment.toast.addedAndSelected': 'added and selected.',
    'investment.toast.failed': 'Failed',
    'investment.quickVendorError.required': 'Vendor name and phone are required.',
    'investment.quickVendorError.invalidPhone': 'Enter a valid 10-digit phone number.',
    'investment.quickVendorError.duplicate': 'A vendor with this phone number already exists.',
  },
  hi: {
    // Enum options (type / item type / unit)
    'investment.typeOption.PURCHASE': 'खरीद',
    'investment.typeOption.OVERHEAD': 'ओवरहेड',
    'investment.itemTypeOption.MATERIAL': 'सामग्री',
    'investment.itemTypeOption.PRODUCT': 'उत्पाद',
    'investment.unit.NOS': 'नग',
    'investment.unit.PIECE': 'पीस',
    'investment.unit.METER': 'मीटर',
    'investment.unit.KG': 'किलोग्राम',
    'investment.unit.ROLL': 'रोल',
    'investment.unit.GRAM': 'ग्राम',
    'investment.unit.BUNDLE': 'बंडल',
    'investment.unit.LITER': 'लीटर',
    'investment.unit.BOX': 'बॉक्स',
    'investment.unit.DOZEN': 'दर्जन',
    'investment.unit.PACKET': 'पैकेट',
    'investment.unit.PAIR': 'जोड़ी',

    // Status pills
    'investment.active': 'सक्रिय',
    'investment.inactive': 'निष्क्रिय',
    'investment.status.paid': 'भुगतान किया',
    'investment.status.partial': 'आंशिक',
    'investment.status.unpaid': 'अवैतनिक',

    // Tabs
    'investment.tab.investments': 'निवेश',
    'investment.tab.vendors': 'विक्रेता',

    // Investment tab header + inline summary
    'investment.title': 'निवेश',
    'investment.headingInfo': 'कच्चे माल की खरीद, खरीदे गए उत्पाद और व्यावसायिक खर्चों का प्रबंधन करें।',
    'investment.summary.currentMonth': 'इस माह:',
    'investment.summary.total': 'कुल:',
    'investment.summary.purchase': 'खरीद:',
    'investment.summary.overhead': 'ओवरहेड:',
    'investment.summary.due': 'बकाया:',
    'investment.dueFilterOn': 'केवल बकाया वाले रिकॉर्ड दिखाए जा रहे हैं — हटाने के लिए क्लिक करें',
    'investment.dueFilterOff': 'केवल बकाया वाले रिकॉर्ड दिखाने के लिए क्लिक करें',

    // Filter popover
    'investment.filter.dateFrom': 'आरंभ तिथि',
    'investment.filter.dateTo': 'अंतिम तिथि',
    'investment.filter.vendor': 'विक्रेता',
    'investment.filter.allVendors': 'सभी विक्रेता',
    'investment.filter.investmentType': 'निवेश प्रकार',
    'investment.filter.allTypes': 'सभी प्रकार',
    'investment.filter.paymentStatus': 'भुगतान स्थिति',
    'investment.filter.allPayments': 'सभी भुगतान',
    'investment.filter.searchPlaceholder': 'चालान नंबर …',

    // Primary buttons
    'investment.addInvestment': 'निवेश जोड़ें',
    'investment.addVendor': 'विक्रेता जोड़ें',

    // Investment table columns
    'investment.col.invoiceNo': 'चालान नंबर',
    'investment.col.vendor': 'विक्रेता',
    'investment.col.type': 'प्रकार',
    'investment.col.purchaseDate': 'खरीद तिथि',
    'investment.col.items': 'आइटम',
    'investment.col.grandTotal': 'कुल योग',
    'investment.col.amountReceived': 'प्राप्त राशि',
    'investment.col.payment': 'भुगतान',
    'investment.col.action': 'कार्रवाई',
    'investment.duePrefix': 'बकाया',

    // Action tooltips
    'investment.tooltip.downloadInvoice': 'चालान पीडीएफ डाउनलोड करें',
    'investment.tooltip.printInvoice': 'चालान प्रिंट करें',
    'investment.tooltip.editVendor': 'विक्रेता संपादित करें',
    'investment.tooltip.deactivate': 'निष्क्रिय करें',
    'investment.tooltip.activate': 'सक्रिय करें',

    // Vendor table columns
    'investment.vendorCol.name': 'विक्रेता नाम',
    'investment.vendorCol.gstNumber': 'जीएसटी नंबर',
    'investment.vendorCol.phone': 'फ़ोन',
    'investment.vendorCol.email': 'ईमेल',
    'investment.vendorCol.notProvided': 'उपलब्ध नहीं',

    // Purchase item rows
    'investment.itemCol.sno': 'क्र.सं.',
    'investment.itemCol.itemType': 'आइटम प्रकार',
    'investment.itemCol.itemName': 'आइटम नाम',
    'investment.itemCol.itemNamePlaceholder': 'आइटम नाम',
    'investment.itemCol.qty': 'मात्रा',
    'investment.itemCol.unit': 'इकाई',
    'investment.itemCol.rate': 'दर',
    'investment.itemCol.mrp': 'एमआरपी',
    'investment.itemCol.mrpTooltip': 'इस स्टॉक के लिए विक्रय मूल्य (एमआरपी) — हर उत्पाद के लिए आवश्यक।',

    // Overhead rows
    'investment.overheadCol.expenseName': 'खर्च नाम',
    'investment.overheadCol.expenseNamePlaceholder': 'खर्च नाम',

    // Drawer item table
    'investment.drawerCol.item': 'आइटम',
    'investment.drawerCol.qty': 'मात्रा',
    'investment.drawerCol.unit': 'इकाई',
    'investment.drawerCol.rate': 'दर',

    // Vendor recent investments columns
    'investment.recentCol.reference': 'संदर्भ',

    // Pagination
    'investment.pagination.showing': 'दिखा रहे हैं',
    'investment.pagination.to': 'से',
    'investment.pagination.of': 'में से',
    'investment.pagination.entries': 'प्रविष्टियाँ',

    // Empty states
    'investment.empty.noInvestmentsTitle': 'कोई निवेश नहीं मिला',
    'investment.empty.noInvestmentsDesc': 'अपना पहला निवेश दर्ज करने के लिए "निवेश जोड़ें" पर क्लिक करें।',
    'investment.empty.noVendorsTitle': 'कोई विक्रेता नहीं मिला',
    'investment.empty.noVendorsDesc': 'अपना पहला विक्रेता पंजीकृत करने के लिए "विक्रेता जोड़ें" पर क्लिक करें।',
    'investment.empty.noItems': 'कोई आइटम नहीं',
    'investment.empty.noDetails': 'कोई विवरण उपलब्ध नहीं',
    'investment.empty.noPayments': 'अभी तक कोई भुगतान दर्ज नहीं किया गया।',

    // Vendor tab header
    'investment.vendorMgmt': 'विक्रेता प्रबंधन',
    'investment.vendorMgmtInfo': 'आपूर्तिकर्ताओं और विक्रेता जानकारी का प्रबंधन करें।',
    'investment.vendorSummary.total': 'कुल:',
    'investment.vendorSummary.active': 'सक्रिय:',
    'investment.vendorSummary.inactive': 'निष्क्रिय:',
    'investment.vendorSearchPlaceholder': 'नाम, जीएसटी, फ़ोन, ईमेल से खोजें…',

    // View drawer
    'investment.drawer.title': 'निवेश विवरण',
    'investment.drawer.invoicePdf': 'चालान पीडीएफ',
    'investment.drawer.invoiceNumber': 'चालान नंबर',
    'investment.drawer.vendor': 'विक्रेता',
    'investment.drawer.purchaseDate': 'खरीद तिथि',
    'investment.drawer.type': 'प्रकार',
    'investment.drawer.remarks': 'टिप्पणियाँ',
    'investment.drawer.items': 'आइटम',
    'investment.drawer.summary': 'सारांश',
    'investment.drawer.subtotal': 'उप-योग',
    'investment.drawer.gst': 'जीएसटी',
    'investment.drawer.discount': 'छूट',
    'investment.drawer.grandTotal': 'कुल योग',
    'investment.drawer.payments': 'भुगतान',
    'investment.drawer.paid': 'भुगतान किया',
    'investment.drawer.due': 'बकाया',
    'investment.drawer.referencePlaceholder': 'संदर्भ / लेनदेन आईडी (वैकल्पिक)',
    'investment.drawer.paymentDatePlaceholder': 'भुगतान तिथि',
    'investment.drawer.paymentHistory': 'भुगतान इतिहास',
    'investment.drawer.ref': 'संदर्भ:',
    'investment.drawer.thisInvoice': 'यह चालान',
    'investment.drawer.previousDueSuffix': '(पिछला बकाया)',
    'investment.drawer.clearedVia': 'भुगतान द्वारा समाशोधित, तिथि',

    // Payment modes
    'investment.mode.cash': 'नकद',
    'investment.mode.upi': 'यूपीआई',
    'investment.mode.creditCard': 'क्रेडिट कार्ड',
    'investment.mode.debitCard': 'डेबिट कार्ड',
    'investment.mode.netBanking': 'नेट बैंकिंग',

    // Add Investment full page
    'investment.addNewInvestment': 'नया निवेश जोड़ें',
    'investment.form.investmentType': 'निवेश प्रकार',
    'investment.form.selectType': 'प्रकार चुनें',
    'investment.form.typeRequired': 'कृपया एक प्रकार चुनें।',
    'investment.form.vendor': 'विक्रेता',
    'investment.form.vendorRequired': 'कृपया एक विक्रेता चुनें।',
    'investment.form.selectVendor': 'विक्रेता चुनें या खोजें',
    'investment.form.newVendor': 'नया विक्रेता',
    'investment.form.purchaseDate': 'खरीद तिथि',
    'investment.form.dateRequired': 'कृपया एक तिथि चुनें।',
    'investment.form.invoiceNumber': 'चालान नंबर',
    'investment.form.invoiceAuto': 'खाली छोड़ने पर स्वतः उत्पन्न',
    'investment.form.gstPercent': 'जीएसटी %',
    'investment.form.discount': 'छूट',

    // Inline vendor quick-add
    'investment.quickVendor.title': 'नया विक्रेता जोड़ें',
    'investment.quickVendor.name': 'नाम',
    'investment.quickVendor.namePlaceholder': 'विक्रेता नाम',
    'investment.quickVendor.phone': 'फ़ोन',
    'investment.quickVendor.phonePlaceholder': '10-अंकों का फ़ोन नंबर',
    'investment.quickVendor.addSelect': 'जोड़ें और चुनें',

    // Items section
    'investment.expenseItems': 'खर्च आइटम',
    'investment.purchaseItems': 'खरीद आइटम',
    'investment.expense': 'खर्च',
    'investment.item': 'आइटम',
    'investment.invoice': 'चालान',

    // Bill summary + payment card
    'investment.bill.subtotal': 'उप-योग',
    'investment.bill.gst': 'जीएसटी',
    'investment.bill.discount': 'छूट',
    'investment.bill.grandTotal': 'कुल योग',
    'investment.bill.payment': 'भुगतान',
    'investment.bill.previousDues': 'पिछला बकाया',
    'investment.bill.previousDuesOldest': 'पिछला बकाया · सबसे पुराना पहले',
    'investment.bill.cleared': 'समाशोधित',
    'investment.bill.partial': 'आंशिक',
    'investment.bill.pending': 'लंबित',
    'investment.bill.totalOverdue': 'कुल अतिदेय',
    'investment.bill.thisInvoice': 'यह चालान',
    'investment.bill.previousOverdue': 'पिछला अतिदेय',
    'investment.bill.totalOutstanding': 'कुल बकाया',
    'investment.bill.amountPayingNow': 'अभी भुगतान की जा रही राशि',
    'investment.bill.paymentRefPlaceholder': 'भुगतान संदर्भ / लेनदेन आईडी (वैकल्पिक)',

    // Action buttons
    'investment.saveInvestment': 'निवेश सहेजें',

    // Payment confirmation dialog
    'investment.confirm.title': 'निवेश की पुष्टि करें',
    'investment.confirm.confirmText': 'पुष्टि करें और सहेजें',
    'investment.confirm.paymentMode': 'भुगतान मोड',
    'investment.confirm.currentBill': 'वर्तमान बिल',
    'investment.confirm.previousDues': 'पिछला बकाया',
    'investment.confirm.amountPaid': 'भुगतान की गई राशि',

    // Add / edit vendor modal
    'investment.vendorModal.editTitle': 'विक्रेता संपादित करें',
    'investment.vendorModal.addTitle': 'नया विक्रेता जोड़ें',
    'investment.vendorModal.name': 'विक्रेता नाम',
    'investment.vendorModal.nameRequired': 'विक्रेता नाम आवश्यक है।',
    'investment.vendorModal.namePlaceholder': 'विक्रेता नाम दर्ज करें',
    'investment.vendorModal.phone': 'फ़ोन',
    'investment.vendorModal.phoneRequired': 'फ़ोन आवश्यक है।',
    'investment.vendorModal.phoneInvalid': 'एक वैध 10-अंकों का नंबर दर्ज करें',
    'investment.vendorModal.phonePlaceholder': 'फ़ोन नंबर दर्ज करें',
    'investment.vendorModal.gstNumber': 'जीएसटी नंबर',
    'investment.vendorModal.gstPlaceholder': 'जीएसटी नंबर दर्ज करें',
    'investment.vendorModal.email': 'ईमेल',
    'investment.vendorModal.emailInvalid': 'कृपया एक वैध ईमेल दर्ज करें।',
    'investment.vendorModal.emailPlaceholder': 'ईमेल पता दर्ज करें',
    'investment.vendorModal.address': 'पता',
    'investment.vendorModal.addressRequired': 'पता आवश्यक है।',
    'investment.vendorModal.addressPlaceholder': 'पूरा पता दर्ज करें',
    'investment.vendorModal.updateVendor': 'विक्रेता अपडेट करें',
    'investment.vendorModal.saveVendor': 'विक्रेता सहेजें',

    // Toasts / notifications
    'investment.toast.paymentRecorded': 'भुगतान दर्ज किया गया',
    'investment.toast.paymentFailed': 'भुगतान विफल',
    'investment.toast.enterValidPayment': 'एक वैध भुगतान राशि दर्ज करें',
    'investment.toast.investmentSaved': 'निवेश सहेजा गया',
    'investment.toast.investmentSavedDesc': 'निवेश सफलतापूर्वक बनाया गया।',
    'investment.toast.saveFailed': 'सहेजना विफल',
    'investment.toast.vendorSaved': 'विक्रेता सहेजा गया',
    'investment.toast.vendorSavedDesc': 'विक्रेता सफलतापूर्वक बनाया गया।',
    'investment.toast.vendorUpdated': 'विक्रेता अपडेट किया गया',
    'investment.toast.vendorUpdatedDesc': 'विक्रेता सफलतापूर्वक अपडेट किया गया।',
    'investment.toast.updateFailed': 'अपडेट विफल',
    'investment.toast.statusUpdated': 'स्थिति अपडेट की गई',
    'investment.toast.statusUpdatedDesc': 'विक्रेता स्थिति अपडेट की गई।',
    'investment.toast.invoiceDownloadFailed': 'चालान डाउनलोड विफल',
    'investment.toast.invoiceDownloadFailedDesc': 'चालान पीडीएफ उत्पन्न नहीं किया जा सका।',
    'investment.toast.invoicePrintFailed': 'चालान प्रिंट विफल',
    'investment.toast.mrpRequired': 'प्रत्येक उत्पाद आइटम के लिए विक्रय मूल्य (एमआरपी) आवश्यक है।',
    'investment.toast.checkDetails': 'विवरण जांचें',
    'investment.toast.vendorAdded': 'विक्रेता जोड़ा गया',
    'investment.toast.addedAndSelected': 'जोड़ा और चुना गया।',
    'investment.toast.failed': 'विफल',
    'investment.quickVendorError.required': 'विक्रेता नाम और फ़ोन आवश्यक हैं।',
    'investment.quickVendorError.invalidPhone': 'एक वैध 10-अंकों का फ़ोन नंबर दर्ज करें।',
    'investment.quickVendorError.duplicate': 'इस फ़ोन नंबर वाला विक्रेता पहले से मौजूद है।',
  },
};
