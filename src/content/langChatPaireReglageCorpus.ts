/**
 * Le JUMEAU DE REGLAGE du corpus de paire. Malais et indonesien, meme registre
 * familier, autres sujets.
 *
 * Test-only module, comme les cinq autres corpus, meme garde statique.
 *
 * POURQUOI IL EXISTE, et c'est la regle des trois corpus qui mord exactement
 * comme elle est censee le faire.
 *
 * `langChatPaireCorpus.ts` a montre que la porte malais-indonesien s'ouvre sur
 * des mots outils formels que le chat familier n'ecrit pas. Corriger ca demande
 * de choisir des mots partages du registre familier. Or le crible ne peut pas
 * les proposer : il ne lit que les trois corpus PARALLELES, qui sont en
 * registre neutre. Et le corpus de paire, lui, est en registre familier mais il
 * MESURE le resultat, donc y choisir des mots le brulerait.
 *
 * Il fallait donc un corpus familier de plus, sur lequel choisir. Celui-ci.
 * Meme forme que le corpus 3 face au corpus 2 : le troisieme a ete ecrit le
 * jour ou le deuxieme ne pouvait plus etre lu.
 *
 * DROITS D'USAGE, a garder :
 *   `langChatPaireCorpus.ts`         MESURE. Totaux seulement, jamais ses lignes.
 *   `langChatPaireReglageCorpus.ts`  celui-ci. On lit, on choisit, on mesure sur
 *                                    l'autre.
 *
 * SUJETS, encore une fois hors de ceux deja pris. Le corpus de paire parle de
 * sommeil, de travail, de telephone, de transport, de prix, de famille, de
 * cours et d'attente ; celui-ci parle de sport, d'argent, d'animaux, d'examens,
 * de vacances, de sante, de week-end, de courses et de jeux. Memes conventions :
 * pas d'emoji, pas de nom de chaine ni de streamer, pas de rire seul.
 *
 * AUCUNE LIGNE PARTAGEE, ni entre les deux langues ni avec les quatre autres
 * corpus. Verifie par le test.
 */
export const LANG_CHAT_PAIRE_REGLAGE: Record<string, readonly string[]> = {
  ms: [
    'siapa menang semalam',
    'aku dah kalah tiga kali',
    'gaji masuk hari ni',
    'kucing aku comel gila',
    'aku tak lulus exam tu',
    'lagu ni aku ulang je',
    'nak pergi cuti bulan depan',
    'aku demam sikit hari ni',
    'barisan panjang sangat kat sana',
    'hujung minggu ni aku free',
    'kawan aku tak datang',
    'bola semalam best gila',
    'aku beli baju baru',
    'anjing jiran bising sangat',
    'exam minggu depan weh',
    'aku tak boleh tidur malam tadi',
    'nak makan apa hari ni',
    'duit aku dah habis',
    'aku rindu kampung',
    'cuaca sejuk pagi tadi',
    'dia menang lagi sekali',
    'aku kena pergi klinik',
    'kereta aku rosak semalam',
    'jom lepak petang ni',
    'aku tengah belajar sekarang',
    'mak aku masak sedap',
    'aku lambat bangun tadi',
    'tiket dah habis jual',
    'aku nak beli telefon baru',
    'lama tak main game ni',
  ],
  id: [
    'siapa yang menang semalem',
    'gue udah kalah tiga kali',
    'gajian hari ini',
    'kucing gue lucu banget',
    'gue gak lulus ujian itu',
    'lagu ini gue ulang terus',
    'mau liburan bulan depan',
    'gue agak demam hari ini',
    'antriannya panjang banget di sana',
    'weekend ini gue kosong',
    'temen gue gak dateng',
    'bola semalem seru banget',
    'gue beli baju baru',
    'anjing tetangga berisik banget',
    'ujian minggu depan nih',
    'gue gak bisa tidur semalem',
    'mau makan apa hari ini',
    'duit gue udah abis',
    'gue kangen kampung',
    'dingin banget tadi pagi',
    'dia menang lagi',
    'gue harus ke klinik',
    'motor gue rusak kemarin',
    'ayo nongkrong sore ini',
    'gue lagi belajar sekarang',
    'nyokap gue masaknya enak',
    'gue telat bangun tadi',
    'tiketnya udah abis',
    'gue mau beli hape baru',
    'udah lama gak main game ini',
  ],
};
