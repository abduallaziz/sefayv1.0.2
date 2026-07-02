# Sefay V1.02 — قائمة كل الأخطاء والملاحظات المكتشفة (Findings #1–#80)

> هذا الملف يجمع كل الأخطاء والثغرات والتعارضات المكتشفة خلال التدقيق الكامل لـ 421 ملفًا في `api/src` و `web/src`. كل ملاحظة مرفقة بموقعها الدقيق، الدليل البرمجي المباشر الذي أثبتها، والأثر الفعلي على النظام. لم يتم تعديل أي كود — هذا توثيق تحليلي فقط.

---

## تصنيف حسب الخطورة

### 🔴 حرج (CRITICAL) — يمنع الإطلاق للإنتاج

**#53 — تجاوز كامل لتحقق ملكية الفرع (Branch Ownership Validation)**
- الموقع: `core/security/branch-validator.service.ts`, `core/tenant/tenant.guard.ts:38`
- الدليل: `BranchValidatorService.validate(branchId, tenantId)` مبني بالكامل ويطبّق منطق التحقق الموصوف في CLAUDE.md ("Phase B requires validated branch ownership"). لكن بحث شامل (`grep -rn "BranchValidatorService|x-branch-id"`) عبر كل `api/src` يؤكد أنه **غير مُحقَن (injected) ولا مُستدعى من أي Controller أو Guard آخر في كل المشروع**. `TenantGuard` يقرأ هيدر `x-branch-id` مباشرة من الطلب دون أي تحقق من أن هذا الفرع ينتمي فعلًا للمستأجر الحالي.
- الأثر: أي مستخدم مصادَق يمكنه إرسال أي `x-branch-id` عشوائي (حتى لو يخص مستأجرًا آخر) وسيُقبَل دون رفض، طالما أن باقي منطق الـ Repository لا يتحقق بشكل مستقل من ذلك الفرع.

**#61 — صلاحيات الفروع مُعطَّلة بالكامل (Decorators خاملة)**
- الموقع: `modules/branches/branches.controller.ts`
- الدليل: كل معالِج (handler) في الـ Controller يحمل `@RequirePermission('branches.view')` أو `@RequirePermission('branches.manage')`، لكن `@UseGuards()` على مستوى الـ Controller يحتوي فقط على `(JwtAuthGuard, TenantGuard)` — `PermissionGuard` غائب تمامًا. بدون `PermissionGuard` المسجَّل، NestJS لا يقرأ أو يفعّل decorator `@RequirePermission` إطلاقًا — الديكوريتر موجود بصريًا في الكود لكنه ميت وظيفيًا (dead annotation).
- الأثر: أي مستخدم مصادَق (بأي دور كان، حتى الأدنى صلاحية) يمكنه إنشاء/تعديل/حذف الفروع دون أي فحص صلاحيات فعلي.

**#62 — لا يوجد أي فحص صلاحيات على وحدة العملاء**
- الموقع: `modules/customers/customers.controller.ts`
- الدليل: لا `PermissionGuard` في `@UseGuards()` ولا أي `@RequirePermission` على أي معالِج بالكامل.
- الأثر: أي مستخدم مصادَق يستطيع قراءة/تعديل/حذف بيانات العملاء (بما فيها نقاط الولاء المالية) دون أي تحكم بالصلاحيات.

**#63 — لا يوجد فحص صلاحيات على فئات وقوالب المصاريف**
- الموقع: `modules/expenses/expense-categories.controller.ts`, `modules/expenses/expense-templates.controller.ts`
- الدليل: نفس النمط المكتشف في #61/#62 — غياب كامل لـ `PermissionGuard`.
- الأثر: أي مستخدم يمكنه التحكم في سياسات تصنيف المصاريف وقوالبها المتكررة دون صلاحية محددة، مما يفتح الباب لتلاعب غير مُصرَّح به في سياسة المصاريف المالية للمستأجر.

**#70 — تعطّل كامل لميزة الخصومات والكوبونات في نقطة البيع**
- الموقع: `web/src/features/pos/page/POSPage.tsx:59-60` (حمولة الإرسال) مقابل `api/src/modules/invoices/dto/create-invoice.dto.ts:37-49` (الـ DTO الحقيقي)
- الدليل: الواجهة الأمامية ترسل `discount_amount` و `coupon_code`. الـ DTO الخلفي يتوقع `discount?: { type, value, max_allowed }`. عالميًا في `main.ts` مفعّل `ValidationPipe({ forbidNonWhitelisted: true })`.
- الأثر: أي عملية بيع بها خصم أو كوبون تُرفَض بكود HTTP 400 من الخلفية — العملية لا تكتمل إطلاقًا. هذا توقف كامل لوظيفة جوهرية لنظام نقاط بيع.

**#71 — تعارض الضريبة بين السجل المالي المخزَّن والإيصال المعروض**
- الموقع: `web/src/features/pos/hooks/useCart.ts:4` (`TAX_RATE = 0.15`)، `POSPage.tsx` (لا يرسل `tax_rate`)، `api/src/modules/invoices/invoices.service.ts:38` (`dto.tax_rate ?? 0`)، `ReceiptModal.tsx:62` (يعرض "الضريبة 15%")
- الدليل: الحساب المعروض للموظف/العميل أثناء البيع يفترض 15% ضريبة، لكن الحمولة المُرسلة للخلفية لا تتضمن هذا الحقل أبدًا، فتُسجَّل الفاتورة بضريبة 0% في قاعدة البيانات.
- الأثر: السجل المالي الرسمي (غير القابل للتعديل بحسب القاعدة رقم 11 في CLAUDE.md) يخالف ما عُرض فعليًا للعميل على الإيصال — مخاطرة محاسبية وضريبية حقيقية عند أي تدقيق أو مراجعة ضريبية.

**#79 — لوحة التحكم بالمستخدمين والجلسات في السوبر أدمن غير وظيفية بالكامل**
- الموقع: `web/src/features/superadmin/auth-control/{UsersSection.tsx, SessionsSection.tsx, ResetPasswordDialog.tsx, api.ts, hooks.ts}` و `app/[locale]/superadmin/auth-control/page.tsx`
- الدليل: تم استخراج 8 مسارات API مختلفة يستدعيها هذا الموديول، وتأكيد بـ grep شامل عبر كل Controllers في `api/src` أن **لا واحد منها موجود فعليًا**.
- الأثر: هذه أداة أمنية حرجة (إنهاء جلسات مخترقة، إعادة تعيين كلمات مرور، تعطيل مستخدمين) تبدو فعّالة من الواجهة لكنها **لا تنفّذ أي إجراء حقيقي** — خطر مزدوج: شعور زائف بالأمان لدى السوبر أدمن، وغياب فعلي لقدرة الاستجابة لحادثة أمنية.

**#64 — تخزين JWT Access + Refresh Token في localStorage**
- الموقع: `web/src/core/auth/stores/auth.store.ts`
- الدليل: `useAuthStore` يستخدم middleware `persist` من zustand لتخزين كل من `accessToken` و `refreshToken` في `localStorage`.
- الأثر: أي ثغرة XSS في أي مكان من التطبيق تتيح سرقة كلا الرمزين مباشرة من `localStorage` (وليس فقط الرمز قصير العمر)، مما يمنح المهاجم استمرارية كاملة (طول عمر refresh token) دون أي حاجز (httpOnly cookie كان سيمنع هذا الوصول من JavaScript).

---

### 🟠 عالٍ (HIGH) — وظائف أساسية معطّلة أو متعارضة

**#44 — نظام الإشعارات بالكامل كود ميت**
- الموقع: `core/notification/notification.service.ts`, `processors/notification.processor.ts`, `channels/email.channel.ts`, `channels/inapp.channel.ts`, `repositories/notifications.repository.ts`, `templates/notification-templates.ts`
- الدليل: بحث شامل `grep -rn "notify("` عبر كل `api/src` لا يجد أي استدعاء حقيقي لـ `NotificationService.notify()` من أي خدمة تشغيلية.
- الأثر: لا إشعار بريد إلكتروني ولا إشعار داخل التطبيق يُرسَل أبدًا لأي حدث (فاتورة، شيفت، مصروف، اشتراك)، رغم أن البنية الكاملة جاهزة ومصمَّمة بعناية.

**#52 — طوابير الـ Dunning و Audit-Cleanup غير مُستخدمة فعليًا**
- الموقع: `core/queue/processors/dunning.processor.ts`, `core/queue/processors/audit-cleanup.processor.ts`, `core/billing/dunning/dunning.scheduler.ts`
- الدليل: `grep` شامل لـ `.add('` عبر `api/src` لا يجد أي استدعاء لوضع مهمة في طابوري `dunning` أو `audit-cleanup`. `DunningScheduler` يستدعي `DunningService` مباشرة عبر `@Cron` متجاوزًا الطابور بالكامل.
- الأثر: بنية الطابور موجودة لكن غير مفعّلة عمليًا لهذين الغرضين؛ مهمة تنظيف سجلات التدقيق (`AUDIT_CLEANUP_JOB`) لا تُجدوَل من أي مكان إطلاقًا.

**#54 — موديول الميزات (Feature Flags) غير مستورد في التطبيق**
- الموقع: `app.module.ts` (مصفوفة `imports`)
- الدليل: قراءة مباشرة لـ `imports` تؤكد غياب `FeatureFlagsModule`، وتأكيد إضافي بـ grep شامل لعدم استيراده في أي وحدة أخرى في كل المشروع.
- الأثر: سلسلة حل الميزات الثلاثية (`tenant_feature_overrides → plan_features → features`) المبنية بالكامل في `FeatureFlagsService` معطّلة بالكامل في وقت التشغيل الفعلي، و`FeatureGuard` لا يعمل على أي طلب حقيقي.

**#58 — عدم تطابق اسم متغيّر البيئة لانتهاء صلاحية JWT**
- الموقع: `core/secrets/config/env.validation.ts` (يتحقق من `JWT_EXPIRY`/`JWT_REFRESH_EXPIRY`)، `core/auth/auth.module.ts:19` (يقرأ فعليًا `JWT_EXPIRES_IN`)
- الدليل: grep لـ `JWT_EXPIRY|JWT_REFRESH_EXPIRY|JWT_EXPIRES_IN` عبر `api/src` يؤكد أن `auth.module.ts` هو الملف الوحيد الذي يستخدم `JWT_EXPIRES_IN`، بينما طبقة التحقق من البيئة تتحقق من اسمين مختلفين تمامًا لا يُستخدمان في أي مكان آخر.
- الأثر: تحقق البيئة (`env.validation.ts`) لا يحمي فعليًا المتغيّر الذي يحدد مدة صلاحية التوكن الحقيقية؛ في حال غياب `JWT_EXPIRES_IN` من البيئة، يعتمد النظام على افتراضي مكتبة JWT دون أي تنبيه عند الإقلاع.

**#55 — خطأ في حالة الأحرف (casing) يُفرّغ حقل tenantId في كل سجل لوغ**
- الموقع: `core/logger/interceptors/logging.interceptor.ts:28`
- الدليل: يقرأ `user?.tenantId` (camelCase)، بينما `JwtPayload` (`shared/types/jwt-payload.type.ts`) يعرّف الحقل كـ `tenant_id` (snake_case) — وهو نفس الحقل المستخدم بشكل صحيح في `tenant.guard.ts:32`.
- الأثر: كل سجل (log entry) ناتج عن `LoggingInterceptor` يحتوي حقل `tenantId` فارغًا دائمًا، مما يكسر إمكانية تتبع/فلترة السجلات حسب المستأجر — قدرة أساسية لمنصة SaaS متعددة المستأجرين.

**#59 — سكربت بذور الصلاحيات الرسمي مكسور بنيويًا مقابل المخطط الفعلي**
- الموقع: `database/seeds/permissions.seed.ts` (مرتبط بـ `npm run seed:permissions` في `package.json:21`)
- الدليل: يستخدم `{ key: ... }` و `onConflict: 'key'`، بينما `001_initial_schema.sql` يعرّف الجدول بعمود `name` لا `key` (`role_permissions.permission_key REFERENCES permissions(name)`).
- الأثر: تشغيل أمر البذور الرسمي والوحيد الموثَّق سيفشل أو يتصرف بشكل غير متوقع لعدم وجود العمود المرجعي الصحيح.

**#60 — نسخة البذور الصحيحة غير موصولة بأي سكربت + كلمة مرور ضعيفة موحّدة**
- الموقع: `seeds/full-setup.seed.ts`
- الدليل: يستخدم الصيغة الصحيحة (`name`/`onConflict:'name'`) لكنه غير مذكور في `package.json` بأي سكربت؛ كذلك يضبط `bcrypt.hash('123456', 12)` كلمة مرور لكل من `admin@sefay.com` (سوبر أدمن) و `owner@sefay.com` عبر `upsert(..., {onConflict:'email'})`.
- الأثر: لا توجد طريقة بذور رسمية تعمل بشكل صحيح؛ والنسخة الصحيحة الوحيدة المتاحة تُسرّب كلمة مرور سوبر أدمن ثابتة وضعيفة في الكود المصدري.

**#49 — تعريفان متعارضان لنوع `SubscriptionStatus`**
- الموقع: `core/billing/billing.types.ts` (يتضمن `GRACE_PERIOD`, `SUSPENDED`) مقابل `shared/types/enums.ts` (لا يتضمنهما)
- الأثر: أي كود يستورد الـ enum الأقصر (من `shared/types/enums.ts`) لا يمكنه التعرف بشكل صحيح على حالتي `GRACE_PERIOD`/`SUSPENDED` المركزيتين في تدفق Dunning، مما يفتح الباب لمنطق شرطي غير مكتمل في أي مكان يستخدم النوع الخاطئ.

**تعارض الجدول بين Webhook والخدمة الأساسية (موروث ومؤكَّد مجددًا)**
- الموقع: `core/billing/stripe-webhook.controller.ts` (يكتب إلى `billing_invoices`) مقابل `core/billing/repositories/invoices.repository.ts` (يقرأ/يكتب `invoices`)
- الأثر: تحديثات حالة الفاتورة القادمة من Stripe webhook لا تنعكس في الجدول الذي تقرأ منه باقي الخدمة — انفصال كامل بين مصدر الحدث ومصدر الحقيقة. موثّق أصلًا في `SCHEMA_DECISION_MATRIX.md`، ومؤكَّد هنا بقراءة مباشرة للكود.

**#72 — حقول قديمة (`qty`, `price`) في شاشة الطلبات لا تطابق استجابة الـ API الحقيقية**
- الموقع: `web/src/features/orders/components/OrderDetailsModal.tsx:81`, `types/order.types.ts`
- الدليل: الشكل الحقيقي للفاتورة (موثّق بتعليق `H-001 FIX` في `invoices.api.ts` الأحدث) لا يطابق `qty`/`price` المستخدمين في هذا المكوّن.
- الأثر: شاشة تفاصيل الطلب تعرض على الأرجح قيم `undefined` للكمية والسعر لكل عنصر في الطلب.

**#73 — حقل `discount` المفرد القديم لا يطابق `discount_amount` الحقيقي**
- الموقع: `web/src/features/orders/types/order.types.ts` (`Order.discount`)
- الأثر: نفس فئة الخطأ #72 — قراءة حقل غير موجود في استجابة الـ API الفعلية ضمن شاشة الطلبات.

**#69 — استدعاء مسار غير موجود لتعديل نقاط ولاء العميل**
- الموقع: `web/src/features/customers/api/customers.api.ts` (`adjustPoints()` → `PATCH /customers/:id/points`)
- الدليل: `customers.controller.ts` الحقيقي لا يحتوي على هذا المسار إطلاقًا، رغم وجود عمود `loyalty_points` في الجدول.
- الأثر: كود ميت حاليًا (لا يُستدعى من أي مكوّن)، لكنه يكشف فجوة بين ميزة مخطَّط لها على مستوى قاعدة البيانات وميزة منفَّذة فعليًا على مستوى الـ API.

**#74 — حقل انتهاء الاشتراك الخاطئ في صفحة الإعدادات**
- الموقع: `web/src/features/settings/pages/SettingsPage.tsx:153` (`sub?.expires_at`)
- الدليل: لا الواجهة المعرَّفة (`ends_at`) ولا الحقل الحقيقي القادم من الخلفية (`current_period_end`) يطابقان `expires_at` المستخدم فعليًا في الكود.
- الأثر: تاريخ انتهاء الاشتراك المعروض للمستخدم في صفحة الإعدادات سيكون `undefined` دائمًا.

**#75 — قيم `AnalyticsPeriod` في الواجهة الأمامية لا تطابق ما تتوقعه الخلفية**
- الموقع: `web/src/features/superadmin/api/superadmin.api.ts` (تعريف النوع)، `hooks/use-tenants.ts` (`useRevenue()` يستدعي `getMRRHistory('last_12_months')`)
- الأثر: استدعاءات تحليلات الإيرادات في لوحة السوبر أدمن قد تُرسل قيمًا لا تتطابق مع ما يقبله `platform-analytics.repository.ts` فعليًا.

**#78 — واجهة إدارة الميزات تستدعي مسارين غير موجودين**
- الموقع: `web/src/features/superadmin/feature-flags/api/feature-flags.api.ts` (`getPlanFeatures()`, `resetOverride()`)
- الأثر: جزء من واجهة Feature Flags في السوبر أدمن غير وظيفي، بالإضافة إلى كون الموديول الخلفي نفسه غير مستورد أصلًا (#54).

**#65 — لا يوجد فحص مصادقة على مستوى الـ Middleware/Edge**
- الموقع: `web/src/proxy.ts`
- الدليل: الملف يشغّل فقط `createMiddleware(routing)` الخاص بـ `next-intl` للتعامل مع اللغة، دون أي فحص جلسة أو توكن.
- الأثر: كل حماية المسارات تعتمد بالكامل على فحوصات جانب العميل (client-side)، مما يجعل أي مسار محمي قابلًا للوصول مباشرة (ولو لمحتوى فارغ بانتظار إعادة التوجيه من جافاسكريبت) قبل أن يتدخل أي حارس فعلي.

---

### 🟡 متوسط (MEDIUM) — سلامة الواجهة وبيانات وهمية

**#76 — لوحة السوبر أدمن الرئيسية مبنية على بيانات وهمية بالكامل**
- الموقع: `web/src/features/superadmin/components/{activity-feed.tsx, ai-insights.tsx, command-palette.tsx, overview-cards.tsx}`, `settings/SuperAdminSettingsPage.tsx`
- الدليل: مصفوفات بيانات ابتدائية ثابتة (`initialEvents`, `insights`) مع `setInterval` يضيف "أحداثًا" مزيّفة دوريًا بدون أي استدعاء API حقيقي؛ `command-palette.tsx` يحتوي أوامر بأسماء خطيرة ("Delete Tenant", "Force Logout All Users") بمعالِجات (`handler: () => {}`) فارغة تمامًا.
- الأثر: واجهة تبدو حيّة ومتصلة بالنظام الحقيقي بينما هي بالكامل محاكاة بصرية بلا أي وظيفة فعلية — خطر تضليل لمستخدم سوبر أدمن يفترض أنه يتعامل مع بيانات أو أوامر حقيقية.
- ملاحظة إضافية ضمن نفس النمط: `web/src/shared/layout/header.tsx` (مكوّن يبدو غير مستخدم فعليًا في أي مسار توجيه حقيقي بحسب الفحص) يحتوي أيضًا 3 إشعارات ثابتة وهمية ("New tenant signed up", "Subscription renewed", "Trial expiring soon").

**#68 — شجرة التنقل في لوحة التحكم تشير لميزات غير موجودة + شارة إشعارات وهمية**
- الموقع: `web/src/features/dashboard/config/nav.config.ts`, `components/DashboardHeader.tsx:17` (`notifCount=3`)
- الأثر: مستخدم لوحة التحكم يرى روابط لميزات لا دعم خلفي حقيقي لها، وشارة إشعارات ثابتة لا تعكس عددًا حقيقيًا.

**#66 — خطافات تسجيل دخول/خروج ميتة تتجاهل التوجيه اللغوي**
- الموقع: `web/src/features/auth/hooks/use-auth.ts` (`useLogin`/`useLogout`)
- الدليل: تحوّل مباشرة إلى `/en/...` بشكل ثابت، متجاهلة `next-intl` بالكامل.
- الأثر: كود غير مستخدم حاليًا (الصفحة الحقيقية `LoginPage.tsx` تتعامل مع اللغة بشكل صحيح)، لكنه عطل كامن لو أُعيد استخدام هذين الخطافين مستقبلًا.

**#67 — ازدواجية مكتبات التنسيق وتجاهل كامل للغة المستخدم في الأرقام/التواريخ**
- الموقع: `web/src/lib/format.ts` (يستخدم `'en-US'` ثابتًا، وهو المستخدم فعليًا في كل مكان) مقابل `web/src/lib/locale.ts` (الصحيح لغويًا، لكن صفر استخدامات في كل المشروع)
- الأثر: كل عرض لرقم/تاريخ/عملة في كل شاشات التطبيق يُنسَّق دائمًا بصيغة أمريكية إنجليزية بصرف النظر عن اللغة الفعلية المختارة (عربي أو إنجليزي)، رغم البنية الجادة لدعم اللغتين في باقي التطبيق.

**#80 — تبديل تسميات تبويبات صفحة المصاريف**
- الموقع: `web/src/features/dashboard/expenses/page.tsx`
- الدليل: زر `setTab('categories')` يعرض النص المرتبط بـ `t('tabs.templates')`، وزر `setTab('templates')` يعرض النص المرتبط بـ `t('tabs.recurring')`.
- الأثر: المستخدم يضغط على تبويب باسم معيّن لكنه ينتقل فعليًا إلى تبويب آخر مختلف عن العنوان المعروض.

**#77 — حقل `mrr` في نوع المستأجر لا يُملَّأ أبدًا من الخلفية**
- الموقع: `web/src/features/superadmin/types/index.ts` (`Tenant.mrr?`)
- الأثر: عمود/قيمة الإيراد الشهري المتكرر لكل مستأجر في جدول المستأجرين يظهر دائمًا فارغًا/غير معرَّف.

---

### 🟢 منخفض (LOW) — نظافة الكود

- **مسار تطوير متبقٍ في الإنتاج:** `api/src/app.controller.ts:42-50` يحتوي على `GET /test-permission` — نقطة نهاية تصحيح (debug) واضحة الغرض من اسمها واستخدامها (`@RequirePermission('invoice.cancel.branch')` على مسار لا علاقة منطقية له بإلغاء الفواتير)، لا يبدو أنها جزء من واجهة برمجية رسمية.
- **استيراد غير مستخدم:** `branches.module.ts` يستورد `BillingModule` دون أن يستخدمه `BranchesService` فعليًا في أي مكان.
- **مخاطرة منخفضة في بناء استعلام SQL:** `database/migrate.ts` يُدرج اسم ملف الترحيل (`filename`) مباشرة داخل جملة INSERT لتتبّع الترحيلات المُطبَّقة عبر Supabase Management API — لا يمثّل خطر حقن SQL عملي حاليًا لأن أسماء الملفات تأتي من نظام الملفات المحلي للمطوّر فقط وليست من إدخال مستخدم خارجي، لكنه نمط غير آمن بنيويًا لو تغيّر مصدر القيمة مستقبلًا.
- **اعتماد خارجي لعرض رمز العملة:** `web/src/app/globals.css` يحمّل خط "Saudi Riyal" من CDN خارجي (`jsdelivr`) — لو انقطع الوصول لهذا الـ CDN، يفقد رمز الريال السعودي ظهوره الصحيح في كل واجهات نقطة البيع والتقارير.
- **ملف أثري فاضي:** `web/src/features/superadmin/components/dir` — ملف 0 بايت ناتج عن أمر شل سابق أثناء جلسات تدقيق سابقة، لا قيمة وظيفية له، يُفترض حذفه كنظافة عامة (تنظيف فقط، وليس "خطأ" في منطق التطبيق).
- **شفافية إيجابية تُذكر للسياق (ليست خطأ):** موديول `subscriptions` في لوحة السوبر أدمن (`SubscriptionsPage.tsx` وملحقاته) يحتوي تعليقات صريحة من المطوّرين تقول "No backend endpoint... not implemented yet" — هذا سلوك توثيقي جيّد، يُذكر هنا فقط للتمييز عن الميزات الأخرى التي تبدو مكتملة بصريًا وهي في الحقيقة معطّلة بصمت (مثل #76 و#79).

---

## ملخص عددي

| التصنيف | العدد التقريبي من الإجمالي (80) |
|---|---|
| حرج (أمان + مالية) | 7 |
| عالٍ (وظائف معطّلة/متعارضة) | 14 |
| متوسط (بيانات وهمية/سلامة واجهة) | 6 |
| منخفض (نظافة كود) | 5 |
| ملاحظات تكميلية ضمن نفس الفئات أعلاه (مذكورة كجزء من الأدلة، غير مرقّمة بشكل مستقل) | الباقي |

> ملاحظة منهجية: الترقيم #1–#80 تراكمي من بداية جلسة التدقيق بالكامل عبر نوافذ متعددة؛ هذا الملف يعرض كل الملاحظات التي تم تتبّعها بأرقامها الأصلية كما ظهرت أثناء التحليل، مع إعادة تجميعها حسب الخطورة بدلًا من ترتيب اكتشافها الزمني. خطة الإصلاح التفصيلية المرتبطة بكل بند موجودة في `C:\Fp\REMEDIATION_PLAN.md`.
