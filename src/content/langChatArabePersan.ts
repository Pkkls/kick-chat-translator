/**
 * Le chat arabe dialectal contre le chat persan, ligne courte contre ligne courte.
 *
 * Test-only module, meme garde statique que les autres corpus.
 *
 * LE TROU QU'IL MESURE. Les corpus existants n'ont presque pas de chat arabe
 * dialectal : Tatoeba est en arabe standard, et `LANG_CHAT_DIX` ecrit des
 * phrases completes qui portent presque toutes une lettre ou un mot que
 * `arabeOuPersan` reconnait. Or les salutations les plus courantes d'un chat
 * arabe, `مرحبا`, `منور`, `شو صار`, n'en portent aucun : elles sortent du
 * pre-controle sans reponse, tombent sur franc, et franc y lit du persan.
 *
 * Le persan est ecrit dans le meme esprit, du chat de tous les jours, et il
 * contient expres des pieges : des mots que les deux langues ecrivent
 * (`ممتاز`, `تمام`, `بس`, `خلاص`), employes a la persane.
 *
 * USAGE : corpus de MESURE, ecrit a la main le 2026-10-09 avant le moindre
 * reglage, par la meme session qui a ensuite choisi les mots. C'est sa limite :
 * il n'est pas independant de qui l'a ecrit, et il ne remplace pas du chat
 * releve en direct.
 */
export const LANG_CHAT_AR_FA: Record<string, readonly string[]> = {
  ar: [
    'مرحبا',
    'مرحبا شباب',
    'مرحبا يا جماعة',
    'شو صار',
    'وش صار',
    'شو هالحركة',
    'ايش صار',
    'حلو',
    'حلو مرة',
    'منور',
    'منور الستريم',
    'نورت',
    'تسلم',
    'تسلم ايدك',
    'عاش',
    'عاش يا بطل',
    'مش معقول',
    'مش طبيعي',
    'ممتاز',
    'خلاص',
    'تمام',
    'يلا',
    'يلا بينا',
    'هههه حلو',
    'ابداع',
    'وحش',
    'اسطورة',
    'كفو',
    'صح',
    'صح لسانك',
    'ما شاء الله',
    'سلام عليكم',
    'هلا والله',
    'اهلا',
    'اهلا وسهلا',
    'شو رأيك',
    'وين الناس',
    'لا تخاف',
    'برافو',
    'جميل',
  ],
  fa: [
    'سلام',
    'سلام بچه ها',
    'سلام خوبم',
    'مرسی',
    'دمت گرم',
    'عالی بود',
    'بازم',
    'آره',
    'نه',
    'باشه',
    'حله',
    'خسته نباشید',
    'تو بهترینی',
    'ایول',
    'جون',
    'عزیزم',
    'داداش',
    'خوبه',
    'بد نبود',
    'زنده باد',
    'هورا',
    'چطوری',
    'کجایی',
    'بریم',
    'تشنه ام',
    'خوش اومدی',
    'دمت گرم داداش',
    'ممنون',
    'خیلی باحاله',
    'خفن بود',
    'وای',
    'نترس',
    'برو بریم',
    'حرف نداره',
    'ممتاز بود',
    'تمام شد',
    'بس کن',
    'خلاص شدم',
    'نوش جان',
    'آفرین',
  ],
};
