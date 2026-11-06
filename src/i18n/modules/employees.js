// Employees module translations (English + Hindi). Auto-merged by translations.js.
export default {
  en: {
    // Shared / general
    'employees.pageTitle': 'Employee Management',
    'employees.pageInfo': 'Manage garment production workers and employee records.',
    'employees.searchPlaceholder': 'Search by name, code or mobile number',
    'employees.addBtn': 'Add Employee',
    'employees.notProvided': 'Not Provided',
    'employees.pcs': 'Pcs',
    'employees.pcsLower': 'pcs',
    'employees.perPc': '/ Pc',
    'employees.product': 'Product',
    'employees.products': 'Products',
    'employees.quantity': 'Quantity',
    'employees.quantityProduced': 'Quantity Produced',
    'employees.rate': 'Rate',
    'employees.earnings': 'Earnings',
    'employees.employeeCode': 'Employee Code',

    // Status
    'employees.status.active': 'Active',
    'employees.status.inactive': 'Inactive',

    // Table columns
    'employees.table.employeeName': 'Employee Name',
    'employees.table.email': 'Email',
    'employees.table.mobile': 'Mobile',
    'employees.table.currentMonthEarning': 'Current Month Earning',
    'employees.table.overallEarning': 'Overall Earning',

    // KPI cards
    'employees.kpi.totalEmployees': 'Total Employees',
    'employees.kpi.employeeStatus': 'Employee Status',
    'employees.kpi.currentMonthPayroll': 'Current Month Payroll',
    'employees.kpi.overallPayroll': 'Overall Payroll',

    // Pagination
    'employees.pagination.of': 'of',
    'employees.pagination.employees': 'employees',
    'employees.pagination.records': 'records',

    // Tooltips
    'employees.tooltip.edit': 'Edit Employee',
    'employees.tooltip.deactivate': 'Deactivate Employee',

    // Deactivate modal
    'employees.deactivate.title': 'Deactivate Employee',
    'employees.deactivate.confirmBefore': 'Are you sure you want to deactivate',
    'employees.deactivate.confirmAfter': '?',
    'employees.deactivate.ok': 'Yes, Deactivate',

    // Toast / notifications
    'employees.toast.success': 'Success',
    'employees.toast.error': 'Error',
    'employees.toast.created': 'Employee created successfully',
    'employees.toast.createFailed': 'Failed to create employee',
    'employees.toast.updated': 'Employee updated successfully',
    'employees.toast.updateFailed': 'Failed to update employee',
    'employees.toast.deactivated': 'Employee deactivated successfully',
    'employees.toast.deactivateFailed': 'Failed to deactivate employee',
    'employees.toast.reportFailed': 'Report download failed',

    // Details page error
    'employees.error.title': 'Failed to Load Employee Details',
    'employees.error.subtitle': 'Employee records could not be fetched.',
    'employees.error.backToList': 'Back to List',
    'employees.error.retry': 'Retry',

    // Download
    'employees.download.pdf': 'Download PDF',
    'employees.download.excel': 'Download Excel',
    'employees.download.report': 'Download report',

    // Filter
    'employees.filter.label': 'Filter by:',
    'employees.filter.currentMonth': 'Current Month',
    'employees.filter.selectMonth': 'Select Month',
    'employees.filter.customRange': 'Custom Range',
    'employees.filter.showAll': 'Show All',
    'employees.filter.apply': 'Apply Filter',

    // Calendar
    'employees.calendar.title': 'Production Calendar',
    'employees.calendar.info': "Daily earnings overview — each cell shows that day's pieces and earnings.",
    'employees.calendar.selectMonth': 'Select Month:',
    'employees.calendar.filteredCustom': 'Filtered by Custom Date Range',
    'employees.calendar.filteredCurrent': 'Filtered by Current Month',
    'employees.calendar.empty': 'No production activity found for selected period.',
    'employees.calendar.loading': 'Loading production calendar...',
    'employees.calendar.totalEarnings': 'Total Earnings:',
    'employees.calendar.totalQuantity': 'Total Quantity:',

    // Production details drawer
    'employees.productionDetails.title': 'Production Details',

    // Form drawer
    'employees.form.addTitle': 'Add Employee',
    'employees.form.editTitle': 'Edit Employee',
    'employees.form.saveChanges': 'Save Changes',
    'employees.form.saveEmployee': 'Save Employee',
    'employees.form.name': 'Employee Name',
    'employees.form.nameRequired': 'Employee Name is required.',
    'employees.form.namePlaceholder': 'Enter employee full name',
    'employees.form.email': 'Email',
    'employees.form.emailRequired': 'Email is required.',
    'employees.form.emailInvalid': 'Please enter a valid email format.',
    'employees.form.emailPlaceholder': 'Enter employee email',
    'employees.form.mobile': 'Mobile Number',
    'employees.form.mobileNumeric': 'Mobile number must contain numeric characters only.',
    'employees.form.mobileMax': 'Mobile number cannot exceed 15 digits.',
    'employees.form.mobilePlaceholder': 'Enter mobile number (optional)',
    'employees.form.joiningDate': 'Joining Date',
    'employees.form.joiningRequired': 'Joining Date is required.',
    'employees.form.address': 'Address',
    'employees.form.addressPlaceholder': 'Enter residential address (optional)',

    // Summary cards
    'employees.summary.overallTitle': 'Overall Summary',
    'employees.summary.currentMonthTitle': 'Current Month Summary',
    'employees.summary.totalProductionQty': 'Total Production Qty',
    'employees.summary.totalProduction': 'Total Production',
    'employees.summary.totalEarnings': 'Total Earnings',
    'employees.summary.currentMonthEarnings': 'Current Month Earnings',
    'employees.summary.productsWorkedOn': 'Products Worked On',
    'employees.summary.avgPerPiece': 'Avg / Piece',

    // Info card
    'employees.info.heading': 'Production output, earnings and history for this employee.',
    'employees.info.phone': 'Phone Number',

    // Current month card
    'employees.currentMonth.title': 'Current Month',
    'employees.currentMonth.info': 'Always shows the current month — the page filter does not apply to this card.',
    'employees.currentMonth.productPerformance': 'Product Performance',
    'employees.currentMonth.noProduction': 'No production this month',

    // Charts
    'employees.chart.earningsTrend': 'Monthly Earnings Trend',
    'employees.chart.productContribution': 'Product Contribution %',
    'employees.chart.noData': 'No data available for the selected range.',
    'employees.chart.contribution': 'Contribution',
    'employees.chart.qtyProduced': 'Qty Produced',

    // Production history
    'employees.productionHistory.title': 'Production History',
    'employees.productionHistory.empty': 'No production records found for the selected filter range.',

    // Product wise earnings
    'employees.productWise.title': 'Product Wise Earnings',
    'employees.productWise.empty': 'No product contributions found for the selected period.',
    'employees.productWise.emptyShort': 'No product contributions found.',

    // Current month product performance
    'employees.currentMonthPerf.title': 'Current Month Product Performance',
    'employees.currentMonthPerf.empty': 'No production recorded for current month.',

    // View drawer
    'employees.viewDrawer.title': 'Employee Details',
    'employees.viewDrawer.personalDetails': 'Personal & Joining Details',
    'employees.viewDrawer.fullName': 'Full Name',
  },
  hi: {
    // Shared / general
    'employees.pageTitle': 'कर्मचारी प्रबंधन',
    'employees.pageInfo': 'गारमेंट उत्पादन श्रमिकों और कर्मचारी रिकॉर्ड का प्रबंधन करें।',
    'employees.searchPlaceholder': 'नाम, कोड या मोबाइल नंबर से खोजें',
    'employees.addBtn': 'कर्मचारी जोड़ें',
    'employees.notProvided': 'उपलब्ध नहीं',
    'employees.pcs': 'पीस',
    'employees.pcsLower': 'पीस',
    'employees.perPc': '/ पीस',
    'employees.product': 'उत्पाद',
    'employees.products': 'उत्पाद',
    'employees.quantity': 'मात्रा',
    'employees.quantityProduced': 'उत्पादित मात्रा',
    'employees.rate': 'दर',
    'employees.earnings': 'कमाई',
    'employees.employeeCode': 'कर्मचारी कोड',

    // Status
    'employees.status.active': 'सक्रिय',
    'employees.status.inactive': 'निष्क्रिय',

    // Table columns
    'employees.table.employeeName': 'कर्मचारी नाम',
    'employees.table.email': 'ईमेल',
    'employees.table.mobile': 'मोबाइल',
    'employees.table.currentMonthEarning': 'इस माह की कमाई',
    'employees.table.overallEarning': 'कुल कमाई',

    // KPI cards
    'employees.kpi.totalEmployees': 'कुल कर्मचारी',
    'employees.kpi.employeeStatus': 'कर्मचारी स्थिति',
    'employees.kpi.currentMonthPayroll': 'इस माह का वेतन',
    'employees.kpi.overallPayroll': 'कुल वेतन',

    // Pagination
    'employees.pagination.of': 'में से',
    'employees.pagination.employees': 'कर्मचारी',
    'employees.pagination.records': 'रिकॉर्ड',

    // Tooltips
    'employees.tooltip.edit': 'कर्मचारी संपादित करें',
    'employees.tooltip.deactivate': 'कर्मचारी निष्क्रिय करें',

    // Deactivate modal
    'employees.deactivate.title': 'कर्मचारी निष्क्रिय करें',
    'employees.deactivate.confirmBefore': 'क्या आप वाकई',
    'employees.deactivate.confirmAfter': ' को निष्क्रिय करना चाहते हैं?',
    'employees.deactivate.ok': 'हाँ, निष्क्रिय करें',

    // Toast / notifications
    'employees.toast.success': 'सफल',
    'employees.toast.error': 'त्रुटि',
    'employees.toast.created': 'कर्मचारी सफलतापूर्वक बनाया गया',
    'employees.toast.createFailed': 'कर्मचारी बनाने में विफल',
    'employees.toast.updated': 'कर्मचारी सफलतापूर्वक अपडेट किया गया',
    'employees.toast.updateFailed': 'कर्मचारी अपडेट करने में विफल',
    'employees.toast.deactivated': 'कर्मचारी सफलतापूर्वक निष्क्रिय किया गया',
    'employees.toast.deactivateFailed': 'कर्मचारी निष्क्रिय करने में विफल',
    'employees.toast.reportFailed': 'रिपोर्ट डाउनलोड विफल',

    // Details page error
    'employees.error.title': 'कर्मचारी विवरण लोड करने में विफल',
    'employees.error.subtitle': 'कर्मचारी रिकॉर्ड प्राप्त नहीं किए जा सके।',
    'employees.error.backToList': 'सूची पर वापस जाएं',
    'employees.error.retry': 'पुनः प्रयास करें',

    // Download
    'employees.download.pdf': 'PDF डाउनलोड करें',
    'employees.download.excel': 'Excel डाउनलोड करें',
    'employees.download.report': 'रिपोर्ट डाउनलोड करें',

    // Filter
    'employees.filter.label': 'फ़िल्टर करें:',
    'employees.filter.currentMonth': 'वर्तमान माह',
    'employees.filter.selectMonth': 'माह चुनें',
    'employees.filter.customRange': 'कस्टम सीमा',
    'employees.filter.showAll': 'सभी दिखाएं',
    'employees.filter.apply': 'फ़िल्टर लागू करें',

    // Calendar
    'employees.calendar.title': 'उत्पादन कैलेंडर',
    'employees.calendar.info': 'दैनिक कमाई का अवलोकन — प्रत्येक सेल उस दिन के पीस और कमाई दिखाता है।',
    'employees.calendar.selectMonth': 'माह चुनें:',
    'employees.calendar.filteredCustom': 'कस्टम तारीख सीमा से फ़िल्टर किया गया',
    'employees.calendar.filteredCurrent': 'वर्तमान माह से फ़िल्टर किया गया',
    'employees.calendar.empty': 'चयनित अवधि के लिए कोई उत्पादन गतिविधि नहीं मिली।',
    'employees.calendar.loading': 'उत्पादन कैलेंडर लोड हो रहा है...',
    'employees.calendar.totalEarnings': 'कुल कमाई:',
    'employees.calendar.totalQuantity': 'कुल मात्रा:',

    // Production details drawer
    'employees.productionDetails.title': 'उत्पादन विवरण',

    // Form drawer
    'employees.form.addTitle': 'कर्मचारी जोड़ें',
    'employees.form.editTitle': 'कर्मचारी संपादित करें',
    'employees.form.saveChanges': 'परिवर्तन सहेजें',
    'employees.form.saveEmployee': 'कर्मचारी सहेजें',
    'employees.form.name': 'कर्मचारी नाम',
    'employees.form.nameRequired': 'कर्मचारी नाम आवश्यक है।',
    'employees.form.namePlaceholder': 'कर्मचारी का पूरा नाम दर्ज करें',
    'employees.form.email': 'ईमेल',
    'employees.form.emailRequired': 'ईमेल आवश्यक है।',
    'employees.form.emailInvalid': 'कृपया एक वैध ईमेल प्रारूप दर्ज करें।',
    'employees.form.emailPlaceholder': 'कर्मचारी का ईमेल दर्ज करें',
    'employees.form.mobile': 'मोबाइल नंबर',
    'employees.form.mobileNumeric': 'मोबाइल नंबर में केवल संख्यात्मक अक्षर होने चाहिए।',
    'employees.form.mobileMax': 'मोबाइल नंबर 15 अंकों से अधिक नहीं हो सकता।',
    'employees.form.mobilePlaceholder': 'मोबाइल नंबर दर्ज करें (वैकल्पिक)',
    'employees.form.joiningDate': 'नियुक्ति तिथि',
    'employees.form.joiningRequired': 'नियुक्ति तिथि आवश्यक है।',
    'employees.form.address': 'पता',
    'employees.form.addressPlaceholder': 'आवासीय पता दर्ज करें (वैकल्पिक)',

    // Summary cards
    'employees.summary.overallTitle': 'समग्र सारांश',
    'employees.summary.currentMonthTitle': 'वर्तमान माह सारांश',
    'employees.summary.totalProductionQty': 'कुल उत्पादन मात्रा',
    'employees.summary.totalProduction': 'कुल उत्पादन',
    'employees.summary.totalEarnings': 'कुल कमाई',
    'employees.summary.currentMonthEarnings': 'इस माह की कमाई',
    'employees.summary.productsWorkedOn': 'कार्य किए गए उत्पाद',
    'employees.summary.avgPerPiece': 'औसत / पीस',

    // Info card
    'employees.info.heading': 'इस कर्मचारी का उत्पादन, कमाई और इतिहास।',
    'employees.info.phone': 'फ़ोन नंबर',

    // Current month card
    'employees.currentMonth.title': 'वर्तमान माह',
    'employees.currentMonth.info': 'हमेशा वर्तमान माह दिखाता है — पेज फ़िल्टर इस कार्ड पर लागू नहीं होता।',
    'employees.currentMonth.productPerformance': 'उत्पाद प्रदर्शन',
    'employees.currentMonth.noProduction': 'इस माह कोई उत्पादन नहीं',

    // Charts
    'employees.chart.earningsTrend': 'मासिक कमाई रुझान',
    'employees.chart.productContribution': 'उत्पाद योगदान %',
    'employees.chart.noData': 'चयनित सीमा के लिए कोई डेटा उपलब्ध नहीं है।',
    'employees.chart.contribution': 'योगदान',
    'employees.chart.qtyProduced': 'उत्पादित मात्रा',

    // Production history
    'employees.productionHistory.title': 'उत्पादन इतिहास',
    'employees.productionHistory.empty': 'चयनित फ़िल्टर सीमा के लिए कोई उत्पादन रिकॉर्ड नहीं मिला।',

    // Product wise earnings
    'employees.productWise.title': 'उत्पाद अनुसार कमाई',
    'employees.productWise.empty': 'चयनित अवधि के लिए कोई उत्पाद योगदान नहीं मिला।',
    'employees.productWise.emptyShort': 'कोई उत्पाद योगदान नहीं मिला।',

    // Current month product performance
    'employees.currentMonthPerf.title': 'वर्तमान माह उत्पाद प्रदर्शन',
    'employees.currentMonthPerf.empty': 'वर्तमान माह के लिए कोई उत्पादन दर्ज नहीं किया गया।',

    // View drawer
    'employees.viewDrawer.title': 'कर्मचारी विवरण',
    'employees.viewDrawer.personalDetails': 'व्यक्तिगत और नियुक्ति विवरण',
    'employees.viewDrawer.fullName': 'पूरा नाम',
  },
};
