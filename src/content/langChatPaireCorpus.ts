/**
 * Le corpus de la PAIRE : malais et indonesien, et rien d'autre.
 *
 * Test-only module, comme les quatre autres corpus, meme garde statique dans
 * `langMatrix.test.ts`.
 *
 * POURQUOI CELUI-CI EXISTE, et c'est le seul point de la file de travail qui
 * demandait d'ecrire un corpus plutot que du code.
 *
 * `id -> ms` et `ms -> id` valent 45 et 33 lignes sur le chemin brut, le plus
 * gros bloc de confusion restant, plus gros que les deux paires scandinaves
 * reunies. Six passes de regles n'y ont rien fait, et la raison est ecrite
 * depuis longtemps dans `langDetect.ts` : la prose de Tatoeba dans ces deux
 * langues est ecrite presque entierement avec ce qu'elles PARTAGENT, et ce qui
 * les separe vit dans le registre familier.
 *
 * Or le registre familier, aucun corpus ne l'avait pour elles. Les trois corpus
 * de chat sont des traductions PARALLELES : dix phrases, vingt-six langues,
 * donc dix lignes malaises et dix indonesiennes, et ce sont les memes dix
 * phrases traduites. Deux langues qui se ressemblent traduisent une meme phrase
 * neutre de la meme facon, donc ce corpus-la ne pouvait pas les separer par
 * construction.
 *
 * Celui-ci n'est PAS parallele. Chaque langue a ses trente lignes, ecrites dans
 * son propre registre, sans equivalent de l'autre cote. C'est ce que le
 * parallelisme interdisait.
 *
 * SON ROLE : il MESURE, il ne regle pas. Les lignes ont ete ecrites et le
 * fichier commite AVANT de regarder ce que le detecteur en fait, comme le
 * corpus 2. Le jour ou quelqu'un lit ses lignes muettes pour y choisir un mot,
 * il cesse d'etre une mesure et il en faut un autre. Regle des trois corpus,
 * section 2ter du handoff.
 *
 * AUCUNE LIGNE N'EST PARTAGEE ENTRE LES DEUX LANGUES, et c'est verifie par le
 * test : une ligne identique des deux cotes rendrait une des deux reponses
 * fausse quoi qu'il arrive, ce qui mesurerait le corpus et non le detecteur.
 *
 * SUJETS, choisis hors de ceux des trois autres corpus, qui parlent de stream,
 * de moderation, d'emotes, de musique, de camera, de meteo et de repas : le
 * sommeil, le travail, le telephone, le transport, les prix, la famille, les
 * cours, l'attente. Memes conventions partout : pas d'emoji, pas de nom de
 * chaine ni de streamer, pas de rire seul, qui serait filtre avant le detecteur.
 */
export const LANG_CHAT_PAIRE: Record<string, readonly string[]> = {
  // Malais. Registre familier malaisien : aku/kau, korang, tak, dah, je, jom,
  // nak, sikit, kot, weh, macam mana.
  ms: [
    'aku nak tidur dah',
    'korang semua dah makan ke',
    'internet aku slow gila',
    'esok aku kerja pagi',
    'bateri telefon aku nak habis',
    'jom main sama sama',
    'mahal sangat harga tu',
    'aku tengah tunggu bas',
    'kau duduk kat mana sekarang',
    'dah lama tak jumpa korang',
    'jalan jam teruk petang ni',
    'adik aku pun tengok sama',
    'nanti aku balik lambat',
    'sedap betul nasi lemak ni',
    'aku tak faham apa dia cakap',
    'boleh ulang sekali lagi tak',
    'memang best kalau macam tu',
    'kenapa senyap je semua orang',
    'aku baru habis kelas',
    'kau ada nombor dia tak',
    'cuaca panas sangat hari ini',
    'dia dah tidur kot',
    'aku nak keluar sekejap',
    'tunggu jap aku datang',
    'harga naik lagi weh',
    'siapa nak ikut aku',
    'aku rasa dia betul',
    'tak payah susah susah',
    'esok cuti ke tidak',
    'aku dah lapar sangat ni',
  ],
  // Indonesien. Registre familier de Jakarta : gue/lo, banget, nggak/gak, udah,
  // aja, nih, dong, sih, kayak, emang, bener, bentar.
  id: [
    'gue mau tidur nih',
    'kalian udah pada makan belum',
    'internet gue lemot banget',
    'besok gue kerja pagi',
    'baterai hape gue mau habis',
    'ayo main bareng bareng',
    'mahal banget harganya',
    'gue lagi nunggu bus',
    'lo tinggal di mana sekarang',
    'udah lama gak ketemu kalian',
    'macet parah sore ini',
    'adik gue juga nonton',
    'nanti gue pulang telat',
    'enak banget nasi goreng ini',
    'gue gak ngerti dia ngomong apa',
    'bisa diulang sekali lagi gak',
    'emang keren kalau kayak gitu',
    'kenapa pada diem semua',
    'gue baru selesai kelas',
    'lo punya nomor dia gak',
    'panas banget cuacanya hari ini',
    'kayaknya dia udah tidur',
    'gue mau keluar sebentar',
    'tunggu bentar gue dateng',
    'harganya naik terus',
    'siapa mau ikut gue',
    'gue rasa dia bener',
    'gak usah repot repot',
    'besok libur gak sih',
    'gue udah laper banget',
  ],
};
