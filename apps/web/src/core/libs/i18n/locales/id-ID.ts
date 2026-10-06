import type { LanguageMessages } from "@/core/libs/i18n/init";

export default {
  // #region COMMON
  locale: "id-ID",
  backTo: "Kembali ke halaman {target}",
  errorMinLength: "{field} harus memiliki minimal {length} karakter",
  error: "{module} eror",
  theme: "Tema",
  system: "Sistem",
  light: "Terang",
  dark: "Gelap",
  add: "Tambah",
  update: "Ubah",
  remove: "Hapus",
  empty: "Data Kosong",
  unsavedChanges: "Buang perubahan yang belum disimpan - anda yakin?",
  noPageContent: "Tidak Ada Konten",
  attention: "Perhatian",
  language: "Bahasa",
  cancel: "Batal",
  continue: "Lanjutkan",
  reload: "Muat ulang",
  appReady: "Aplikasi siap digunakan secara offline",
  newContentAvailable:
    "Konten baru tersedia, klik tombol muat ulang untuk memperbarui",
  newUpdateAvailable: "Versi baru tersedia",
  downloadAndInstallUpdate: "Unduh dan instal pembaruan",
  notFound: "Tidak Ditemukan",
  gone: "Maaf, kami tidak bisa menemukan halaman yang anda cari",
  welcome: "Selamat Datang Kembali",
  // #endregion COMMON
  // #region HOME
  title: "Beranda",
  // #endregion HOME
  // #region GAME
  game: {
    play: "Main",
    tagline: "Atur waktumu. Saksikan jalurnya.",
  },
  battle: {
    title: "Pertempuran",
    chooseStage: "Pilih Tahap",
    chooseDeck: "Pilih Dek Awal",
    start: "Mulai Pertempuran",
    stageLabel: "Tahap {id}",
    boss: "Bos",
    heroHp: "HP Pahlawan musuh {hp}",
    turn: "Giliran {number}",
    yourTurn: "Giliranmu",
    enemyTurn: "Giliran Musuh",
    endTurn: "Akhiri Giliran",
    skip: "Lewati",
    speed: "Kecepatan",
    speedValue: "×{value}",
    sound: "Suara",
    quit: "Tinggalkan Pertempuran",
    deck: "Dek",
    graveyard: "Kuburan",
    deckCount: "Dek: {count} kartu",
    graveyardCount: "Kuburan: {count} kartu",
    graveyardTop: "Kuburan: {count} kartu. Kartu terakhir: {name}",
    hand: "Tangan",
    enemyHand: "Tangan Musuh",
    ready: "Siap",
    countdown: "Hitung mundur {value}",
    selectTarget: "Pilih target",
    noTarget: "Tidak ada target yang sah sekarang",
    cancel: "Batal",
    victory: "Menang",
    defeat: "Kalah",
    turnLimit: "Batas giliran tercapai. Pihak bertahan menang.",
    starsLabel: "{count} dari 3 Bintang",
    retry: "Main Lagi",
    backToCampaign: "Kembali ke Kampanye",
    abandon: {
      title: "Tinggalkan Pertempuran?",
      text: "Pertempuran ini tidak mencatat hasil. Kamu dapat memainkan Tahap ini lagi kapan saja.",
      confirm: "Tinggalkan",
      stay: "Tetap",
    },
    rotate: "Putar ponselmu ke posisi mendatar untuk bermain.",
    noWebgl:
      "Game ini memerlukan WebGL 2. Peramban atau perangkatmu tidak mendukungnya.",
    loading: "Memuat Papan…",
    keyGuide: {
      label: "Panduan Tombol",
      title: "Tombol",
      moveSelection: "Pilih kartu",
      focusTarget: "Pilih target",
      play: "Mainkan kartu",
      endTurn: "Akhiri Giliran",
      skip: "Lewati animasi",
      inspect: "Lihat Detail Kartu dari Unit",
      cancel: "Batal",
    },
    attack: "Serangan",
    hp: "HP",
    speedStat: "Kecepatan",
    range: "Jangkauan",
    recall: "Kembali {value}%",
    skill: "Keahlian",
    recallReminder:
      "Setelah efeknya, kartu ini punya peluang {value}% untuk kembali ke Tanganmu. Jika tidak, kartu masuk ke Kuburan.",
    player: "Kamu",
    enemy: "Musuh",
    yours: "Milikmu",
    yourUnit: "Unit-mu",
    enemyUnit: "Unit Musuh",
    status: {
      bonusArmor: "Zirah +{value}",
      bonusArmorRule: "Dari Kartu Keahlian. Sisa Giliran: {turns}.",
      burn: "Terbakar",
      burnRule:
        "1 damage pada tiap Langkah Akhir pemiliknya. Sisa Langkah Akhir: {value}.",
      frozen: "Beku",
      frozenRule: "Ia melewatkan aksi berikutnya.",
      poisoned: "Racun {value}",
      poisonedRule:
        "1 damage per tumpukan pada tiap Langkah Akhir pemiliknya. Lalu ia kehilangan 1 tumpukan.",
      hobbled: "Terpincang {value}",
      hobbledRule:
        "Unit ini punya Kecepatan maksimum 1, setelah semua bonus. Hitungan turun 1 pada tiap Langkah Akhir pemiliknya.",
    },
  },
  town: {
    label: "Kota",
    bar: "Bilah Kota",
    opensLater: "Dibuka nanti",
    locked: "{name}, dibuka nanti",
    buildings: {
      townGate: "Kampanye",
    },
    shortcuts: {
      town: "Kota",
      campaign: "Kampanye",
      heynspire: "Heynspire",
      dungeons: "Dungeon",
      deck: "Dek",
      workshop: "Bengkel",
      packs: "Paket",
      hero: "Pahlawan",
      achievements: "Pencapaian",
      bazaar: "Bazar",
    },
    balances: {
      label: "Saldomu",
      balance: "{name}: {amount}",
      coin: {
        name: "Koin",
        use: "Untuk membeli Paket, Gabung, dan peningkatan Perlengkapan.",
      },
      essence: {
        name: "Esensi",
        use: "Untuk Membuat kartu di Bengkel.",
      },
      heynstones: {
        name: "Heynstone",
        use: "Untuk membeli Kosmetik dan Kemudahan di Bazar.",
      },
      denominations: {
        gold: { name: "Emas", short: "e" },
        silver: { name: "Perak", short: "p" },
        copper: { name: "Tembaga", short: "t" },
      },
    },
  },
  tutorial: {
    label: "Tutorial",
    gotIt: "Mengerti",
    skip: "Lewati tutorial",
    steps: {
      ready: {
        title: "Hitung Mundur dan Siap",
        text: "Angka di setiap kartu di Tanganmu adalah Hitung mundurnya. Angka itu turun 1 di awal setiap Giliranmu. Saat 0, kartu itu Siap dan bisa kamu mainkan. Mainkan kartu yang Siap, atau akhiri Giliranmu.",
      },
      summonZone: {
        title: "Zona Panggilmu",
        text: "Taruh kartu di Petak yang disorot. Zona Panggilmu adalah 3 Petak terdekat dengan Pahlawanmu di setiap Jalur. Panah menunjuk satu Jalur, tetapi kamu bisa memakai Jalur mana pun.",
      },
      resolution: {
        title: "Unit bertindak sendiri",
        text: "Unit-mu sekarang bergerak dan menyerang sendiri. Kamu tidak mengendalikannya. Rencanakan kartumu sebelum mengakhiri Giliran.",
      },
      laneChoice: {
        title: "Hadang musuh",
        text: "Ada Unit musuh di Jalur yang tidak berisi Unit-mu. Sorotan merah menunjukkan Jalur itu. Panggil Unit ke Jalur itu untuk menghadang Unit musuh.",
      },
    },
  },
  decks: {
    vanguard: {
      name: "Barisan Depan Manusia",
      description:
        "Prajurit. Tahan jalur dengan zirah, lalu dorong dengan ksatria.",
    },
    raiders: {
      name: "Perampok Orc",
      description:
        "Penyihir. Binatang cepat dan api. Serang Pahlawan musuh lebih awal.",
    },
  },
  stages: {
    "1-1": { name: "Penyeberangan Berlumpur", enemy: "Pengintai Bandit" },
    "1-2": { name: "Dua Jembatan", enemy: "Bandit Kembar" },
    "1-3": { name: "Kincir yang Terbakar", enemy: "Penyihir Pagar" },
    "1-4": { name: "Gerbang Tol", enemy: "Sersan Tol" },
    "1-5": { name: "Perkemahan Bandit", enemy: "Juru Masak Kemah" },
    "1-6": { name: "Menara Pengawas Tua", enemy: "Penenung Menara" },
    "1-7": {
      name: "Perkemahan Tentara Bayaran",
      enemy: "Kapten Tentara Bayaran",
    },
    "1-8": { name: "Celah Longsoran Batu", enemy: "Penjaga Celah" },
    "1-9": { name: "Pohon Ek Raksasa", enemy: "Pengintai Sang Baron" },
    "1-10": { name: "Aula Brassbelly", enemy: "Baron Brassbelly" },
  },
  classes: {
    warrior: "Prajurit",
    ranger: "Pemanah",
    mage: "Penyihir",
    priest: "Pendeta",
  },
  races: {
    human: "Manusia",
    elf: "Elf",
    undead: "Undead",
    orc: "Orc",
  },
  ranks: {
    common: "Biasa",
    uncommon: "Tak Biasa",
    rare: "Langka",
    epic: "Epik",
    legendary: "Legendaris",
  },
  roles: {
    frontliner: "Garis Depan",
    striker: "Penyerang",
    runner: "Pelari",
    shooter: "Penembak",
    support: "Pendukung",
    wall: "Tembok",
  },
  damageTypes: {
    physical: "Fisik",
    fire: "Api",
    frost: "Es",
    holy: "Suci",
  },
  keywords: {
    armor: "Zirah {value}",
    charge: "Terjang",
    flying: "Terbang",
    heroic: "Heroik {value}",
    hobble: "Pincang {value}",
    knockback: "Hentakan {value}",
    lastBreath: "Nafas Terakhir {value}",
    pivot: "Berbalik",
    poison: "Racun",
    regeneration: "Regenerasi {value}",
    retaliation: "Balasan",
    ranged: "Jarak Jauh {value}",
    melee: "Jarak Dekat",
  },
  keywordRules: {
    armor:
      "Mengurangi damage ke Unit ini sebesar {value}. Tidak mengurangi damage Suci.",
    charge: "+2 Kecepatan pada Giliran saat Unit ini dipanggil.",
    flying: "Bergerak melewati Unit lain. Berhenti di Petak kosong.",
    heroic: "+{value} damage saat Unit ini menyerang Pahlawan.",
    hobble:
      "Setelah Unit ini memberi damage serangan di atas 0 ke Unit musuh, Unit itu menjadi Terpincang {value}. Unit yang Terpincang punya Kecepatan maksimum 1, setelah semua bonus. Hitungan turun 1 pada tiap Langkah Akhir pemiliknya. Pincang yang baru mempertahankan hitungan yang lebih tinggi. Balasan tidak menerapkan Pincang.",
    knockback:
      "Setelah Unit ini memberi damage serangan di atas 0 ke Unit musuh, Unit itu terdorong {value} Petak ke arah Pahlawannya sendiri, di Jalurnya sendiri. Dorongan berhenti sebelum Unit lain dan di Kolom 1 Unit itu. Unit dengan Tembok tidak pernah terdorong. Balasan tidak menerapkan Hentakan.",
    lastBreath:
      "Saat Unit ini meninggalkan Papan, ia memberi {value} damage ke Unit musuh terdekat di depannya.",
    pivot:
      "Unit ini dapat menyerang Unit musuh tepat di belakangnya atau di sebelahnya, sebelum Unit di depannya. Lalu ia tidak bergerak.",
    poison:
      "Setelah Unit ini memberi damage serangan di atas 0, Unit itu mendapat 1 tumpukan Racun. Pada tiap Langkah Akhir pemiliknya, ia menerima 1 damage per tumpukan, lalu kehilangan 1 tumpukan.",
    regeneration: "Pada Langkah Awal-mu, Unit ini memulihkan {value} HP.",
    retaliation:
      "Saat Unit ini selamat dari serangan jarak dekat, ia memberi damage sebesar Serangannya ke penyerang.",
    fire: "Api: target terbakar 1 damage pada 2 Langkah Akhir berikutnya.",
    frost: "Es: target melewatkan aksi berikutnya.",
    holy: "Suci: Zirah tidak mengurangi damage ini.",
  },
  effects: {
    damageUnit: "Beri {amount} damage {damageType} ke satu Unit musuh.",
    damageArea:
      "Beri {amount} damage {damageType} ke satu Unit musuh dan {extra} Petak berikutnya di belakangnya.",
    damageLane:
      "Beri {amount} damage {damageType} ke semua Unit musuh dalam satu Jalur.",
    laneArmor:
      "Unit kawan dalam satu Jalur mendapat Zirah {armor} selama {turns} Giliran musuh berikutnya.",
    lowerCountdown:
      "Hitung mundur {cards} kartu acak di Tanganmu turun sebesar {amount}.",
  },
  cards: {
    human: {
      militiaRecruit: {
        name: "Rekrut Milisi",
        flavor: '"Aku bawa garpu rumputku sendiri!"',
      },
      shieldbearer: {
        name: "Pembawa Perisai",
        flavor: "Perisainya lebih penyok dari panci timah.",
      },
      crossbowGuard: {
        name: "Penjaga Busur Silang",
        flavor: "Tak pernah telat. Tak pernah meleset. Kadang tertidur.",
      },
      halberdier: {
        name: "Prajurit Tombak Kapak",
        flavor: "Sentuh panjinya, maka kau sentuh bilahnya.",
      },
      dawnCleric: {
        name: "Pendeta Fajar",
        flavor: "Ia bernyanyi saat matahari terbit. Tak ada yang memintanya.",
      },
      riverKnight: {
        name: "Ksatria Sungai",
        flavor: "Kudanya lebih berani darinya.",
      },
      gateWarden: {
        name: "Penjaga Gerbang",
        flavor: "Tak ada yang lewat. Tak ada yang ke belakang juga.",
      },
      ironBulwark: {
        name: "Benteng Besi",
        flavor: "Tembok yang suka mengeluh soal cuaca.",
      },
      paviseArbalist: {
        name: "Arbalester Pavise",
        flavor: "Ia membawa temboknya sendiri dan menyebutnya posisi tembak.",
      },
    },
    orc: {
      badlandPup: {
        name: "Anak Anjing Tandus",
        flavor: "Kecil, berisik, dan sudah menggigit.",
      },
      scrapRaider: {
        name: "Perampok Rongsokan",
        flavor: "Semua yang berkilau kini miliknya.",
      },
      emberShaman: {
        name: "Dukun Bara",
        flavor: "Ia memasak makan malam dan musuh dengan cara yang sama.",
      },
      howlingCharger: {
        name: "Penerjang Melolong",
        flavor: "Kau mendengarnya jauh sebelum melihatnya.",
      },
      skyreaver: {
        name: "Penjarah Langit",
        flavor: "Ia mencuri topi dari ketinggian.",
      },
      packStalker: {
        name: "Penguntit Kawanan",
        flavor: "Ia selalu tahu di mana kau berada. Biasanya di belakangmu.",
      },
      tuskBrute: {
        name: "Si Bengis Bertaring",
        flavor: "Pintu hanyalah saran.",
      },
      warchiefGrukka: {
        name: "Kepala Perang Grukka",
        flavor: '"Makan siang dulu. Lalu kejayaan."',
      },
    },
    warrior: {
      warDrums: {
        name: "Genderang Perang",
        flavor: "Dum. Dum. Bergerak lebih cepat.",
      },
      shieldWall: {
        name: "Dinding Perisai",
        flavor: "Kunci perisai dan bertahan.",
      },
      spearThrow: {
        name: "Lempar Tombak",
        flavor: "Bidik yang paling berisik.",
      },
    },
    mage: {
      fireball: { name: "Bola Api", flavor: "Sambutan yang hangat." },
      frostBolt: { name: "Panah Es", flavor: "Tinggallah sebentar." },
      flameWave: { name: "Gelombang Api", flavor: "Seluruh jalur kebagian." },
    },
  },
  // #endregion GAME
} as const satisfies LanguageMessages;
