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
  'amount_min must not be greater than amount_max': 'الحد الأدنى للمبلغ أكبر من الحد الأقصى',
  'amount_min and amount_max must not be negative': 'المبلغ لا يمكن أن يكون سالبًا',
  'file is required': 'الملف مطلوب',
  'plate must not be empty': 'أدخل رقم اللوحة',
  'The selected warehouse does not exist': 'المستودع المحدد غير موجود',
  'Tenant context missing': 'تعذّر تحديد المنشأة، سجّل الدخول من جديد',
  'phone must be a valid phone number (7-20 digits)': 'رقم الجوال غير صحيح (من 7 إلى 20 رقمًا)',
  'Invalid coupon code': 'كود الكوبون غير صحيح',
  'This coupon has expired': 'انتهت صلاحية هذا الكوبون',
  'This coupon has reached its usage limit': 'وصل هذا الكوبون إلى حد الاستخدام',
  'This coupon is no longer active': 'هذا الكوبون لم يعد فعّالًا',
  'This coupon is not valid yet': 'هذا الكوبون غير ساري بعد',
  'This plate is already registered to another customer': 'رقم اللوحة مسجّل لعميل آخر',
  'Phone already registered for this tenant': 'رقم الجوال مسجّل لعميل آخر',
  'No item is linked to this barcode': 'الباركود غير معروف',
  'Not your shift': 'هذه الوردية ليست لك',
  'Counted cash is required': 'أدخل النقد المعدود',
  'Invoice already cancelled': 'الفاتورة ملغاة مسبقًا',
  'Cannot cancel this invoice': 'لا يمكن إلغاء هذه الفاتورة',
  'This invoice has returns and can no longer be cancelled': 'للفاتورة مرتجعات ولم يعد إلغاؤها ممكنًا',
  'The report is available after the register is closed': 'التقرير متاح بعد إغلاق الصندوق',
  'No open shift — open a shift before opening the drawer': 'لا توجد وردية مفتوحة، افتح الوردية قبل فتح الدرج',
  'The register activity kept changing while closing; try again': 'تغيّرت حركة الصندوق أثناء الإغلاق، حاول مرة أخرى',
  'A phone number or a plate number is required': 'أدخل رقم الجوال أو رقم اللوحة',
  'customer_id required to redeem loyalty points': 'اختر عميلًا لاستبدال نقاط الولاء',
  'customer_id required to redeem reward instances': 'اختر عميلًا لاستبدال المكافآت',
  'customer_id required for tab (open account) payment': 'اختر عميلًا للدفع على الحساب',
  'cash_amount and card_amount must not be negative': 'مبالغ الدفع المختلط لا يمكن أن تكون سالبة',
  'cash_amount and card_amount required for split payment': 'أدخل مبلغي النقد والبطاقة للدفع المختلط',
  'Loyalty program is disabled for this tenant': 'برنامج الولاء غير مفعّل',
  'PDF engine failed to start on this server': 'تعذّر تجهيز ملف PDF حاليًا، حاول لاحقًا',
  'PDF rendering failed': 'تعذّر إنشاء ملف PDF',
  'Percentage discount cannot exceed 100': 'نسبة الخصم لا يمكن أن تتجاوز 100',
  'valid_to must be on or after valid_from': 'تاريخ نهاية الصلاحية يجب أن يكون بعد البداية',
  'Archived templates cannot be edited': 'لا يمكن تعديل قالب مؤرشف',
  'A branch with this name already exists': 'يوجد فرع بنفس الاسم',
  'Cannot delete a branch that has an open shift.': 'لا يمكن حذف فرع عليه وردية مفتوحة',
  'Cannot delete a branch that has shifts or invoices. Deactivate it instead.': 'لا يمكن حذف فرع عليه ورديات أو فواتير، عطّله بدل الحذف',
  'Cannot delete the last active branch.': 'لا يمكن حذف آخر فرع',
  'Only a published template can be the default': 'يمكن تعيين قالب منشور فقط كافتراضي',
  'tax_number must be 15 digits': 'الرقم الضريبي يجب أن يكون 15 رقمًا',
};

const FIELDS: Record<string, string> = {
  capacity: 'السعة', party_size: 'عدد الأشخاص', customer_name: 'اسم العميل', customer_phone: 'جوال العميل',
  opening_cash: 'رصيد الافتتاح', closing_cash: 'النقد المعدود', discount_value: 'قيمة الخصم', min_order_amount: 'الحد الأدنى للطلب',
  gps_radius_meters: 'نصف قطر الموقع', latitude: 'خط العرض', longitude: 'خط الطول', price: 'السعر', sku: 'رمز الصنف',
  name: 'الاسم', phone: 'الجوال', email: 'البريد الإلكتروني', amount: 'المبلغ', plate: 'رقم اللوحة', notes: 'الملاحظات',
  quantity: 'الكمية', reservation_time: 'وقت الحجز', tax_rate: 'نسبة الضريبة', code: 'الكود', title: 'العنوان',
  address: 'العنوان', full_name: 'الاسم الكامل', value: 'القيمة', threshold: 'الحد', points: 'النقاط',
  vat_number: 'الرقم الضريبي', tax_number: 'الرقم الضريبي', building_no: 'رقم المبنى', postal_zone: 'الرمز البريدي',
  legal_name: 'الاسم النظامي', egs_name: 'اسم الجهاز', business_category: 'النشاط التجاري', street: 'الشارع',
  district: 'الحي', city: 'المدينة', crn: 'السجل التجاري', field_key: 'مفتاح الحقل',
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
  [/^This coupon requires a minimum order of (.+)$/, (m) => `هذا الكوبون يتطلب حدًا أدنى للطلب ${m[1]}`],
  [/^Unknown payment method: (.+)$/, () => 'طريقة الدفع غير معروفة'],
  [/^Counted amount for (\w+) must be a number >= 0$/, () => 'المبلغ المعدود يجب أن يكون رقمًا لا يقل عن صفر'],
  [/^cash_amount \+ card_amount \((.+)\) must equal the payable amount \((.+)\) exactly$/, (m) => `مجموع النقد والبطاقة (${m[1]}) يجب أن يساوي المبلغ المستحق (${m[2]})`],
  [/^(?:seller\.)?vat_number must be 15 digits starting and ending with 3$/, () => 'الرقم الضريبي يجب أن يكون 15 رقمًا يبدأ وينتهي بالرقم 3'],
  [/^(?:seller\.)?building_no must be 4 digits$/, () => 'رقم المبنى يجب أن يكون 4 أرقام'],
  [/^(?:seller\.)?postal_zone must be 5 digits$/, () => 'الرمز البريدي يجب أن يكون 5 أرقام'],
  [/^(?:seller\.)?plot_id must be 4 digits$/, () => 'رقم القطعة يجب أن يكون 4 أرقام'],
  [/^seller\.(\w+ .+)$/, (m) => translateServerMessage(m[1])],
  [/^field_key must be lowercase snake_case.*$/, () => 'مفتاح الحقل يجب أن يكون بأحرف إنجليزية صغيرة وأرقام وشرطة سفلية'],
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

// ---- Items / coupons / rewards (appended) ----
Object.assign(EXACT, {
  'This barcode is already assigned to another item': 'هذا الباركود مستخدم لصنف آخر',
  'This SKU is already used by another item': 'رمز الصنف (SKU) مستخدم لصنف آخر',
  'quantity_in_parent is required and must be > 0 for a non-root level': 'كمية التعبئة داخل المستوى الأب مطلوبة ويجب أن تكون أكبر من صفر',
  'quantity_in_parent must be 1 (or omitted) for the root level': 'كمية المستوى الأساسي يجب أن تكون 1',
  'quantity_in_parent must remain 1 for the root level': 'كمية المستوى الأساسي يجب أن تبقى 1',
  'quantity_in_parent must be > 0': 'كمية التعبئة يجب أن تكون أكبر من صفر',
  'A packaging level with this name already exists for this item': 'يوجد مستوى تعبئة بنفس الاسم لهذا الصنف',
  'Cannot delete a packaging level that has child levels — delete them first': 'لا يمكن حذف مستوى له مستويات فرعية، احذفها أولًا',
  'Cannot delete a packaging level with an assigned barcode — remove the barcode first': 'لا يمكن حذف مستوى مرتبط بباركود، احذف الباركود أولًا',
  'Packaging level does not belong to this item': 'مستوى التعبئة لا يخص هذا الصنف',
  'Invalid coupon code': 'كود الكوبون غير صحيح',
  'This coupon is no longer active': 'هذا الكوبون لم يعد مفعّلًا',
  'This coupon is not valid yet': 'هذا الكوبون غير صالح بعد',
  'This coupon has expired': 'انتهت صلاحية هذا الكوبون',
  'This coupon has reached its usage limit': 'استُنفد عدد استخدامات هذا الكوبون',
  'Percentage discount cannot exceed 100': 'نسبة الخصم لا يمكن أن تزيد عن 100%',
  'valid_to must be on or after valid_from': 'تاريخ نهاية الصلاحية يجب أن يكون بعد تاريخ البداية',
  'code may contain only letters, digits, - and _': 'الكود يقبل أحرفًا إنجليزية وأرقامًا و - و _ فقط',
  'At least one free item is required': 'اختر منتجًا مجانيًا واحدًا على الأقل',
  'category_id is required': 'اختر فئة المنتج',
  'coupon_id is required': 'اختر الكوبون المرتبط',
  'min_order_amount must be between 0 and 1000000': 'الحد الأدنى للطلب يجب أن يكون بين 0 و 1,000,000',
  'Reward definition not found': 'المكافأة غير موجودة',
});
Object.assign(FIELDS, {
  max_discount_amount: 'الحد الأقصى للخصم', max_uses: 'عدد الاستخدامات', standard_cost: 'التكلفة القياسية',
  price_adjustment: 'تعديل السعر', barcode: 'الباركود', level_name: 'اسم المستوى', image_url: 'رابط الصورة',
  count: 'عدد المشتريات', percent: 'النسبة', expiration_days: 'مدة الانتهاء', category_id: 'الفئة',
});
RULES.push(
  [/^This coupon requires a minimum order of (.+)$/, (m) => `يتطلب هذا الكوبون حدًا أدنى للطلب ${m[1]}`],
  [/^(\w+) must be greater than 0$/, (m) => `الحقل ${f(m[1])} يجب أن يكون أكبر من صفر`],
  [/^(\w+) must be a whole number$/, (m) => `الحقل ${f(m[1])} يجب أن يكون عددًا صحيحًا`],
  [/^(\w+) must not be greater than (.+)$/, (m) => `قيمة الحقل ${f(m[1])} أكبر من المسموح (${m[2]})`],
);

// ---- Tables / reservations / wash queue / note presets (appended) ----
Object.assign(EXACT, {
  'A table with this name already exists at this branch': 'توجد طاولة بنفس الاسم في هذا الفرع',
  'Cannot delete a table with an open order': 'لا يمكن حذف طاولة عليها طلب مفتوح',
  'Reservation time cannot be in the past': 'لا يمكن الحجز في وقت مضى',
  'reservation_time must be a valid date': 'وقت الحجز غير صحيح',
  'This table is already reserved around that time': 'الطاولة محجوزة في وقت قريب من هذا الموعد',
  'Only a confirmed reservation can be edited': 'يمكن تعديل الحجز المؤكد فقط',
  'A seated reservation cannot be deleted': 'لا يمكن حذف حجز تم الجلوس عليه',
  'This vehicle is already in the wash queue': 'هذه السيارة موجودة بالفعل في طابور الغسيل',
  'Cannot bill a cancelled job': 'لا يمكن محاسبة مهمة ملغاة',
  'This job is already billed': 'تمت محاسبة هذه المهمة مسبقًا',
  'A note preset with this text already exists': 'توجد ملاحظة جاهزة بنفس النص',
  'text must not be empty': 'أدخل نص الملاحظة',
});
Object.assign(FIELDS, {
  quoted_wait_minutes: 'مدة الانتظار', text: 'النص', order_id: 'الطلب', unit_price: 'سعر الوحدة',
  cash_tendered: 'المبلغ المدفوع نقدًا', cash_amount: 'مبلغ النقد', card_amount: 'مبلغ البطاقة', vehicle_size: 'حجم السيارة',
});
RULES.push(
  [/^Party size exceeds the table capacity \((\d+)\)$/, (m) => `عدد الأشخاص أكبر من سعة الطاولة (${m[1]})`],
  [/^Cannot change a (\w+) reservation to (\w+)$/, () => 'لا يمكن تغيير حالة الحجز إلى هذه الحالة'],
  [/^Cannot cancel an entry with status: .+$/, () => 'لا يمكن إلغاء هذا السجل في حالته الحالية'],
);

// ---- Items / coupons / rewards round 2 (appended) ----
Object.assign(EXACT, {
  'Parent packaging level not found for this item': 'مستوى التعبئة الأب غير موجود لهذا الصنف',
  'Packaging level not found for this item': 'مستوى التعبئة غير موجود لهذا الصنف',
  'Variant not found for this item': 'النوع غير موجود لهذا الصنف',
  'Item not found for this barcode': 'لا يوجد صنف لهذا الباركود',
  'Coupon deleted': 'تم حذف الكوبون',
});

// ---- HR / users / access control (appended) ----
Object.assign(EXACT, {
  'identity_number must contain digits only (4-20)': 'رقم الهوية يجب أن يتكون من أرقام فقط (من 4 إلى 20)',
  'Leave request overlaps an existing request': 'يوجد طلب إجازة آخر يتقاطع مع هذه الفترة',
  'Leave request overlaps an already approved request': 'لا يمكن الاعتماد: توجد إجازة معتمدة تتقاطع مع هذه الفترة',
  'Shift start and end times must be different': 'وقت بداية الوردية يجب أن يختلف عن وقت نهايتها',
  'Shifts must not overlap': 'فترات الدوام لا يجب أن تتداخل',
  'date_to must not be before date_from': 'تاريخ النهاية يجب أن يكون في أو بعد تاريخ البداية',
  'System roles cannot be deleted': 'لا يمكن حذف الأدوار الأساسية للنظام',
  'Leave request not found': 'طلب الإجازة غير موجود',
});
Object.assign(FIELDS, {
  base_salary: 'الراتب الأساسي', grace_period_minutes: 'فترة السماح', late_deduction_value: 'قيمة خصم التأخير',
  late_deduction_mode: 'طريقة خصم التأخير', identity_number: 'رقم الهوية', employee_number: 'رقم الموظف',
  join_date: 'تاريخ بداية العمل', radius_m: 'نصف القطر', center_lat: 'خط العرض', center_lng: 'خط الطول',
  department: 'القسم', job_title: 'المسمى الوظيفي', manager_name: 'المدير المباشر', date_from: 'تاريخ البداية',
  date_to: 'تاريخ النهاية', reason: 'السبب', leave_type: 'نوع الإجازة',
});
RULES.push(
  [/^A role named "(.+)" already exists for this tenant$/, (m) => `يوجد دور بالاسم "${m[1]}" مسبقًا`],
  [/^Cannot delete role "(.+)" . (\d+) user\(s\) are still assigned to it$/, (m) => `لا يمكن حذف الدور "${m[1]}" لأن ${m[2]} مستخدم ما زالوا مرتبطين به`],
);
