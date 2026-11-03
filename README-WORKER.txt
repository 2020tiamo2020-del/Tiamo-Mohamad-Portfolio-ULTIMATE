TIAMO TWIN: LLM بالمجان عبر Cloudflare Workers AI (من غير API key)

الطريقة 1: من لوحة Cloudflare (بدون أوامر)
1) سجّل/ادخل على dash.cloudflare.com ثم: Workers & Pages  ->  Create  ->  Create Worker.
2) سمّيه tiamo-twin واضغط Deploy، بعدها Edit code.
3) امسح الكود الموجود والصق محتوى worker.js كله، واضغط Deploy.
4) ادخل على الـ Worker  ->  Settings  ->  Bindings  ->  Add  ->  Workers AI.
   اكتب اسم المتغير بالظبط:  AI   واحفظ (Deploy تاني لو طلب).
5) انسخ رابط الـ Worker (شكله https://tiamo-twin.XXXX.workers.dev).
6) افتح agent.js وفي أول سطور الملف حط الرابط هنا:
       var WORKER_URL="https://tiamo-twin.XXXX.workers.dev";
   وارفع agent.js على GitHub Pages.

الطريقة 2: بالأوامر
   cd worker  &&  npx wrangler deploy
   (الـ binding موجود في wrangler.toml)

الأمان
- الـ Worker بيقبل طلبات من موقعك بس (2020tiamo2020-del.github.io). لو الدومين اتغير أو عندك دومين خاص،
  ضيفه في Settings -> Variables -> EXTRA_ORIGIN (مثلاً https://tiamo.com) أو عدّل قايمة ORIGINS في الأول.
- فيه حد 12 رسالة في الدقيقة لكل زائر (تقريبي). مفيش مفتاح سري في الصفحة.
- ده مش حماية مطلقة: أي حد يقدر يقلّد الـ Origin من برا المتصفح، فالحد اليومي المجاني هو شبكة الأمان.

الاستهلاك
- الخطة المجانية: 10,000 Neurons يوميًا، وبتتصفّر 00:00 UTC. لو خلصت الرسائل بتفشل والوكيل يرجع للأوامر العادية.
- تقديري: الرد الواحد بالموديل ده حوالي 25 Neuron، يعني تقريبًا 300 إلى 400 رد في اليوم.
- الموديل gemma-3-12b-it. لتغييره عدّل MODEL في worker.js (راجع قايمة الموديلات في Workers AI).
- تابع الاستهلاك من dash.cloudflare.com  ->  AI  ->  Workers AI.

اللي الوكيل بيعمله بالـ LLM
- بيرد على أي سؤال حر عن تيامو وشغله، ويقدر ينفّذ أوامر على الصفحة: ينقلك لقسم، يغيّر مود الموقع، يشغّل الموسيقى، أو يعرض زر واتساب.
- الأوامر السريعة (مود، قبل/بعد، Roast، كاميرا...) لسه بتتنفذ فورًا من غير ما تستهلك رصيد.
