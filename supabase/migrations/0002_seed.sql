-- ===========================================================================
-- Eta platform — seed content
-- Six curated, approved innovations so the platform is populated at launch.
-- Delete or replace these once real submissions arrive.
-- ===========================================================================

insert into public.projects
  (name, name_ar, description, description_ar, field, stage, classification, status,
   impact, sustainability, carbon, water_saved, energy_generated, author_name,
   verified, has_documents, video_url, likes, views)
values
  ('Solar Energy Harvester', 'حاصد الطاقة الشمسية',
   'Advanced solar panel technology with 45% efficiency improvement over traditional panels.',
   'تقنية ألواح شمسية متطورة مع تحسين كفاءة بنسبة 45٪ مقارنة بالألواح التقليدية.',
   'Clean Energy', 'Production', 'Official', 'approved',
   92, 95, 2400, 15000, 3500, 'Dr. Sarah Chen', true, true, null, 234, 4200),

  ('Bio-Plastic Alternative', 'بديل البلاستيك الحيوي',
   'Fully biodegradable plastic made from agricultural waste, decomposes in 60 days.',
   'بلاستيك قابل للتحلل بالكامل من النفايات الزراعية، يتحلل في 60 يومًا.',
   'Materials Science', 'Pilot Testing', 'Safe', 'approved',
   88, 90, 1800, 8000, 0, 'Ahmed Al-Rashid', true, true, null, 189, 3100),

  ('Carbon Capture Filter', 'مرشح التقاط الكربون',
   'Innovative air filtration system that captures and converts CO2 into useful materials.',
   'نظام ترشيح هواء مبتكر يلتقط ويحول CO2 إلى مواد مفيدة.',
   'Environmental Tech', 'Research', 'Experimental', 'approved',
   95, 98, 5200, 0, 0, 'Maria Garcia', true, true, null, 412, 6800),

  ('Smart Grid AI', 'الذكاء الاصطناعي للشبكة الذكية',
   'Machine learning system optimizing energy distribution and reducing waste by 35%.',
   'نظام تعلم آلي لتحسين توزيع الطاقة وتقليل الهدر بنسبة 35٪.',
   'AI & Energy', 'Production', 'Official', 'approved',
   85, 80, 3100, 0, 2800, 'James Kim', false, false, null, 298, 5100),

  ('Ocean Cleanup Drone', 'طائرة بدون طيار لتنظيف المحيطات',
   'Autonomous underwater drone collecting microplastics and marine debris.',
   'طائرة بدون طيار تحت الماء تجمع البلاستيك الدقيق والحطام البحري.',
   'Ocean Conservation', 'Field Testing', 'Undocumented', 'approved',
   78, 85, 950, 0, 0, 'Lin Wei', true, true, null, 567, 8900),

  ('Vertical Farm System', 'نظام المزرعة العمودية',
   'Modular vertical farming solution using 90% less water and zero pesticides.',
   'حل زراعة عمودي معياري يستخدم 90٪ أقل من الماء وبدون مبيدات.',
   'Agriculture', 'Production', 'Official', 'approved',
   82, 88, 1350, 45000, 0, 'Priya Patel', true, true, null, 345, 4600)
on conflict do nothing;
