// The API answers with English messages. In the Arabic UI they are translated here, in ONE place
// (apiClient), so every toast/inline error is localized without touching each caller.
// Unknown messages are returned unchanged.

const ENTITIES: Record<string, string> = {
  branch: 'الفرع', tenant: 'المنشأة', expense: 'المصروف', device: 'الجهاز', invoice: 'الفاتورة',
  user: 'المستخدم', shift: 'الوردية', item: 'الصنف', 'production order': 'أمر الإنتاج', 'wash job': 'مهمة الغسيل',
  table: 'الطاولة', role: 'الدور', 'held order': 'الطلب المعلّق', coupon: 'الكوبون', customer: 'العميل',
  'waitlist entry': 'سجل قائمة الانتظار', vehicle: 'السيارة', variant: 'النوع', template: 'القالب', plan: 'الخطة',
  permission: 'الصلاحية', order: 'الطلب', 'order item': 'صنف الطلب', 'note preset': 'الملاحظة الجاهزة',
  'loyalty tier': 'مستوى الولاء', 'field definition': 'تعريف الحقل', category: 'الفئة', bom: 'قائمة المواد',
  asset: 'الملف', warehouse: 'المستودع', supplier: 'المورد', transfer: 'التحويل', reservation: 'الحجز',
  schedule: 'الجدول', 'stock count': 'الجرد', unit: 'الوحدة', 'quick expense definition': 'المصروف السريع',
  version: 'الإصدار', 'work center': 'مركز العمل', wave: 'الموجة', 'warehouse task': 'مهمة المستودع',
  subscription: 'الاشتراك', shipment: 'الشحنة', serial: 'الرقم التسلسلي', session: 'الجلسة', agreement: 'الاتفاقية',
  snapshot: 'اللقطة', 'shift pattern': 'نمط الدوام', 'attribute value': 'قيمة الخاصية',
};

// Arabic agreement: feminine nouns take "غير موجودة".
const FEMININE = new Set([
  'المنشأة', 'الفاتورة', 'الوردية', 'الطاولة', 'الخطة', 'الصلاحية', 'الفئة', 'الشحنة', 'الاتفاقية', 'الجلسة',
  'الوحدة', 'الموجة', 'السيارة', 'اللقطة', 'الملاحظة الجاهزة', 'قائمة المواد', 'مهمة الغسيل', 'مهمة المستودع',
  'قيمة الخاصية', 'قائمة الانتظار', 'القالب الجاهز',
]);

const EXACT: Record<string, string> = {
  'Not found': 'غير موجود',
  Unauthorized: 'انتهت الجلسة، سجّل الدخول من جديد',
  Forbidden: 'ليست لديك صلاحية لهذا الإجراء',
  'Forbidden resource': 'ليست لديك صلاحية لهذا الإجراء',
  'Invalid credentials': 'بيانات الدخول غير صحيحة',
  'Invalid or missing token': 'انتهت الجلسة، سجّل الدخول من جديد',
  'Service temporarily unavailable': 'الخدمة غير متاحة مؤقتًا، حاول بعد قليل',
  'Request failed': 'تعذّر تنفيذ الطلب',
  'Internal server error': 'حدث خطأ في الخادم، حاول مرة أخرى',
  'Too Many Requests': 'محاولات كثيرة، انتظر قليلًا ثم أعد المحاولة',
  'Insufficient loyalty points balance': 'رصيد نقاط الولاء غير كافٍ',
  'A coupon with this code already exists': 'يوجد كوبون بنفس الكود',
  'A category with this name already exists': 'توجد فئة بنفس الاسم',
  'A tier with this name already exists': 'يوجد مستوى بنفس الاسم',
  'Email already exists in this tenant': 'البريد الإلكتروني مستخدم مسبقًا',
  'Shift already closed': 'الوردية مغلقة مسبقًا',
  'A shift is already open for this cashier': 'يوجد وردية مفتوحة لهذا الكاشير',
  'No open order for this table': 'لا يوجد طلب مفتوح لهذه الطاولة',
  'No open order for this table — open the table first': 'لا يوجد طلب مفتوح لهذه الطاولة، افتح الطاولة أولًا',
  'Cannot check out a table with no items ordered': 'لا يمكن الدفع على طاولة بلا أصناف',
  'Table has items ordered — check it out instead of releasing it': 'على الطاولة أصناف، حصّل الفاتورة بدل إلغاء الفتح',
  'Order was already checked out or no longer open': 'الطلب مدفوع مسبقًا أو لم يعد مفتوحًا',
  'cash_tendered required for cash payment': 'أدخل المبلغ المدفوع نقدًا',
  'date_to must be on or after date_from': 'تاريخ النهاية يجب أن يكون في أو بعد تاريخ البداية',
  'file is required': 'الملف مطلوب',
  'plate must not be empty': 'أدخل رقم اللوحة',
  'The selected warehouse does not exist': 'المستودع المحدد غير موجود',
  'Tenant context missing': 'تعذّر تحديد المنشأة، سجّل الدخول من جديد',
  'phone must be a valid phone number (7-20 digits)': 'رقم الجوال غير صحيح (من 7 إلى 20 رقمًا)',
  'Archived templates cannot be edited': 'لا يمكن تعديل قالب مؤرشف',
};

const FIELDS: Record<string, string> = {
  capacity: 'السعة', party_size: 'عدد الأشخاص', customer_name: 'اسم العميل', customer_phone: 'جوال العميل',
  opening_cash: 'رصيد الافتتاح', closing_cash: 'النقد المعدود', discount_value: 'قيمة الخصم', min_order_amount: 'الحد الأدنى للطلب',
  gps_radius_meters: 'نصف قطر الموقع', latitude: 'خط العرض', longitude: 'خط الطول', price: 'السعر', sku: 'رمز الصنف',
  name: 'الاسم', phone: 'الجوال', email: 'البريد الإلكتروني', amount: 'المبلغ', plate: 'رقم اللوحة', notes: 'الملاحظات',
  quantity: 'الكمية', reservation_time: 'وقت الحجز', tax_rate: 'نسبة الضريبة', code: 'الكود', title: 'العنوان',
  address: 'العنوان', full_name: 'الاسم الكامل', value: 'القيمة', threshold: 'الحد', points: 'النقاط',
};
const f = (field: string) => FIELDS[field] ?? field;

const RULES: Array<[RegExp, (m: RegExpMatchArray) => string]> = [
  [
    /^(.+?) not found$/i,
    (m) => {
      const name = ENTITIES[m[1].toLowerCase()] ?? 'العنصر';
      return `${name} ${FEMININE.has(name) ? 'غير موجودة' : 'غير موجود'}`;
    },
  ],
  [/^Table is not available \(status: (.+)\)$/, () => 'الطاولة غير متاحة'],
  [/^(\w+) should not be empty$/, (m) => `الحقل ${f(m[1])} مطلوب`],
  [/^(\w+) must be an email$|^(\w+) must be a valid email$/, () => 'البريد الإلكتروني غير صحيح'],
  [/^(\w+) must be a (string|number|boolean|UUID|number string)$/i, (m) => `قيمة الحقل ${f(m[1])} غير صحيحة`],
  [/^(\w+) must be an? (integer|array|object|date string|enum value).*$/i, (m) => `قيمة الحقل ${f(m[1])} غير صحيحة`],
  [/^(\w+) must not be (greater|less) than (.+)$/, (m) => `قيمة الحقل ${f(m[1])} ${m[2] === 'greater' ? 'أكبر' : 'أقل'} من المسموح (${m[3]})`],
  [/^(\w+) must be (longer|shorter) than or equal to (\d+) characters$/, (m) => `طول الحقل ${f(m[1])} ${m[2] === 'longer' ? 'أقل' : 'أكثر'} من المسموح (${m[3]})`],
  [/^(\w+) must be one of the following values: .+$/, (m) => `قيمة الحقل ${f(m[1])} غير مسموحة`],
  [/^(\w+) must be a positive number$/, (m) => `الحقل ${f(m[1])} يجب أن يكون رقمًا موجبًا`],
  [/^(\w+) must not be less than (.+)$/, (m) => `قيمة الحقل ${f(m[1])} يجب ألا تقل عن ${m[2]}`],
  [/^(\w+) must not be greater than or equal to (.+)$/, (m) => `قيمة الحقل ${f(m[1])} خارج المدى المسموح`],
  [/^(.+) already exists$/i, () => 'السجل موجود مسبقًا'],
  [/^(.+) is too long( \(max (\d+)\))?$/, () => 'النص أطول من المسموح'],
];

export function translateServerMessage(message: string): string {
  const exact = EXACT[message];
  if (exact) return exact;
  for (const [re, fn] of RULES) {
    const m = message.match(re);
    if (m) return fn(m);
  }
  return message;
}

/** Translates only when the page is in Arabic (the locale is the first URL segment). */
export function localizeServerMessage(message: unknown): string {
  const list = Array.isArray(message) ? message.map(String) : [String(message ?? '')];
  const arabic = typeof window !== 'undefined' && window.location.pathname.startsWith('/ar');
  return (arabic ? list.map(translateServerMessage) : list).join(arabic ? '، ' : ', ');
}
