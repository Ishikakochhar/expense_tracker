// Translations for the Hearth app
// Covers navigation, page headings, settings, and common actions.

export type Language = 'English (UK)' | 'English (US)' | 'Hindi' | 'Marathi';

export type TranslationKey =
  // Navigation
  | 'nav.home'
  | 'nav.activity'
  | 'nav.groups'
  | 'nav.settings'
  // Dashboard
  | 'dashboard.tagline'
  | 'dashboard.subtitle'
  | 'dashboard.bottomLine'
  | 'dashboard.settlementPlan'
  | 'dashboard.totalExpenses'
  | 'dashboard.acrossGroups'
  | 'dashboard.youOwe'
  | 'dashboard.youAreOwed'
  | 'dashboard.allSettled'
  | 'dashboard.overallYouGetBack'
  | 'dashboard.overallYouOwe'
  | 'dashboard.noSettlements'
  | 'dashboard.splitSomething'
  | 'dashboard.goToGroups'
  | 'dashboard.viewDetails'
  | 'dashboard.selectGroup'
  // Groups
  | 'groups.title'
  | 'groups.subtitle'
  | 'groups.create'
  | 'groups.joinCode'
  | 'groups.viewDetails'
  | 'groups.members'
  | 'groups.planSomethingNew'
  | 'groups.planSubtitle'
  | 'groups.tip'
  | 'groups.tipText'
  // Group Detail
  | 'groupDetail.expenses'
  | 'groupDetail.members'
  | 'groupDetail.formerMembers'
  | 'groupDetail.addExpense'
  | 'groupDetail.importCSV'
  | 'groupDetail.settleUp'
  | 'groupDetail.balances'
  | 'groupDetail.noExpenses'
  | 'groupDetail.noExpensesSubtitle'
  | 'groupDetail.activeMembers'
  | 'groupDetail.formerMember'
  // Activity
  | 'activity.title'
  | 'activity.subtitle'
  | 'activity.empty'
  | 'activity.emptySubtitle'
  | 'activity.settledUp'
  | 'activity.paidBy'
  | 'activity.paid'
  | 'activity.you'
  // Settings
  | 'settings.title'
  | 'settings.subtitle'
  | 'settings.editProfile'
  | 'settings.notifications'
  | 'settings.notifyNewExpense'
  | 'settings.notifyNewExpenseDesc'
  | 'settings.notifySettlement'
  | 'settings.notifySettlementDesc'
  | 'settings.notifyGroupActivity'
  | 'settings.notifyGroupActivityDesc'
  | 'settings.preferences'
  | 'settings.defaultCurrency'
  | 'settings.language'
  | 'settings.security'
  | 'settings.changePassword'
  | 'settings.changePasswordDesc'
  | 'settings.twoFactor'
  | 'settings.twoFactorDesc'
  | 'settings.themePreference'
  | 'settings.light'
  | 'settings.dark'
  | 'settings.exportData'
  | 'settings.exportDataDesc'
  | 'settings.exportCSV'
  | 'settings.dangerZone'
  | 'settings.dangerZoneDesc'
  | 'settings.deleteAccount'
  | 'settings.logout'
  // Common
  | 'common.cancel'
  | 'common.save'
  | 'common.saving'
  | 'common.confirm'
  | 'common.back'
  | 'common.since'
  | 'common.paidBy'
  | 'common.splitWays'
  | 'common.welcomeBack'
  | 'common.yourSharedHome';

type Translations = Record<TranslationKey, string>;

export const translations: Record<Language, Translations> = {
  'English (UK)': {
    'nav.home': 'Home',
    'nav.activity': 'Activity',
    'nav.groups': 'Groups',
    'nav.settings': 'Settings',
    'dashboard.tagline': 'Your shared ground.',
    'dashboard.subtitle': "Here's how things look for your flat right now. The maths is done, you just focus on the living.",
    'dashboard.bottomLine': 'The Bottom Line',
    'dashboard.settlementPlan': 'Settlement Plan',
    'dashboard.totalExpenses': 'Total Expenses',
    'dashboard.acrossGroups': 'Across all your groups',
    'dashboard.youOwe': 'You owe money',
    'dashboard.youAreOwed': 'You are owed money',
    'dashboard.allSettled': 'All settled up',
    'dashboard.overallYouGetBack': 'Overall, you get back',
    'dashboard.overallYouOwe': 'Overall, you owe',
    'dashboard.noSettlements': 'No pending settlements involve you.',
    'dashboard.splitSomething': 'Need to split something?',
    'dashboard.goToGroups': 'Go to Groups',
    'dashboard.viewDetails': 'View details',
    'dashboard.selectGroup': 'Select a group',
    'groups.title': 'My Groups',
    'groups.subtitle': 'Your financial circles, handled with care. Settle up or start something new.',
    'groups.create': 'Create New Group',
    'groups.joinCode': 'Join with Code',
    'groups.viewDetails': 'View Details',
    'groups.members': 'Members',
    'groups.planSomethingNew': 'Plan something new',
    'groups.planSubtitle': 'Add a group for dinner, rent, or a shared gift.',
    'groups.tip': 'Hearth Tip',
    'groups.tipText': "Groups make it easier to track recurring bills. Try setting up 'Utilities' as a group to never miss a split again.",
    'groupDetail.expenses': 'Expenses',
    'groupDetail.members': 'Members',
    'groupDetail.formerMembers': 'Former Members',
    'groupDetail.addExpense': 'Add Expense',
    'groupDetail.importCSV': 'Import CSV',
    'groupDetail.settleUp': 'Settle Up',
    'groupDetail.balances': 'Balances',
    'groupDetail.noExpenses': 'No expenses yet',
    'groupDetail.noExpensesSubtitle': 'Add your first expense or import from CSV',
    'groupDetail.activeMembers': 'active member',
    'groupDetail.formerMember': 'former',
    'activity.title': 'Recent Activity',
    'activity.subtitle': "Here's a timeline of all your expenses and settlements.",
    'activity.empty': 'No activity yet',
    'activity.emptySubtitle': 'Your expenses and settlements will appear here.',
    'activity.settledUp': 'Settled up',
    'activity.paidBy': 'Paid by',
    'activity.paid': 'paid',
    'activity.you': 'you',
    'settings.title': 'Settings',
    'settings.subtitle': 'Manage your communal life and account preferences.',
    'settings.editProfile': 'Edit Profile Details',
    'settings.notifications': 'Notifications',
    'settings.notifyNewExpense': 'New Expense Added',
    'settings.notifyNewExpenseDesc': 'Notify me when someone logs a bill',
    'settings.notifySettlement': 'Settlement Reminders',
    'settings.notifySettlementDesc': 'Weekly nudge to settle pending tabs',
    'settings.notifyGroupActivity': 'Group Activity',
    'settings.notifyGroupActivityDesc': 'Changes in group members or titles',
    'settings.preferences': 'Preferences',
    'settings.defaultCurrency': 'Default Currency',
    'settings.language': 'Language',
    'settings.security': 'Security',
    'settings.changePassword': 'Change Password',
    'settings.changePasswordDesc': 'Update your login credentials',
    'settings.twoFactor': 'Two-Factor Auth',
    'settings.twoFactorDesc': 'Enhanced account protection',
    'settings.themePreference': 'Theme Preference',
    'settings.light': 'Light',
    'settings.dark': 'Dark',
    'settings.exportData': 'Export your data',
    'settings.exportDataDesc': 'Download all your transactions in CSV format.',
    'settings.exportCSV': 'Export CSV',
    'settings.dangerZone': 'Danger Zone',
    'settings.dangerZoneDesc': 'This action is permanent and cannot be undone.',
    'settings.deleteAccount': 'Delete Account',
    'settings.logout': 'Log out',
    'common.cancel': 'Cancel',
    'common.save': 'Save Changes',
    'common.saving': 'Saving...',
    'common.confirm': 'Confirm',
    'common.back': 'Back',
    'common.since': 'Since',
    'common.paidBy': 'Paid by',
    'common.splitWays': 'Split',
    'common.welcomeBack': 'Welcome back,',
    'common.yourSharedHome': 'Your shared home',
  },

  'English (US)': {
    'nav.home': 'Home',
    'nav.activity': 'Activity',
    'nav.groups': 'Groups',
    'nav.settings': 'Settings',
    'dashboard.tagline': 'Your shared ground.',
    'dashboard.subtitle': "Here's how things look for your place right now. The math is done, you just focus on the living.",
    'dashboard.bottomLine': 'The Bottom Line',
    'dashboard.settlementPlan': 'Settlement Plan',
    'dashboard.totalExpenses': 'Total Expenses',
    'dashboard.acrossGroups': 'Across all your groups',
    'dashboard.youOwe': 'You owe money',
    'dashboard.youAreOwed': 'You are owed money',
    'dashboard.allSettled': 'All settled up',
    'dashboard.overallYouGetBack': 'Overall, you get back',
    'dashboard.overallYouOwe': 'Overall, you owe',
    'dashboard.noSettlements': 'No pending settlements involve you.',
    'dashboard.splitSomething': 'Need to split something?',
    'dashboard.goToGroups': 'Go to Groups',
    'dashboard.viewDetails': 'View details',
    'dashboard.selectGroup': 'Select a group',
    'groups.title': 'My Groups',
    'groups.subtitle': 'Your financial circles, handled with care. Settle up or start something new.',
    'groups.create': 'Create New Group',
    'groups.joinCode': 'Join with Code',
    'groups.viewDetails': 'View Details',
    'groups.members': 'Members',
    'groups.planSomethingNew': 'Plan something new',
    'groups.planSubtitle': 'Add a group for dinner, rent, or a shared gift.',
    'groups.tip': 'Hearth Tip',
    'groups.tipText': "Groups make it easier to track recurring bills. Try setting up 'Utilities' as a group to never miss a split again.",
    'groupDetail.expenses': 'Expenses',
    'groupDetail.members': 'Members',
    'groupDetail.formerMembers': 'Former Members',
    'groupDetail.addExpense': 'Add Expense',
    'groupDetail.importCSV': 'Import CSV',
    'groupDetail.settleUp': 'Settle Up',
    'groupDetail.balances': 'Balances',
    'groupDetail.noExpenses': 'No expenses yet',
    'groupDetail.noExpensesSubtitle': 'Add your first expense or import from CSV',
    'groupDetail.activeMembers': 'active member',
    'groupDetail.formerMember': 'former',
    'activity.title': 'Recent Activity',
    'activity.subtitle': "Here's a timeline of all your expenses and settlements.",
    'activity.empty': 'No activity yet',
    'activity.emptySubtitle': 'Your expenses and settlements will appear here.',
    'activity.settledUp': 'Settled up',
    'activity.paidBy': 'Paid by',
    'activity.paid': 'paid',
    'activity.you': 'you',
    'settings.title': 'Settings',
    'settings.subtitle': 'Manage your communal life and account preferences.',
    'settings.editProfile': 'Edit Profile Details',
    'settings.notifications': 'Notifications',
    'settings.notifyNewExpense': 'New Expense Added',
    'settings.notifyNewExpenseDesc': 'Notify me when someone logs a bill',
    'settings.notifySettlement': 'Settlement Reminders',
    'settings.notifySettlementDesc': 'Weekly nudge to settle pending tabs',
    'settings.notifyGroupActivity': 'Group Activity',
    'settings.notifyGroupActivityDesc': 'Changes in group members or titles',
    'settings.preferences': 'Preferences',
    'settings.defaultCurrency': 'Default Currency',
    'settings.language': 'Language',
    'settings.security': 'Security',
    'settings.changePassword': 'Change Password',
    'settings.changePasswordDesc': 'Update your login credentials',
    'settings.twoFactor': 'Two-Factor Auth',
    'settings.twoFactorDesc': 'Enhanced account protection',
    'settings.themePreference': 'Theme Preference',
    'settings.light': 'Light',
    'settings.dark': 'Dark',
    'settings.exportData': 'Export your data',
    'settings.exportDataDesc': 'Download all your transactions in CSV format.',
    'settings.exportCSV': 'Export CSV',
    'settings.dangerZone': 'Danger Zone',
    'settings.dangerZoneDesc': 'This action is permanent and cannot be undone.',
    'settings.deleteAccount': 'Delete Account',
    'settings.logout': 'Log out',
    'common.cancel': 'Cancel',
    'common.save': 'Save Changes',
    'common.saving': 'Saving...',
    'common.confirm': 'Confirm',
    'common.back': 'Back',
    'common.since': 'Since',
    'common.paidBy': 'Paid by',
    'common.splitWays': 'Split',
    'common.welcomeBack': 'Welcome back,',
    'common.yourSharedHome': 'Your shared home',
  },

  'Hindi': {
    'nav.home': 'होम',
    'nav.activity': 'गतिविधि',
    'nav.groups': 'समूह',
    'nav.settings': 'सेटिंग्स',
    'dashboard.tagline': 'आपकी साझी ज़मीन।',
    'dashboard.subtitle': 'अभी आपके घर के हालात यहाँ हैं। हिसाब हो गया है, बस जिंदगी जीते रहिए।',
    'dashboard.bottomLine': 'असली हिसाब',
    'dashboard.settlementPlan': 'निपटान योजना',
    'dashboard.totalExpenses': 'कुल खर्च',
    'dashboard.acrossGroups': 'आपके सभी समूहों में',
    'dashboard.youOwe': 'आप पर बकाया है',
    'dashboard.youAreOwed': 'आपको मिलना है',
    'dashboard.allSettled': 'सब बराबर है',
    'dashboard.overallYouGetBack': 'कुल मिलाकर, आपको मिलेगा',
    'dashboard.overallYouOwe': 'कुल मिलाकर, आप पर है',
    'dashboard.noSettlements': 'आपसे जुड़ा कोई बकाया नहीं है।',
    'dashboard.splitSomething': 'कुछ बाँटना है?',
    'dashboard.goToGroups': 'समूहों पर जाएँ',
    'dashboard.viewDetails': 'विवरण देखें',
    'dashboard.selectGroup': 'समूह चुनें',
    'groups.title': 'मेरे समूह',
    'groups.subtitle': 'आपके वित्तीय दायरे, सावधानी से संभाले गए।',
    'groups.create': 'नया समूह बनाएँ',
    'groups.joinCode': 'कोड से जुड़ें',
    'groups.viewDetails': 'विवरण देखें',
    'groups.members': 'सदस्य',
    'groups.planSomethingNew': 'कुछ नया योजना बनाएँ',
    'groups.planSubtitle': 'डिनर, किराया, या साझे उपहार के लिए समूह बनाएँ।',
    'groups.tip': 'हर्थ टिप',
    'groups.tipText': "समूह बार-बार आने वाले बिलों को ट्रैक करना आसान बनाते हैं।",
    'groupDetail.expenses': 'खर्च',
    'groupDetail.members': 'सदस्य',
    'groupDetail.formerMembers': 'पूर्व सदस्य',
    'groupDetail.addExpense': 'खर्च जोड़ें',
    'groupDetail.importCSV': 'CSV आयात करें',
    'groupDetail.settleUp': 'निपटान करें',
    'groupDetail.balances': 'बैलेंस',
    'groupDetail.noExpenses': 'अभी कोई खर्च नहीं',
    'groupDetail.noExpensesSubtitle': 'पहला खर्च जोड़ें या CSV से आयात करें',
    'groupDetail.activeMembers': 'सक्रिय सदस्य',
    'groupDetail.formerMember': 'पूर्व',
    'activity.title': 'हाल की गतिविधि',
    'activity.subtitle': 'आपके सभी खर्चों और निपटानों की समयरेखा।',
    'activity.empty': 'अभी कोई गतिविधि नहीं',
    'activity.emptySubtitle': 'आपके खर्च और निपटान यहाँ दिखेंगे।',
    'activity.settledUp': 'निपटान हुआ',
    'activity.paidBy': 'द्वारा भुगतान',
    'activity.paid': 'ने भुगतान किया',
    'activity.you': 'आपने',
    'settings.title': 'सेटिंग्स',
    'settings.subtitle': 'अपने साझा जीवन और खाते की प्राथमिकताएँ प्रबंधित करें।',
    'settings.editProfile': 'प्रोफ़ाइल संपादित करें',
    'settings.notifications': 'सूचनाएँ',
    'settings.notifyNewExpense': 'नया खर्च जोड़ा गया',
    'settings.notifyNewExpenseDesc': 'जब कोई बिल जोड़े तो मुझे सूचित करें',
    'settings.notifySettlement': 'निपटान अनुस्मारक',
    'settings.notifySettlementDesc': 'बकाया निपटाने के लिए साप्ताहिक याद दिलाना',
    'settings.notifyGroupActivity': 'समूह गतिविधि',
    'settings.notifyGroupActivityDesc': 'समूह के सदस्यों या नामों में बदलाव',
    'settings.preferences': 'प्राथमिकताएँ',
    'settings.defaultCurrency': 'डिफ़ॉल्ट मुद्रा',
    'settings.language': 'भाषा',
    'settings.security': 'सुरक्षा',
    'settings.changePassword': 'पासवर्ड बदलें',
    'settings.changePasswordDesc': 'अपनी लॉगिन जानकारी अपडेट करें',
    'settings.twoFactor': 'दो-कारक प्रमाणीकरण',
    'settings.twoFactorDesc': 'उन्नत खाता सुरक्षा',
    'settings.themePreference': 'थीम प्राथमिकता',
    'settings.light': 'हल्का',
    'settings.dark': 'गहरा',
    'settings.exportData': 'डेटा निर्यात करें',
    'settings.exportDataDesc': 'सभी लेनदेन CSV प्रारूप में डाउनलोड करें।',
    'settings.exportCSV': 'CSV निर्यात करें',
    'settings.dangerZone': 'खतरे का क्षेत्र',
    'settings.dangerZoneDesc': 'यह क्रिया स्थायी है और पूर्ववत नहीं की जा सकती।',
    'settings.deleteAccount': 'खाता हटाएँ',
    'settings.logout': 'लॉग आउट',
    'common.cancel': 'रद्द करें',
    'common.save': 'परिवर्तन सहेजें',
    'common.saving': 'सहेजा जा रहा है...',
    'common.confirm': 'पुष्टि करें',
    'common.back': 'वापस',
    'common.since': 'से',
    'common.paidBy': 'द्वारा भुगतान',
    'common.splitWays': 'विभाजित',
    'common.welcomeBack': 'वापस स्वागत है,',
    'common.yourSharedHome': 'आपका साझा घर',
  },

  'Marathi': {
    'nav.home': 'मुख्यपृष्ठ',
    'nav.activity': 'क्रियाकलाप',
    'nav.groups': 'गट',
    'nav.settings': 'सेटिंग्ज',
    'dashboard.tagline': 'तुमची सामायिक जमीन।',
    'dashboard.subtitle': 'तुमच्या घरातील सध्याची परिस्थिती येथे आहे. हिशोब झाला आहे, तुम्ही फक्त जगणे उपभोगा.',
    'dashboard.bottomLine': 'मुख्य हिशोब',
    'dashboard.settlementPlan': 'निकाल योजना',
    'dashboard.totalExpenses': 'एकूण खर्च',
    'dashboard.acrossGroups': 'सर्व गटांमध्ये',
    'dashboard.youOwe': 'तुम्हाला द्यायचे आहे',
    'dashboard.youAreOwed': 'तुम्हाला मिळायचे आहे',
    'dashboard.allSettled': 'सर्व बरोबर',
    'dashboard.overallYouGetBack': 'एकूण, तुम्हाला मिळेल',
    'dashboard.overallYouOwe': 'एकूण, तुमच्यावर आहे',
    'dashboard.noSettlements': 'तुमच्याशी संबंधित कोणतेही बाकी नाही.',
    'dashboard.splitSomething': 'काही वाटायचे आहे का?',
    'dashboard.goToGroups': 'गटांकडे जा',
    'dashboard.viewDetails': 'तपशील पाहा',
    'dashboard.selectGroup': 'गट निवडा',
    'groups.title': 'माझे गट',
    'groups.subtitle': 'तुमचे आर्थिक वर्तुळ, काळजीपूर्वक हाताळले.',
    'groups.create': 'नवीन गट तयार करा',
    'groups.joinCode': 'कोडने सामील व्हा',
    'groups.viewDetails': 'तपशील पाहा',
    'groups.members': 'सदस्य',
    'groups.planSomethingNew': 'काहीतरी नवीन योजना करा',
    'groups.planSubtitle': 'जेवण, भाडे किंवा सामायिक भेटवस्तूसाठी गट तयार करा.',
    'groups.tip': 'हर्थ टीप',
    'groups.tipText': 'गट वारंवार येणार्‍या बिलांचा मागोवा घेणे सोपे करतात.',
    'groupDetail.expenses': 'खर्च',
    'groupDetail.members': 'सदस्य',
    'groupDetail.formerMembers': 'माजी सदस्य',
    'groupDetail.addExpense': 'खर्च जोडा',
    'groupDetail.importCSV': 'CSV आयात करा',
    'groupDetail.settleUp': 'निकाल करा',
    'groupDetail.balances': 'शिल्लक',
    'groupDetail.noExpenses': 'अद्याप खर्च नाही',
    'groupDetail.noExpensesSubtitle': 'पहिला खर्च जोडा किंवा CSV मधून आयात करा',
    'groupDetail.activeMembers': 'सक्रिय सदस्य',
    'groupDetail.formerMember': 'माजी',
    'activity.title': 'अलीकडील क्रियाकलाप',
    'activity.subtitle': 'तुमच्या सर्व खर्च आणि निकालांची वेळरेखा.',
    'activity.empty': 'अद्याप कोणताही क्रियाकलाप नाही',
    'activity.emptySubtitle': 'तुमचे खर्च आणि निकाल येथे दिसतील.',
    'activity.settledUp': 'निकाल झाला',
    'activity.paidBy': 'द्वारे भरले',
    'activity.paid': 'ने भरले',
    'activity.you': 'तुम्ही',
    'settings.title': 'सेटिंग्ज',
    'settings.subtitle': 'तुमचे सामायिक जीवन आणि खाते प्राधान्ये व्यवस्थापित करा.',
    'settings.editProfile': 'प्रोफाइल संपादित करा',
    'settings.notifications': 'सूचना',
    'settings.notifyNewExpense': 'नवीन खर्च जोडला',
    'settings.notifyNewExpenseDesc': 'कोणी बिल जोडले तर मला कळवा',
    'settings.notifySettlement': 'निकाल स्मरणपत्रे',
    'settings.notifySettlementDesc': 'बाकी निकाल करण्यासाठी साप्ताहिक स्मरण',
    'settings.notifyGroupActivity': 'गट क्रियाकलाप',
    'settings.notifyGroupActivityDesc': 'गट सदस्य किंवा नावांमध्ये बदल',
    'settings.preferences': 'प्राधान्ये',
    'settings.defaultCurrency': 'डीफॉल्ट चलन',
    'settings.language': 'भाषा',
    'settings.security': 'सुरक्षा',
    'settings.changePassword': 'पासवर्ड बदला',
    'settings.changePasswordDesc': 'तुमची लॉगिन माहिती अपडेट करा',
    'settings.twoFactor': 'दोन-घटक प्रमाणीकरण',
    'settings.twoFactorDesc': 'सुधारित खाते संरक्षण',
    'settings.themePreference': 'थीम प्राधान्य',
    'settings.light': 'उजळ',
    'settings.dark': 'गडद',
    'settings.exportData': 'डेटा निर्यात करा',
    'settings.exportDataDesc': 'सर्व व्यवहार CSV स्वरूपात डाउनलोड करा.',
    'settings.exportCSV': 'CSV निर्यात करा',
    'settings.dangerZone': 'धोक्याचे क्षेत्र',
    'settings.dangerZoneDesc': 'ही क्रिया कायमस्वरूपी आहे आणि पूर्वत केली जाऊ शकत नाही.',
    'settings.deleteAccount': 'खाते हटवा',
    'settings.logout': 'लॉग आउट',
    'common.cancel': 'रद्द करा',
    'common.save': 'बदल जतन करा',
    'common.saving': 'जतन होत आहे...',
    'common.confirm': 'पुष्टी करा',
    'common.back': 'मागे',
    'common.since': 'पासून',
    'common.paidBy': 'द्वारे भरले',
    'common.splitWays': 'विभाजित',
    'common.welcomeBack': 'पुन्हा स्वागत आहे,',
    'common.yourSharedHome': 'तुमचे सामायिक घर',
  },
};
