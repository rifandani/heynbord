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
    chooseDeck: "Pilih Dek",
    editDecks: "Ubah Dek",
    deckLine: "{className} · {count} kartu",
    start: "Mulai Pertempuran",
    stageLabel: "Tahap {id}",
    boss: "Bos",
    dungeonName: "Dungeon {number}",
    bosses: "Bos Musuh",
    specialist: "Spesialis",
    bossPlate: {
      label: "{name}, {className}: HP {hp} dari {maxHp}. {lanes}.",
      labelDefeated: "{name}: Tumbang.",
      holdsLanes: "Memegang Jalur {lanes}",
      holdsLane: "Memegang Jalur {lane}",
      holdsNoLane: "Tidak memegang Jalur",
      defeated: "Tumbang",
      rules: "Aturan Bos",
      ruleAt: "Pada {threshold}% HP",
      ruleUsed: "Terpakai",
      noRules: "Tidak ada Aturan Bos",
      target: "Target: {name}",
      activated: "{name}: Aturan Bos. {effect}.",
      notch: "Aturan Bos pada {threshold}% HP",
    },
    bossRule: {
      countdown: "Hitung mundur −{amount}",
      countdownDetail:
        "Hitung mundur −{amount} pada sampai {cards} kartu dengan hitung mundur tertinggi",
      summon: "Panggil {name}",
      draw: "Ambil {cards}",
      drawDetail: "Ambil {cards} kartu lagi",
    },
    heroHp: "HP Pahlawan musuh {hp}",
    turn: "Giliran {number}",
    yourTurn: "Giliranmu",
    enemyTurn: "Giliran Musuh",
    endTurn: "Akhiri Giliran",
    skip: "Lewati",
    speed: "Kecepatan",
    speedValue: "×{value}",
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
    uniqueBlocked: "{name} sudah ada di sisi Papan-mu.",
    cancel: "Batal",
    victory: "Menang",
    defeat: "Kalah",
    turnLimit: "Batas giliran tercapai. Pihak bertahan menang.",
    routedWin: "Musuh Tercerai-berai: ia tidak punya Unit dan kartu.",
    routedLoss: "Pihakmu Tercerai-berai: kamu tidak punya Unit dan kartu.",
    starsLabel: "{count} dari 3 Bintang",
    coinEarned: "Koin didapat: {amount}",
    xpEarned: "+{amount} XP",
    xpEarnedLabel: "XP didapat: {amount}.",
    xpBar: "Level {level}: {percent} menuju level {next}.",
    levelShort: "Level {level}",
    levelUp: "Naik level! Level {level}",
    cardWon: "Kartu didapat: {name}, {rank}.",
    newCardWon: "Kartu baru didapat: {name}, {rank}.",
    forgeStonesEarned: "+{count} Batu Tempa {tier}",
    forgeStonesEarnedLabel: "Batu Tempa didapat: {count} × {tier}.",
    essenceEarned: "+{amount} Esensi",
    essenceEarnedLabel: "Esensi didapat: {amount}.",
    heynstonesEarned: "+{amount} Heynstone",
    heynstonesEarnedLabel: "Heynstone didapat: {amount}.",
    retry: "Main Lagi",
    backToCampaign: "Kembali ke Kampanye",
    backToDungeons: "Kembali ke Dungeon",
    abandon: {
      title: "Tinggalkan Pertempuran?",
      text: "Pertempuran ini tidak mencatat hasil. Kamu dapat memainkan Tahap ini lagi kapan saja.",
      textDungeon:
        "Pertempuran ini tidak mencatat hasil. Kamu dapat memainkan Dungeon ini lagi kapan saja.",
      textFloor:
        "Pertempuran ini tidak mencatat hasil. Kamu dapat melawan Lantai ini lagi kapan saja.",
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
      handbook: "Buka Buku Panduan",
      battleLog: "Buka atau tutup Catatan Pertempuran",
      logEntry: "Catatan Pertempuran: satu Entri Catatan mundur atau maju",
      logTurn: "Catatan Pertempuran: satu Giliran mundur atau maju",
      cancel: "Batal, atau Kembali ke Saat Ini",
    },
    attack: "Serangan",
    hp: "HP",
    speedStat: "Kecepatan",
    range: "Jangkauan",
    recall: "Kembali {value}%",
    skill: "Keahlian",
    cast: {
      player: "Kamu memakai {name}",
      enemy: "Musuh memakai {name}",
      recalled: "Kembali ke Tangan",
    },
    player: "Kamu",
    enemy: "Musuh",
    yours: "Milikmu",
    yourUnit: "Unit-mu",
    enemyUnit: "Unit Musuh",
    tokenReminder:
      "Token bukan kartu. Saat mati, ia menghilang. Ia tidak masuk ke Kuburan.",
    status: {
      bonusBulwark: "Benteng +{value}",
      bonusBulwarkRule: "Dari Kartu Keahlian. Sisa Giliran: {turns}.",
      bonusAttack: "Serangan +{value}",
      bonusAttackRule:
        "Dari Kartu Keahlian: sampai akhir Giliranmu berikutnya. Sisa Fase Akhir: {turns}.",
      bonusRange: "Jangkauan +{value}",
      bonusRangeRule:
        "Dari Kartu Keahlian: sampai akhir Giliranmu berikutnya. Unit jarak dekat menyerang sebagai Unit jarak jauh. Sisa Fase Akhir: {turns}.",
      burn: "Terbakar",
      burnRule: "1 damage pada tiap Fase Akhir pemiliknya.",
      burnLeft: "Sisa Fase Akhir: {value}.",
      frozen: "Beku",
      frozenRule: "Ia melewatkan aksi berikutnya.",
      paralyzed: "Lumpuh",
      paralyzedRule:
        "Sebuah Debuff. Ia tidak menyerang pada aksi berikutnya, tetapi ia tetap bisa bergerak. Sampai saat itu, ia tidak memakai Balas dan Serang Duluan.",
      poisoned: "Racun {value}",
      poisonedRule:
        "1 damage per tumpukan pada tiap Fase Akhir pemiliknya. Lalu ia kehilangan 1 tumpukan.",
      hobbled: "Terpincang {value}",
      hobbledRule:
        "Unit ini punya Kecepatan maksimum 1, setelah semua bonus. Hitungan turun 1 pada tiap Fase Akhir pemiliknya.",
      bleeding: "Berdarah {value}",
      bleedingRule:
        "Unit ini mendapat setengah dari tiap penyembuhan, dibulatkan ke bawah. Hitungan turun 1 pada tiap Fase Akhir pemiliknya.",
      grounded: "Jatuh {value}",
      groundedRule:
        "Debuff. Unit ini tidak punya Terbang: ia berhenti sebelum Unit musuh, dan Unit Terbang musuh bergerak melewatinya. Hitungan turun 1 pada tiap Fase Akhir pemiliknya.",
      entangled: "Terjerat",
      entangledRule:
        "Kecepatan 0 pada aksi berikutnya. Ia tetap bisa menyerang.",
      rallyBonus: "Serangan +{value}",
      rallyBonusRule: "Dari Semangat: sampai akhir Giliran ini.",
      swarmBonus: "Serangan +{value}",
      swarmBonusRule: "Dari Gerombolan: ada Unit kawan lain dalam Jalur ini.",
      reborn: "Bangkit Kembali",
      rebornRule:
        "Unit ini sudah mati dan kembali dengan Bangkit. Ia tidak kembali lagi.",
      ward: "Pelindung {value}",
      wardRule:
        "Sebuah Buff. Ia menyerap damage setelah Benteng, Crit, dan Block, juga damage Suci, Terbakar, dan Racun, lalu turun sebesar damage itu. Ia tidak punya batas waktu. Pelindung baru memakai nilai yang lebih tinggi.",
      steadfast: "Teguh",
      steadfastRule:
        "Sebuah Buff. Saat damage akan membawa Unit ini ke 0 HP, ia tetap pada 1 HP, dan Teguh berakhir. Pelindung menyerap damage itu lebih dulu. Ia tidak punya batas waktu.",
      exposed: "Terbuka {value}",
      exposedRule:
        "Sebuah Debuff. Tiap serangan Fisik pada Unit ini memberi damage tambahan sebesar nilai Terbuka, setelah Benteng. Damage Api, Es, Suci, Terbakar dan Racun tidak mendapatkannya. Ia berakhir setelah 2 Fase Akhir pemiliknya. Terbuka yang baru memakai nilai yang lebih tinggi.",
    },
  },
  battleLog: {
    open: "Catatan Pertempuran",
    title: "Catatan Pertempuran",
    backToLive: "Kembali ke Saat Ini",
    play: "Putar",
    pause: "Jeda",
    previous: "Entri Catatan sebelumnya",
    next: "Entri Catatan berikutnya",
    showBoard: "Lihat Papan",
    showLog: "Lihat Catatan",
    banner: "Giliran {number} · {side}",
    turn: "Giliran {number} · {side}",
    yourHp: "Kamu {hp} HP",
    heroHp: "{name} {hp} HP",
    laneOne: "Jalur {lane}",
    laneList: "Jalur {lanes}",
    entries: "Entri Catatan",
    empty:
      "Belum ada yang terjadi di Pertempuran ini. Tiap kartu yang dimainkan dan tiap Aksi Unit tampil di sini.",
    selected: "Catatan Pertempuran: {summary}",
    damage: "Total damage {amount}",
    deaths: "Unit yang mati: {count}",
    square: "Jalur {lane}, Kolom {column}",
    yourHero: "Pahlawanmu",
    unknownUnit: "sebuah Unit",
    token: "sebuah Token",
    flags: {
      crit: "Crit",
      block: "Block",
      trueDamage: "Damage Murni",
      ward: "Pelindung −{amount}",
    },
    line: {
      playYou: "Kamu memainkan {card}.",
      playEnemy: "{hero} memainkan {card}.",
      target: "Target: {target}.",
      targetLane: "Target: Jalur {lane}.",
      summon: "{unit} masuk ke {square}.",
      move: "{unit} bergerak dari Kolom {from} ke Kolom {to}.",
      push: "{unit} terdorong dari Kolom {from} ke Kolom {to}.",
      skip: "{unit} melewatkan aksinya.",
      noAttack: "{unit} bergerak, tetapi tidak menyerang.",
      attack: "{unit} menyerang {target}.",
      damage: "{target} terkena {amount} damage {damageType}.",
      heal: "{unit} pulih {amount} HP.",
      rallied: "{unit} memberi bonus Semangat-nya.",
      died: "{unit} mati.",
      reborn: "{unit} kembali dengan {hp} HP.",
      keyword: "{unit} memakai {keyword}.",
      status: "{unit} mendapat {status}.",
      steadfast: "{unit} tetap pada 1 HP.",
      cleansed: "Semua Debuff {unit} berakhir.",
      bulwark: "{unit} mendapat Benteng +{value}.",
      attackBonus: "{unit} mendapat Serangan +{value}.",
      heroicBonus: "Bonus Heroik {unit} sekarang Serangan +{value}.",
      soulHarvest:
        "{unit} mendapat Panen Jiwa: bonusnya sekarang +{value} Serangan dan +{value} HP.",
      rangeBonus: "{unit} mendapat Jangkauan +{value}.",
      fieldPlaced: "{card} tetap di Papan. Serangan: {turns}.",
      fieldStruck: "{card} mengenai areanya. Sisa serangan: {turns}.",
      laneOpened: "Jalur {lane} terbuka.",
      heroDefeated: "{hero} Tumbang.",
      frontMoved: "{to} mengambil Lini {from}: {lanes}.",
      bossRule: "{hero}: Aturan Bos pada {threshold}% HP aktif.",
      won: "Pertempuran berakhir. Kamu menang.",
      lost: "Pertempuran berakhir. Kamu kalah.",
      drawYou: "Kamu mengambil {card}.",
      drawEnemy: "{hero} mengambil sebuah kartu.",
      countdownsYou: "Hitung mundur di Tanganmu turun.",
      countdownsEnemy: "Hitung mundur di Tangan {hero} turun.",
      recalled: "{card} kembali ke Tangan.",
      toGraveyard: "{card} masuk ke Kuburan.",
      countdownYours: "{card} di Tanganmu mendapat hitung mundur {countdown}.",
      countdownHidden:
        "Sebuah kartu di Tangan {hero} mendapat hitung mundur {countdown}.",
      burnOne: "Terbakar mengenai {unit}.",
      burnMany: "Terbakar mengenai {count} Unit.",
      poisonOne: "Racun mengenai {unit}.",
      poisonMany: "Racun mengenai {count} Unit.",
      suddenDeath: "Mati Mendadak mengenai Pahlawan giliran ini.",
      nothing: "Tidak ada yang berubah.",
    },
  },
  replay: {
    badge: "Replay",
    share: "Bagikan Replay",
    shareTitle: "Replay Heynbord: {name}",
    copied: "Tautan Replay disalin. Tempel untuk membagikan Pertempuran ini.",
    copyFailed: "Tautan Replay tidak dapat disalin.",
    banner: "Giliran {number} · {side} · Replay",
    leave: "Keluar",
    watchAgain: "Tonton lagi",
    inBattle: "Tinggalkan Pertempuran untuk menonton Replay.",
    broken: "Tautan Replay ini rusak.",
    otherVersion: "Replay ini dari versi game yang berbeda.",
  },
  town: {
    label: "Kota",
    bar: "Bilah Kota",
    opensLater: "Dibuka nanti",
    locked: "{name}, dibuka nanti",
    opensAtLevel: "Dibuka pada level {level}",
    lockedAtLevel: "{name}, dibuka pada level {level}",
    levelPlate: "Level {level}",
    opensWithStage: "Menangkan {stage} ({id}) untuk membuka",
    lockedWithStage: "{name}, menangkan {stage} ({id}) untuk membuka",
    shortcutBadge: "{name}, {count} bisa diklaim",
    shipBack: "{name}, kapal sudah kembali",
    buildings: {
      townGate: "Kampanye",
      cardShop: "Paket",
      bazaar: "Bazar",
      workshop: "Bengkel",
      barracks: "Pahlawan",
      cave: "Dungeon",
      heynspire: "Heynspire",
      hall: "Pencapaian",
      seaport: "Pelabuhan",
    },
    shortcuts: {
      town: "Kota",
      campaign: "Kampanye",
      heynspire: "Heynspire",
      dungeons: "Dungeon",
      seaport: "Pelabuhan",
      deck: "Dek",
      workshop: "Bengkel",
      packs: "Paket",
      hero: "Pahlawan",
      achievements: "Pencapaian",
      bazaar: "Bazar",
      handbook: "Buku Panduan",
    },
    balances: {
      label: "Saldomu",
      balance: "{name}: {amount}",
      coin: {
        name: "Koin",
        use: "Untuk membeli Paket, Gabung, peningkatan Perlengkapan, dan Slot Dek.",
      },
      essence: {
        name: "Esensi",
        use: "Untuk Buat dan Lebur di Bengkel.",
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
  campaign: {
    label: "Kampanye",
    regionOf: "Wilayah {number} dari {count}",
    regions: {
      "1": "Hearthvale",
      "2": "Mesa Merah",
      "3": "Lembah Jamur Cahaya",
      "4": "Hutan Duri",
      "5": "Rawa Hampa",
    },
    previousRegion: "Wilayah sebelumnya: {name}",
    nextRegion: "Wilayah berikutnya: {name}",
    regionLater: "{name} dibuka nanti.",
    regionLocked: "Menangkan Tahap Bos {id}, {stage}, untuk membuka {name}.",
    trail: "Tahap",
    marker: {
      done: "Tahap {id}, selesai, {stars} dari 3 Bintang",
      open: "Tahap {id}, terbuka",
      locked: "Tahap {id}, terkunci",
      bossDone: "Tahap Bos {id}, selesai, {stars} dari 3 Bintang",
      bossOpen: "Tahap Bos {id}, terbuka",
      bossLocked: "Tahap Bos {id}, terkunci",
    },
    winFirst: "Menangkan Tahap {id} dulu.",
    stars: {
      label: "Bintang di {name}",
      value: "{count} dari {total} Bintang",
    },
    chest: {
      label: "Peti pada {stars} Bintang",
      claimable: "Bintangmu cukup. Buka untuk mengambil hadiahnya.",
      claimed: "Sudah diambil.",
      needed: "{count} Bintang lagi membuka peti ini.",
      claimedTitle: "Peti pada {stars} Bintang: diambil",
      essence: "+{amount} Esensi",
      pack: "1 {pack} menunggu di Toko kartu.",
      racePack:
        "1 {pack} menunggu di Toko kartu. Kamu memilih Rasnya saat membukanya.",
      ok: "OK",
    },
    panel: {
      close: "Tutup",
      enemy: "Musuh",
      enemyLine: "{name} · {className}",
      heroHp: "HP Pahlawan {hp}",
      level: "Level yang disarankan {level}",
      bestStars: "Terbaik",
      notWon: "Belum menang",
      reward: "Hadiah",
      firstWin: "Kemenangan pertama: kartu ini, Koin, dan XP.",
      repeatWin:
        "Kemenangan ulang: Koin dan peluang kartu dari Tahap ini. Tanpa XP.",
      stars: "Bintang",
      starRule: {
        1: "Menangkan Pertempuran.",
        2: "Pertahankan setengah HP Pahlawanmu atau lebih.",
        3: "Juga menang sebelum Giliran {turn}.",
      },
      deck: "Dek",
      fight: "Bertarung",
    },
  },
  sweep: {
    label: "Sweep",
    button: "Sweep ×{count}",
    tickets: "Tiket: {count}",
    fewer: "Pakai 1 Tiket lebih sedikit",
    more: "Pakai 1 Tiket lebih banyak",
    max: "Maks",
    maxLabel: "Pakai Tiket terbanyak: {count}",
    resultLabel: "Sweep {count} Tiket. Tiap Tiket adalah satu kemenangan.",
    noCard: "Kali ini tidak ada kartu.",
    cardCopies: "Kartu didapat: {name}, {rank}, {count} salinan.",
    newCardCopies: "Kartu baru didapat: {name}, {rank}, {count} salinan.",
    again: "Sweep Lagi ×{count}",
    close: "Tutup",
    campaign: {
      control: "Tiket Sweep Kampanye yang dipakai",
      ticketsLabel: "Kamu punya {count} Tiket Sweep Kampanye.",
      noTickets: "Tiap kemenangan Tahap memberi {count} Tiket Sweep Kampanye.",
      ticketsLeft: "Sisa Tiket Sweep Kampanye: {count}",
      earned: "+{count} Tiket Sweep Kampanye",
      earnedLabel: "Tiket Sweep Kampanye didapat: {count}.",
    },
    dungeon: {
      control: "Tiket Sweep Dungeon yang dipakai",
      ticketsLabel: "Kamu punya {count} Tiket Sweep Dungeon.",
      noTickets: "Tiap kemenangan Dungeon memberi {count} Tiket Sweep Dungeon.",
      ticketsLeft: "Sisa Tiket Sweep Dungeon: {count}",
      earned: "+{count} Tiket Sweep Dungeon",
      earnedLabel: "Tiket Sweep Dungeon didapat: {count}.",
    },
  },
  settings: {
    title: "Pengaturan",
    close: "Tutup Pengaturan",
    language: "Bahasa",
    sound: "Suara",
    volume: "Volume suara",
    soundOn: "Suara aktif",
    profile: {
      label: "Progres",
      export: "Ekspor",
      exportLabel: "Ekspor progresmu ke file",
      import: "Impor",
      importLabel: "Impor progres dari file",
      confirmTitle: "Ganti progresmu?",
      confirmText: "Ini mengganti progresmu. Kamu tidak bisa membatalkannya.",
      cancel: "Batal",
      replace: "Ganti",
      errors: {
        UnreadableFile: "File ini bukan file progres Heynbord.",
        ChecksumMismatch:
          "File ini rusak atau sudah diubah. Game tidak bisa mengimpornya.",
        UnknownVersion: "File ini punya versi yang tidak dikenal game ini.",
        NewerVersion:
          "Versi game yang lebih baru membuat file ini. Muat ulang halaman untuk memperbarui game, lalu coba lagi.",
        MigrationFailed: "Game tidak bisa memperbarui file lama ini.",
        InvalidProfile: "File ini punya nilai yang tidak benar.",
      },
    },
  },
  profile: {
    loadFailed:
      "Progres tersimpanmu gagal dimuat, jadi game baru dimulai. Simpanan lama tetap ada sampai kamu bermain.",
    saveFailed: "Progresmu tidak tersimpan.",
  },
  // Nama draf (Pencapaian 2). Tiap ID adalah Translation Key: `achievements.<id>.name` dan `.goal`.
  achievements: {
    notice: {
      one: "Pencapaian selesai: {name}",
      many: "{count} Pencapaian selesai",
    },
    result: {
      label: "Pencapaian yang diselesaikan oleh hasil ini",
      completed: "Pencapaian selesai",
    },
    screen: {
      label: "Pencapaian",
      categories: {
        label: "Kategori Pencapaian",
        campaign: "Kampanye",
        dungeonsAndHeynspire: "Dungeon dan Heynspire",
        progress: "Kemajuan",
        feats: "Aksi Hebat",
      },
      count: "{done} / {total}",
      countLabel: "{done} dari {total} selesai",
      toClaim: "{count} bisa diklaim",
      progress: "Kemajuan",
      notDone: "Belum selesai",
      progressLabel: "{current} dari {target}",
      reward: "Hadiah: {reward}",
      claim: "Klaim",
      claimLabel: "Klaim {name}: {reward}",
      claimed: "Diklaim",
      claimAll: "Klaim semua",
      claimAllLabel: "Klaim semua: {count} hadiah",
      noneToClaim: "Tidak ada hadiah untuk diklaim",
      rewards: {
        heynstones: "{amount} Heynstone",
        essence: "{amount} Esensi",
        coin: "{coin}",
        cosmetic: "Kosmetik khusus hadiah",
        cosmeticLater: "Hadir di pembaruan nanti",
      },
      said: {
        one: "{name} diklaim: {reward}.",
        many: "{count} hadiah diklaim.",
      },
    },
    campaign: {
      hearthvale: { name: "Hearthvale Bebas", goal: "Menangkan Tahap 1-10" },
      redMesas: { name: "Melintasi Mesa", goal: "Menangkan Tahap 2-10" },
      glowcapHollows: {
        name: "Cahaya di Lembah",
        goal: "Menangkan Tahap 3-10",
      },
      thornwood: { name: "Menembus Duri", goal: "Menangkan Tahap 4-10" },
      hollowMarches: {
        name: "Kastel Marrow Runtuh",
        goal: "Menangkan Tahap 5-10",
      },
      regionStars: {
        name: "Jalan Berbintang",
        goal: "Dapatkan 30 Bintang di satu Wilayah",
      },
      allStars: {
        name: "Semua Bintang di Heynbord",
        goal: "Dapatkan 150 Bintang: 3 Bintang di semua 50 Tahap",
      },
      allChests: {
        name: "Pemburu Peti",
        goal: "Ambil semua 15 peti Bintang",
      },
    },
    dungeon: {
      rootdeepMine: {
        name: "Masuk ke Tambang",
        goal: "Menangkan Dungeon 1, Tambang Akar Dalam",
      },
      rimebarrow: {
        name: "Hiburan Dingin",
        goal: "Menangkan Dungeon 2, Gundukan Beku",
      },
      brokenVault: {
        name: "Pembobol Brankas",
        goal: "Menangkan Dungeon 3, Brankas Retak",
      },
    },
    heynspire: {
      floor25: {
        name: "Setengah Jalan",
        goal: "Menangkan Lantai 25 Heynspire",
      },
      floor50: {
        name: "Puncak Menara",
        goal: "Menangkan Lantai 50 Heynspire",
      },
    },
    level: {
      max: { name: "Veteran", goal: "Capai level Pemain 30" },
    },
    collection: {
      half: { name: "Setengah Buku", goal: "Temukan 65 kartu" },
      all: { name: "Buku Lengkap", goal: "Temukan semua 136 kartu" },
    },
    packs: {
      fifty: { name: "Pelanggan Tetap", goal: "Buka 50 Paket" },
    },
    workshop: {
      legendary: {
        name: "Legenda Tercipta",
        goal: "Punya 1 salinan Legendaris dari sebuah kartu, dari Gabung atau Paket Kerajaan",
      },
      combines: { name: "Meja Sibuk", goal: "Lakukan 25 kali Gabung" },
      craft: { name: "Dari Debu", goal: "Buat 1 kartu" },
    },
    gear: {
      ten: {
        name: "Diasah",
        goal: "Tingkatkan 1 Perlengkapan ke level 10",
      },
      max: {
        name: "Tempaan Penuh",
        goal: "Tingkatkan semua 4 Perlengkapan ke level 25",
      },
    },
    feat: {
      onlyHuman: {
        name: "Rumah dan Perapian",
        goal: "Menang di Tahap Bos atau Dungeon dengan Dek yang semua Kartu Makhluknya Manusia",
      },
      onlyElf: {
        name: "Hutan Tua",
        goal: "Menang di Tahap Bos atau Dungeon dengan Dek yang semua Kartu Makhluknya Elf",
      },
      onlyUndead: {
        name: "Pasukan Tulang",
        goal: "Menang di Tahap Bos atau Dungeon dengan Dek yang semua Kartu Makhluknya Undead",
      },
      onlyOrc: {
        name: "Gerombolan Perang",
        goal: "Menang di Tahap Bos atau Dungeon dengan Dek yang semua Kartu Makhluknya Orc",
      },
      onlyGoblin: {
        name: "Kenakalan",
        goal: "Menang di Tahap Bos atau Dungeon dengan Dek yang semua Kartu Makhluknya Goblin",
      },
      onlyFeral: {
        name: "Perburuan Kawanan",
        goal: "Menang di Tahap Bos atau Dungeon dengan Dek yang semua Kartu Makhluknya Buas",
      },
      creaturesOnly: {
        name: "Tanpa Trik",
        goal: "Menang di Tahap Bos atau Dungeon tanpa Kartu Keahlian di Dek",
      },
      commonOnly: {
        name: "Barisan Sederhana",
        goal: "Menangkan Tahap Bos Wilayah 3 atau sesudahnya dengan hanya salinan Biasa di Dek",
      },
      untouched: {
        name: "Tanpa Goresan",
        goal: "Menangkan Tahap Bos dengan HP Pahlawanmu penuh",
      },
      swiftBoss: {
        name: "Pengepungan Singkat",
        goal: "Menangkan Tahap Bos sebelum Giliran 10",
      },
      lastStand: {
        name: "Di Ujung Tanduk",
        goal: "Menang dengan HP Pahlawanmu 3 atau kurang",
      },
      rout: {
        name: "Tak Tersisa",
        goal: "Menang karena Pihak musuh Tercerai-berai",
      },
      fullZone: {
        name: "Barisan Padat",
        goal: "Menangkan Pertempuran dengan 9 Unit-mu di Papan pada saat yang sama",
      },
      allDamageTypes: {
        name: "Semua Elemen",
        goal: "Menangkan Pertempuran di mana Unit dan Kartu Keahlianmu memberi damage dari semua 5 Jenis Damage",
      },
      fourCards: {
        name: "Waktu yang Tepat",
        goal: "Menangkan Pertempuran di mana kamu memainkan 4 kartu dalam satu Giliran",
      },
      keywords: {
        name: "Banyak Trik",
        goal: "Menangkan Pertempuran di mana 10 Kata Kunci berbeda dari Unit-mu aktif",
      },
      noLosses: {
        name: "Dinding Perisai",
        goal: "Menangkan Dungeon tanpa ada Unit-mu yang mati",
      },
      untouchedVault: {
        name: "Brankas Sempurna",
        goal: "Menangkan Dungeon 3 dengan HP Pahlawanmu penuh",
      },
    },
  },
  bazaar: {
    label: "Bazar",
    title: "Bazar",
    families: {
      cardBack: "Punggung Kartu",
      heroPortrait: "Potret Pahlawan",
      gearLook: "Tampilan Perlengkapan",
      boardSkin: "Tampilan Papan",
    },
    items: {
      tentStripes: "Garis Tenda",
      goldFleur: "Bunga Emas",
      seaChart: "Peta Laut",
      lanternSails: "Layar Lentera",
      goatBite: "Punggung Gigitan Kambing",
      dawnGaze: "Pandangan Fajar",
      verdantCrest: "Jambul Hijau",
      mesaShade: "Naungan Mesa",
      saltWind: "Angin Asin",
      lanternKeeper: "Penjaga Lentera",
      tentRings: "Cincin Tenda",
      goldCrest: "Jambul Emas",
      copperRim: "Pinggiran Tembaga",
      ironVine: "Sulur Besi",
      stagLeather: "Kulit Rusa",
      goldInlay: "Intarsia Emas",
      moonstone: "Batu Bulan",
      royalPlate: "Zirah Raja",
      meadowDawn: "Padang Fajar",
      mesaDusk: "Mesa Senja",
      harborNight: "Pelabuhan Malam",
      hollowMoon: "Bulan Rongga",
      wardenSash: "Sabuk Penjaga",
      duneMask: "Topeng Duna",
      hollowLantern: "Lentera Rongga",
      thornCrown: "Mahkota Duri",
      spireDawn: "Fajar Menara",
      constellationSeal: "Segel Rasi Bintang",
      archivistCrest: "Jambul Arsiparis",
      flawlessPlate: "Zirah Sempurna",
    },
    price: "{amount} Heynstone",
    buy: "Beli",
    buyLabel: "Beli {name} seharga {amount} Heynstone",
    owned: "Dimiliki",
    ownedLabel: "Sudah kamu miliki",
    bought: "Kamu membeli {name}.",
    cannotBuy: "Kamu belum bisa membelinya.",
  },
  seaport: {
    label: "Pelabuhan",
    title: "Pelabuhan",
    cargo: "Muatan",
    duration: "Lama pergi",
    cargoes: {
      coin: "Koin",
      xp: "XP",
      essence: "Esensi",
      forgeStones: "Batu Tempa",
    },
    voyageName: "{cargo}, {hours} j",
    units: {
      xp: "XP",
      essence: "Esensi",
    },
    hours: "{hours} j",
    hoursLabel: "{hours} jam",
    levelShort: "Lv {level}",
    bonus: "+{percent}%",
    bonusLabel: "{percent}% lebih banyak tiap jam",
    noBonus: "Dasar",
    atSea: "Berlayar",
    essence: "+{amount} Esensi",
    stonesLater: "saat kapal kembali",
    manifest: {
      label: "Kapal membawa",
      back: "Kembali {time}",
      bonus: "+{percent}% tiap jam",
      stones: "× Batu Tempa {tier}",
      stonesFull: "hanya setelah pelayaran penuh",
    },
    dispatch: "Berangkatkan",
    dispatchLabel: "Berangkatkan kapal: {name}",
    dispatched:
      "Kapal berlayar dengan {name}. Kapal kembali dalam {hours} jam.",
    cannotDispatch: "Kapal tidak bisa berlayar sekarang.",
    cannotCollect: "Belum ada yang bisa diambil sekarang.",
    nextVoyage: "Pelayaran berikutnya",
    sailNote: "Ambil dulu untuk berlayar lagi",
    berth: {
      atBerth: "Kapal ada di dermaga",
      atBerthHint:
        "Pilih Muatan dan lama pergi, lalu berangkatkan kapal sebelum kamu pergi. Kapal mengumpulkan hadiahnya selama kamu pergi.",
      away: "Berlayar",
      back: "Kapal sudah kembali",
      collectedTitle: "Muatan diambil",
      timeLeft: "Kembali dalam",
      timeLeftLabel: "{hours} jam {minutes} menit",
      collectNow: "Ambil sekarang memberi",
      clockBack:
        "Jam perangkat ini lebih awal dari waktu keberangkatan. Ambil berhenti sampai jamnya benar.",
      collect: "Ambil",
      collectLabel: "Ambil hadiah {name}",
      collected: "Kamu mengambil hadiah {name}.",
      callBack: "Panggil pulang lebih awal",
      callBackConfirm: "Panggil sekarang",
      callBackWarning:
        "Kapal belum kembali. Jika kamu memanggilnya pulang sekarang, kamu tidak mendapat Batu Tempa, dan kapal kembali ke dermaga.",
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
  hints: {
    label: "Petunjuk",
    readMore: "Baca selengkapnya",
    close: "Tutup Petunjuk",
    skillCard:
      "Kartu Keahlianmu Siap. Mainkan ke target untuk efek sekali pakainya.",
    recall:
      "Kembali mengirim Kartu Keahlianmu ke Tanganmu. Hitung mundurnya mulai lagi.",
    deckBuilder:
      "Kamu punya kartu yang tidak ada di Dek mana pun. Buka Dek untuk menambahkannya.",
    unopenedPack:
      "Ada Paket untuk kamu buka. Gratis: buka untuk mendapat 5 kartu.",
    packs:
      "Toko kartu sudah buka. Buka Paket di sana untuk mendapat lebih banyak kartu untuk Dek-mu.",
    workshop:
      "Bengkel sudah buka. Gabung 2 salinan kartu menjadi 1 salinan di Peringkat berikutnya.",
    craft:
      "Buat sudah terbuka di Bengkel. Pakai Esensi untuk membuat salinan kartu yang sudah kamu temukan.",
    battleLog: "Buka Catatan Pertempuran untuk melihat apa yang terjadi.",
    gear: "Tiap tekan meningkatkan 1 Perlengkapan sebanyak 1 level, dengan Koin dan Batu Tempa. Level tidak pernah turun.",
    sweep:
      "Pakai Tiket Sweep Kampanye untuk langsung mendapat hadiah Tahap ini.",
    dungeonSweep:
      "Pakai Tiket Sweep Dungeon untuk langsung mendapat hadiah Dungeon ini.",
    dungeons:
      "Dungeon sudah terbuka. Di Dungeon, kamu melawan semua Bos-nya dalam satu Pertempuran di 4 Jalur.",
    heynspire:
      "Heynspire sudah terbuka. Daki 50 Lantainya satu per satu. Tiap Lantai memberi hadiahnya satu kali.",
    achievements:
      "Kamu menyelesaikan satu Pencapaian. Buka Pencapaian untuk mengklaim hadiahnya.",
    seaport:
      "Pelabuhan mengirim kapal untuk Ekspedisi. Berangkatkan kapal sebelum kamu pergi, lalu ambil Koin, XP, Esensi, dan Batu Tempa saat kapal kembali.",
  },
  handbook: {
    title: "Buku Panduan",
    close: "Tutup Buku Panduan",
    search: "Cari di Buku Panduan",
    searchPlaceholder: "Cari",
    clearSearch: "Hapus pencarian",
    chapters: "Bab",
    chapter: {
      battle: { name: "Pertempuran", short: "Tempur" },
      cards: { name: "Kartu", short: "Kartu" },
      units: { name: "Unit", short: "Unit" },
      keywords: { name: "Kata Kunci", short: "Kata Kunci" },
      statuses: { name: "Status dan Jenis Damage", short: "Status" },
      kinds: { name: "Ras dan Kelas", short: "Ras" },
      ranks: { name: "Peringkat", short: "Peringkat" },
      progress: { name: "Kemajuan", short: "Kemajuan" },
    },
    groups: { buff: "Buff", debuff: "Debuff", damageType: "Jenis Damage" },
    entryList: "Entri di {chapter}",
    results: "Hasil pencarian",
    resultCount: "Entri yang ditemukan: {count}",
    alias: "{alias} → {name}",
    noResult: "Tidak ada Entri yang cocok dengan “{query}”.",
    toBattle: "Buka Bab Pertempuran",
    back: "Kembali ke daftar",
    seeAlso: "Lihat juga",
    n: "N",
    x: "X",
    tokenX: "Token X",
    raceKeyword:
      "Kata Kunci Ras: {keyword}. Hanya Unit dari Ras ini yang bisa memilikinya.",
    keywordPlate:
      "Saat sebuah Kata Kunci terjadi dalam Pertempuran, namanya muncul di atas Unit.",
    tokenGallery: "Token di dalam game",
    tokenRank: "Peringkat",
    summonedBy: "Dipanggil oleh",
    tokenNotAtRank:
      "Tidak ada kartu yang membuat Token ini pada Peringkat ini.",
    tokenFirstRank: "Lihat pada {rank}",
    rankTable: "N pada tiap Peringkat",
    heynspireTable: {
      title: "Hadiah tiap Lantai",
      floorColumn: "Lantai",
      rewardColumn: "Hadiah",
      each: "Tiap Lantai, 1 sampai {last}",
      to: "sampai",
      xp: "{first} sampai {last} XP",
      fifth: "Lantai {floors}",
      boss: "Lantai Bos {floors}",
    },
    starsTable: "Cara mendapat tiap Bintang",
    starsColumn: "Bintang",
    starsConditionColumn: "Syarat",
    starsRow: {
      1: "Menangkan Pertempuran.",
      2: "Juga pertahankan setengah HP Pahlawanmu atau lebih di akhir.",
      3: "Juga selesaikan sebelum Giliran Bintang dari Tahap itu. Panel Tahapnya menunjukkannya.",
    },
    coinDenomTable: "Satu saldo, tiga koin",
    coinDenomColumn: "Koin",
    coinWorthColumn: "Nilai",
    coinRow: {
      gold: "100 Perak. Koin terbesar.",
      silver: "100 Tembaga.",
      copper:
        "Satuan terkecil. Game menyimpan saldo sebagai Tembaga lalu mengubahnya untuk tampilan.",
    },
    coinExampleCaption: "Saldo yang sama di piring Town",
    coinExampleNote:
      "Totalnya {copper} Tembaga. Emas dan Perak hanya cara game menampilkannya.",
    gearItemsTable: "4 Perlengkapan",
    gearItemColumn: "Perlengkapan",
    gearStatColumn: "Memberi",
    gearMaxColumn: "Level {max}",
    gearCostTable: "Koin dan Batu Tempa untuk tiap level",
    gearCostLevel: "Level {level}",
    gearCostStone: "1 × Batu Tempa {tier}",
    gearCostTier: "Batu Tempa {tier}: level {from} sampai {to}",
    gearCostTotal:
      "Level 0 sampai {max}: {coin} dan {stones} Batu Tempa dari tiap tingkat untuk tiap Perlengkapan.",
    coinUsesTable: "Koin dipakai untuk",
    coinUsesColumn: "Pemakaian",
    coinUse: {
      deckSlots: "Slot Dek tambahan di pembuat Dek.",
      packs: "Paket di layar Paket.",
      combine: "Gabung di Bengkel, mulai level Pemain {level}.",
      gear: "Peningkatan Perlengkapan di layar Pahlawan, mulai level Pemain {level}.",
    },
    packGuide: {
      shelf: "Tiga Paket",
      notBetter:
        "Paket yang lebih mahal bukan penawaran yang lebih baik. Tiap Paket punya tugas yang berbeda.",
      rollTitle: "Tiap kartu mengundi Peringkatnya",
      rollNote:
        "Tiap kartu dari {cards} kartu mengundi Peringkat dengan peluang ini. Kamu mendapat kartu itu di Peringkat tersebut. Tiap Paket berisi minimal 1 kartu Tak Biasa atau lebih tinggi.",
      guaranteeTitle: "Jaminan Paket",
      trackLabel:
        "Paket berturut-turut tanpa kartu itu: {opened} dari {before}. {guarantee}.",
      guaranteeNow: "Untukmu sekarang: {guarantee}.",
      guaranteeRule:
        "Jika {before} Paket berturut-turut tidak memberi {rank} atau lebih tinggi, Paket berikutnya memberikannya. Lalu hitungan mulai lagi dari 0.",
      guaranteeRuleTop:
        "Jika {before} Paket berturut-turut tidak memberi kartu {rank}, Paket berikutnya memberikannya. Lalu hitungan mulai lagi dari 0.",
      newCardFirst: "Kartu Baru Dulu",
      newCardFirstYes: "Memberi kartu yang belum kamu punya, jika bisa.",
      newCardFirstNo:
        "Memilih tiap kartu secara acak. Kamu bisa mendapat salinan kartu yang sudah kamu punya.",
      tenGuarantee: "10 Paket, dengan minimal 1 {rank} atau lebih tinggi.",
      tenExtra: "11 Paket dengan harga 10 Paket.",
      versionsTitle: "Paket Ras dan Paket Kelas",
      versions:
        "Paket Ras hanya berisi Kartu Makhluk dari satu Ras. Paket Kelas hanya berisi Kartu Keahlian dari satu Kelas. Cap pada Paket menunjukkannya. Harga masing-masing {price}, dan masing-masing memakai satu hitungan Jaminan Paket dengan {pack}.",
      allCards:
        "Paket dengan semua kartu berisi semua Kartu Makhluk, dan Kartu Keahlian dari Kelas Dek aktifmu.",
    },
    playerXpTable: "XP Kampanye menurut hasil",
    playerXpRegionColumn: "Wilayah",
    playerXpWinColumn: "Menang ulang",
    playerXpFirstColumn: "Menang pertama",
    playerXpLossColumn: "Kalah (maks.)",
    playerXpNote:
      "Menang pertama adalah kali pertama kamu menyelesaikan Tahap. Menang ulang dan Sweep Kampanye tidak memberi XP. Kekalahan memberi sebagian nilainya, sesuai HP yang kamu ambil dari Pahlawan musuh. Tahap Bos menggandakan semua nilai di tabel ini.",
    playerGrowthLevelColumn: "Level",
    playerGrowthHeroColumn: "HP Pahlawan",
    playerGrowthDeckColumn: "Dek maks",
    playerGrowthCountdownColumn: "Batas Hitung mundur",
    playerGrowthNote:
      "Tiap level menambah +1 HP Pahlawan. Ukuran Dek maks naik +1 tiap level, sampai 30. Batas Hitung mundur mengikuti aturan ukuran Dek.",
    playerUnlockTable: "Yang terbuka di tiap level",
    playerUnlockLevelColumn: "Level",
    playerUnlockWhatColumn: "Pembukaan",
    playerUnlock: {
      packs: "Paket di Town.",
      workshop: "Bengkel: Gabung dan Ekstrak.",
      gear: "Perlengkapan di Pahlawanmu.",
      craft: "Bengkel: Buat dan Lebur.",
      seaport: "Pelabuhan: Ekspedisi.",
      dungeon1: "Dungeon 1.",
      dungeon2: "Dungeon 2.",
      dungeon3: "Dungeon 3.",
    },
    rankColumn: "Peringkat",
    valueColumn: "N",
    rankGuideRankColumn: "Peringkat",
    rankGuideScaleColumn: "Serangan dan HP",
    rankGuideRecallColumn: "Kembali",
    rankGuideKeywordColumn: "Charge, Knockback, Bleed",
    rankGuideScaleNote:
      "Serangan dan HP memakai angka di wajah kartu sebagai nilai Biasa, lalu dikali faktor di tabel ini.",
    rankGuideKeywordNote:
      "N adalah angka pada beberapa Kata Kunci. Charge, Knockback dan Bleed memakai nilai di tabel ini. Kata Kunci lain bisa berbeda di tiap kartu.",
    commonRankFaceCaption: "Angka di wajah kartu",
    commonRankAttackLabel: "Serangan",
    commonRankHpLabel: "HP",
    commonRankFaceNote:
      "Salinan Biasa memakai Serangan {attack} dan HP {hp} di pertempuran — sama seperti tercetak. Peringkat lebih tinggi mengalikan nilai ini.",
    commonRankFactsCaption: "Pada Peringkat Biasa",
    commonRankFactsColumn: "Aturan",
    commonRankFactGems: "1 Permata Peringkat abu-abu di bingkai.",
    commonRankFactStats:
      "Serangan dan HP ×1,0 — pakai nilai di wajah kartu apa adanya.",
    commonRankFactCountdown: "Hitung Mundur tidak berubah dengan Peringkat.",
    rankTierStats:
      "{gems} Permata Peringkat di bingkai. Serangan dan HP ×{scale:number}. Peluang Kembali Kartu Keahlian: {recall}%.",
    rankTierIntro: {
      common:
        "Biasa adalah Peringkat terendah. Ini acuan Serangan dan HP di wajah setiap kartu.",
      uncommon: "Tak Biasa satu langkah di atas Biasa.",
      rare: "Langka ada di tengah dari lima Peringkat. Banyak kartu memakai Langka sebagai Peringkat dasarnya.",
      epic: "Epik adalah salinan kuat. Charge, Knockback dan Bleed bisa memakai N = 2.",
      legendary:
        "Legendaris adalah Peringkat tertinggi. Charge, Knockback dan Bleed bisa memakai N = 3.",
    },
    names: {
      board: "Papan",
      lane: "Jalur",
      square: "Petak",
      column: "Kolom",
      front: "Lini",
      summonZone: "Zona Panggil",
      closedLane: "Jalur Tertutup",
      side: "Pihak",
      hero: "Pahlawan",
      turn: "Giliran",
      startPhase: "Fase Awal",
      playPhase: "Fase Main",
      resolutionPhase: "Fase Resolusi",
      endPhase: "Fase Akhir",
      suddenDeath: "Mati Mendadak",
      routed: "Tercerai-berai",
      defeated: "Tumbang",
      creatureCard: "Kartu Makhluk",
      skillCard: "Kartu Keahlian",
      handLimit: "Batas Tangan",
      countdown: "Hitung mundur",
      recall: "Kembali",
      countdownLimit: "Batas Hitung mundur",
      unit: "Unit",
      ranged: "Jarak Jauh",
      movement: "Gerakan",
      token: "Token",
      status: "Status",
      damageType: "Jenis Damage",
      race: "Ras",
      class: "Kelas",
      rank: "Peringkat",
      rankGems: "Permata Peringkat",
      stars: "Bintang",
      sweep: "Sweep",
      playerLevel: "Level pemain",
      pack: "Paket",
      workshop: "Bengkel",
      gear: "Perlengkapan",
      seaport: "Pelabuhan",
      dungeon: "Dungeon",
      heynspire: "Heynspire",
      achievement: "Pencapaian",
    },
    entries: {
      board:
        "Papan adalah medan dari satu Pertempuran. Dalam satu Tahap, Papan punya {lanes} Jalur. Dalam satu Dungeon, Papan punya {dungeonLanes} Jalur.\n\nPahlawanmu ada di ujung kiri Jalur, dan Pahlawan musuh ada di ujung kanan. Unit-mu bergerak dari kiri ke kanan, dan Unit musuh bergerak dari kanan ke kiri.",
      lane: "Jalur adalah satu baris berisi {squares} Petak dari Pahlawanmu ke Pahlawan musuh.\n\nUnit selalu tetap di Jalurnya. Ia hanya bergerak di sepanjang Jalurnya.",
      square:
        "Petak adalah satu tempat di Jalur. Petak berisi 0 atau 1 Unit. Kamu memanggil Unit ke Petak yang kosong.",
      column:
        "Kolom adalah semua Petak dengan jarak yang sama dari satu Pahlawan, di semua Jalur.\n\nTiap Pihak menghitung Kolom dari Pahlawannya sendiri. Kolom 1-mu ada di sebelah Pahlawanmu, dan Kolom {squares}-mu ada di sebelah Pahlawan musuh.",
      front:
        "Lini dari seorang Pahlawan adalah Jalur yang ada di depan Pahlawan itu. Dalam satu Tahap, tiap Pahlawan punya Lini berupa semua Jalur. Dalam satu Dungeon, tiap Bos punya Lini berupa 1 Jalur atau lebih yang bersebelahan, dan tiap Jalur ada di satu Lini.\n\nUnit di ujung Jalurnya menyerang Pahlawan musuh dari Lini itu.",
      summonZone:
        "Zona Panggilmu adalah Kolom 1 sampai {columns}-mu, di semua Jalur. Kamu hanya bisa memanggil Unit ke Petak kosong di Zona Panggilmu.\n\nKamu juga bisa memanggil ke Petak yang ada di belakang Unit musuh. Unit jarak dekat hanya menyerang ke depan, jadi kedua Unit ini tidak bertarung.\n\nUnit dengan Tembok juga bisa masuk ke Kolom {next} dan {wall}-mu.",
      closedLane:
        "Di Jalur Tertutup, tidak ada Pihak yang bisa memanggil Unit, dan tidak ada Kartu Keahlian yang bisa menargetkan Petak.\n\nBeberapa Tahap punya Jalur Tertutup. Jalur itu terbuka pada nomor Giliran tertentu, atau tetap tertutup selama Pertempuran.",
      side: "Pihak adalah salah satu dari dua tim dalam Pertempuran: Pihakmu dan Pihak musuh. Pihakmu punya 1 Pahlawan. Dalam satu Tahap, Pihak musuh punya 1 Pahlawan. Dalam satu Dungeon, Pihak musuh punya 1 Pahlawan untuk tiap Bos.\n\nPihakmu ada di kiri Papan, dan Pihak musuh ada di kanan.",
      hero: "Pahlawan adalah pemimpin dari satu Pihak. Ia berdiri di belakang Lini-nya, di luar Papan.\n\nPahlawan punya HP, Kelas, dan Dek. Saat HP-nya menjadi 0, Pahlawan itu Tumbang.",
      turn: "Dalam satu Giliran, satu Pihak memainkan kartunya, dan Unit-nya bertindak. Giliran punya 4 bagian: Fase Awal, Fase Main, Fase Resolusi, dan Fase Akhir.\n\nKamu mengambil Giliran pertama. Lalu musuh mengambil Giliran. Nomor Giliran naik 1 setelah kedua Pihak mengambil Giliran.",
      startPhase:
        "Fase Awal adalah bagian pertama Giliranmu. Hal-hal ini terjadi dengan urutan ini:\n\n1. Efek seperti Regenerasi dan Semangat terjadi.\n\n2. Mulai Giliran {turn}, damage Mati Mendadak mengenai Pahlawanmu.\n\n3. Hitung mundur dari tiap kartu di Tanganmu yang belum Siap turun 1.\n\n4. Pahlawanmu mengambil 1 kartu, jika Tangan berisi kurang dari {limit} kartu.",
      playPhase:
        "Di Fase Main, kamu memainkan kartu yang Siap. Kamu bisa memainkan semuanya, dengan urutan apa pun, atau tidak memainkan kartu.\n\nKartu Makhluk masuk ke Petak kosong di Zona Panggilmu. Kartu Keahlian menuju targetnya.\n\nPilih Akhiri Giliran untuk mengakhiri Fase Main. Tidak ada batas waktu.",
      resolutionPhase:
        "Di Fase Resolusi, Unit-mu bertindak sendiri. Kamu tidak mengendalikannya.\n\nMereka bertindak Jalur demi Jalur, dari Jalur 1 sampai Jalur terakhir. Di tiap Jalur, Unit yang paling dekat dengan Pahlawan musuh bertindak lebih dulu. Tiap Unit bergerak, lalu menyerang. Unit yang kamu panggil di Giliran ini juga bertindak.\n\nUnit musuh tidak bertindak. Mereka hanya bisa memakai Balas dan Serang Duluan.",
      endPhase:
        "Fase Akhir adalah bagian terakhir Giliranmu. Damage Terbakar dan Racun mengenai Unit-mu. Lalu efek berwaktu turun 1, dan Unit dengan 0 HP meninggalkan Papan.\n\nLalu musuh mengambil Gilirannya.",
      suddenDeath:
        "Mati Mendadak membuat tiap Pertempuran berakhir. Mulai Giliran {turn}, Pahlawan dari Pihak yang aktif menerima 1 damage di tiap Fase Awal. Mulai Giliran {double}, damage-nya 2.\n\nJika belum ada Pihak yang menang di akhir Giliran {limit}, musuh menang.",
      routed:
        "Pihak Tercerai-berai saat tidak punya Unit di Papan dan tidak punya kartu di Tangan dan Dek. Pihak yang Tercerai-berai tidak bisa bertindak lagi, jadi ia kalah. Pemeriksaan ini terjadi di akhir setiap Giliran.\n\nAturan ini sama untukmu dan untuk musuh.",
      defeated:
        "Pahlawan dengan 0 HP Tumbang. Saat semua Pahlawan dari satu Pihak Tumbang, Pihak itu kalah.\n\nDalam satu Tahap, tiap Pihak punya 1 Pahlawan, jadi Pahlawan dengan 0 HP mengakhiri Pertempuran. Dalam satu Dungeon, Bos yang Tumbang keluar dari Pertempuran: Unit-nya meninggalkan Papan, dan Lini-nya pindah ke Bos terdekat yang belum Tumbang. Pertempuran berlanjut sampai semua Bos Tumbang, atau Pahlawanmu Tumbang.",
      creatureCard:
        "Kartu Makhluk memanggil Unit ke Papan. Kartu ini punya Ras, Serangan, dan HP. Beberapa Kartu Makhluk punya Kata Kunci.\n\nSaat Unit-nya mati, kartu itu masuk ke Kuburanmu.",
      skillCard:
        "Kartu Keahlian punya efek sekali pakai, misalnya damage ke Unit musuh. Kartu ini punya Kelas. Hanya Pahlawan dengan Kelas yang sama yang bisa memakainya.\n\nSetelah efeknya, Kembali bisa mengirim kartu itu kembali ke Tanganmu.",
      hand: "Tanganmu adalah kartu yang dipegang Pahlawanmu dalam Pertempuran. Kartu itu tampil di bagian bawah layar.\n\nDi awal Pertempuran, Pahlawanmu mengambil {start} kartu. Tiap kartu di Tangan menunjukkan Hitung mundurnya.",
      handLimit:
        "Tanganmu bisa berisi paling banyak {limit} kartu. Saat Tanganmu penuh, Pahlawanmu tidak mengambil kartu, dan kartu itu tetap di Dek.",
      deck: "Dek-mu adalah kartu yang dibawa Pahlawanmu ke Pertempuran. Kamu menyusunnya di penyusun Dek.\n\nDek boleh berisi paling banyak {copies} salinan dari satu kartu. Dek hanya boleh berisi Kartu Keahlian dari Kelas Pahlawanmu.\n\nDalam Pertempuran, Dek hanya berisi kartu yang belum diambil Pahlawanmu.",
      graveyard:
        "Kuburan berisi kartumu yang sudah dipakai atau mati. Kartu Makhluk masuk ke sana saat Unit-nya mati. Kartu Keahlian masuk ke sana saat Kembali tidak mengirimnya kembali.",
      countdown:
        "Hitung mundur adalah jumlah Giliranmu sampai kartu Siap. Angkanya tampil di sudut kiri atas kartu.\n\nDi Fase Awal-mu, Hitung mundur dari tiap kartu di Tanganmu yang belum Siap turun 1. Peringkat kartu tidak mengubah Hitung mundurnya.",
      ready:
        "Kartu dengan Hitung mundur 0 adalah kartu yang Siap. Hanya kartu Siap yang bisa dimainkan. Kartu Siap bercahaya di Tanganmu.",
      recall:
        "Kembali adalah peluang Kartu Keahlian kembali ke Tanganmu setelah efeknya. Peringkat kartu menentukan peluangnya: dari {low}% pada Biasa sampai {high}% pada Legendaris.\n\nKartu yang kembali punya Hitung mundur penuh lagi. Jika tidak, kartu masuk ke Kuburan.",
      countdownLimit:
        "Batas Hitung mundur adalah jumlah maksimum Hitung mundur dari kartu di Dek-mu. Tiap kartu dihitung, juga Kartu Keahlian.\n\nPada Level pemain 1, batasnya {first}. Batas ini naik dengan Level pemainmu. Dek musuh dalam Tahap tidak punya batas ini.",
      unit: "Unit adalah figur di Papan. Kartu Makhluk menaruhnya di sana.\n\nUnit menunjukkan Serangan dan HP-nya di kakinya. Unit-mu menghadap Pahlawan musuh, dan Unit musuh menghadap Pahlawanmu.",
      attack:
        "Serangan adalah damage yang diberikan Unit dengan satu serangan. Benteng dari target bisa memperkecil damage itu.\n\nUnit dengan Serangan 0 di kartunya tidak pernah menyerang, juga dengan bonus. Peringkat yang lebih tinggi memberi Serangan lebih besar.",
      hp: "HP adalah nyawa dari Unit atau Pahlawan. Damage menurunkannya, dan penyembuhan mengembalikannya sampai maksimumnya.\n\nPada 0 HP, Unit meninggalkan Papan, dan Pahlawan Tumbang. Peringkat yang lebih tinggi memberi HP lebih banyak.",
      speed:
        "Kecepatan adalah jumlah Petak maksimum yang ditempuh Unit ke depan dalam satu Giliran. Setiap Unit punya Kecepatan 2. Gesit, Lesat, dan Berat mengubahnya.\n\nTembok tidak pernah bergerak.",
      range:
        "Jangkauan adalah jumlah Petak maksimum di depan Unit tempat ia bisa menyerang. Setiap Unit punya Jangkauan 1. Jangkauan Sedang, Jangkauan Jauh, dan Jangkauan Ekstrem memberi Jangkauan lebih.\n\nUnit dengan Jangkauan 1 adalah Unit jarak dekat. Unit dengan Jangkauan 2 atau lebih adalah Unit jarak jauh. Kartu Keahlian bisa memberi bonus Jangkauan untuk waktu singkat. Saat itu, Unit jarak dekat menyerang sebagai Unit jarak jauh.",
      melee:
        "Unit jarak dekat punya Jangkauan 1. Ia menyerang Unit musuh di Petak berikutnya di depannya.\n\nSaat ia ada di Kolom terakhirnya dan tidak ada Unit musuh di depannya, ia menyerang Pahlawan musuh.",
      ranged:
        "Unit jarak jauh punya Jangkauan 2 atau lebih. Ia menyerang Unit musuh terdekat di depannya, di Jalurnya dan dalam Jangkauannya. Ia tidak bergerak saat ada Unit musuh dalam Jangkauannya.\n\nSaat tidak ada Unit musuh dalam Jangkauannya dan Pahlawan musuh ada di dalamnya, ia menyerang Pahlawan musuh. Pahlawan musuh berjarak 1 Petak setelah Kolom terakhir.",
      movement:
        "Dalam aksinya, Unit lebih dulu bergerak maju di sepanjang Jalurnya, sampai sejauh Kecepatannya.\n\nIa bergerak melewati Unit kawan, tetapi berhenti sebelum Unit musuh. Ia selalu berhenti di Petak kosong. Unit Terbang bergerak melewati semua Unit, tetapi berhenti sebelum Unit Terbang musuh.",
      token:
        "Token adalah Unit yang dibuat oleh sebuah efek, misalnya Panggil X. Token bukan kartu, jadi ia tidak pernah ada di Tangan atau Dek-mu.\n\nToken punya Peringkat dari kartu yang membuatnya. Saat mati, ia menghilang. Ia tidak masuk ke Kuburan.\n\nToken adalah Unit kawan bagi Unit di Pihaknya, misalnya untuk Gerombolan.",
      status:
        "Status adalah efek yang tetap ada pada Unit. Buff membantu Unit, misalnya Pelindung. Debuff merugikannya. Damage Api dan Es serta beberapa Kata Kunci memberi Debuff.\n\nUnit menunjukkan Status-nya sebagai ikon di atasnya. Ikon Buff punya cincin emas. Detail Kartu dari Unit itu menunjukkan tiap Status dengan aturannya.",
      damageType:
        "Tiap serangan dan tiap efek damage punya Jenis Damage: Fisik, Api, Es, Suci, atau Petir.\n\nDi kartu, Jenis Damage tampil sebagai ikon dan warna dari Serangan.",
      damagePhysical: "Fisik: damage biasa. Benteng menguranginya.",
      race: "Ras adalah bangsa yang dibela Kartu Makhluk. Ras tampil di lambang di sudut kanan atas kartu.\n\nDek boleh mencampur semua Ras. Tiap Ras punya gaya bermainnya sendiri.",
      raceHuman:
        "Manusia dan orang-orang tangguh dari kota sungai. Mereka menahan barisan dengan Benteng, Tembok, dan dukungan untuk kawan.",
      raceElf:
        "Elf dari hutan tua, dan roh tanaman yang bertarung bersama mereka. Mereka mengendalikan Jalur dari jauh dengan Jerat, penyembuhan, dan Racun.",
      raceUndead:
        "Roh tua yang memakai tulang dan zirah. Banyak Unit kecil yang menjadi lebih kuat bersama-sama dan bangkit kembali.",
      raceOrc:
        "Suku Orc dari tanah tandus, dan binatang mereka. Cepat dan berisik, dengan Serangan tinggi dan HP rendah. Mereka menyerbu Pahlawan musuh.",
      raceGoblin:
        "Goblin dari tambang bukit: tukang, pencuri, dan pembuat bom. Unit kecil yang memperlambat rencana musuh.",
      raceFeral:
        "Makhluk liar dari puncak gunung dan gua dalam. Mereka tidak melayani bangsa mana pun. Jumlahnya sedikit, tubuhnya besar dan lambat, dengan Serangan dan HP tinggi.",
      class:
        "Kelas dari Pahlawan menentukan Kartu Keahlian yang boleh ada di Dek-nya. Kamu memilih Kelas dari tiap Dek di penyusun Dek.\n\nKartu Keahlian menunjukkan Kelas-nya di lambangnya.",
      classWarrior:
        "Bonus dan kecepatan. Kartu Keahlian Prajurit membuat kartumu lebih cepat Siap dan memberi Benteng ke Unit-mu.",
      classRanger: "Kendali, dan damage ke Pahlawan musuh.",
      classMage:
        "Damage area. Kartu Keahlian Penyihir mengenai Unit musuh dengan Api, Es, dan Petir.",
      classPriest:
        "Penyembuhan, perlindungan, dan damage Suci. Kartu Keahlian Pendeta menyembuhkan dan melindungi Unit-mu. Block tidak berlaku pada damage Suci.",
      rank: "Peringkat adalah seberapa kuat satu salinan kartu. Ada lima Peringkat, dari Biasa sampai Legendaris.\n\nTiap kartu punya Peringkat dasar. Salinanmu tidak pernah di bawah Peringkat itu.",
      rankGems:
        "Permata Peringkat adalah berlian kecil di bagian atas kartu. Hitung jumlahnya: 1 permata adalah Biasa, 5 permata adalah Legendaris.\n\nTiap Peringkat punya warna permata, tapi jumlahnya sudah cukup untuk membaca Peringkat di Pertempuran.",
      stars:
        "Saat menang di Tahap, kamu mendapat 1 sampai 3 Bintang. Kalah memberi 0 Bintang.\n\nTiap Bintang menambah syarat di atas yang sebelumnya. Setengah HP Pahlawan berarti Pahlawanmu punya minimal 50% dari HP maksimumnya saat Pertempuran berakhir. Giliran Bintang adalah nomor Giliran yang harus didahului oleh kemenangan 3 Bintang. Tiap Tahap punya Giliran Bintang sendiri, dan Panel Tahapnya menunjukkannya.\n\nKampanye menyimpan Bintang terbaikmu untuk tiap Tahap. Total Bintang di satu Wilayah membuka peti pada 10, 20 dan 30 Bintang.",
      sweep:
        "Sweep langsung memberi hadiah kemenangan ulang dari satu Tahap atau Dungeon. Tidak ada Pertempuran, dan Sweep selalu menang. Satu Sweep memakai 1 sampai {max} Tiket, dan tiap Tiket memberi satu hadiah kemenangan ulang.\n\nSweep Kampanye: saat Bintang terbaikmu di satu Tahap adalah 3, Panel Tahap-nya punya tombol Sweep. Sweep ini memakai Tiket Sweep Kampanye. Tiap Tiket memberi Koin, serta peluang kartu dan Batu Tempa dari Tahap itu. Tiket ini tidak memberi XP.\n\nSweep Dungeon: setelah kamu memenangkan satu Dungeon, layar Dungeon punya tombol Sweep untuknya. Sweep ini memakai Tiket Sweep Dungeon. Tiap Tiket memberi Koin dan XP atau Esensi dari Dungeon itu, serta peluang kartu dan Batu Tempa.\n\nKelas Dek Aktif-mu menentukan kartu yang bisa diberikan Sweep. Sweep tidak pernah mengubah Bintang atau kemenangan Dungeon-mu, dan tidak memberi Tiket.\n\nTiap kemenangan Tahap memberi {campaignTickets} Tiket Sweep Kampanye. Tiap kemenangan Dungeon memberi {dungeonTickets} Tiket Sweep Dungeon. Kekalahan tidak memberi Tiket. Kedua jenis Tiket tidak pernah berubah menjadi satu sama lain, dan kamu tidak bisa membelinya.",
      playerLevel:
        "Level pemain adalah progres akun dari 1 sampai {maxLevel}. XP dari Pertempuran mengisi bilah. Kamu mendapat XP dari Pertempuran, juga saat kalah. Kekalahan memberi XP dan Koin hanya untuk HP yang kamu ambil dari Pahlawan musuh. Kemenangan ulang di Tahap dan Sweep Kampanye tidak memberi XP.",
      coin: "Koin adalah satu saldo. Piring saldo Town, kanan atas, menampilkannya sebagai Emas, Perak, dan Tembaga. Hanya denominasi yang bukan nol yang muncul.\n\nGunakan tabel di bawah untuk konversi dan untuk pemakaian Koin saat ini.",
      pack: "Paket berisi {cards} kartu acak. Kamu membelinya dengan Koin di layar Paket. Toko kartu di Kota dan pintasan Paket membukanya.\n\nDi level Pemain 2, kamu mendapat satu Paket Penjaja. Paket dari hadiah menunggu di layar Paket sampai kamu membukanya, gratis. Tombol Peluang Muncul di layar Paket menunjukkan semua angka dan aturannya.",
      workshop:
        "Bengkel membuat kartumu lebih kuat. Bengkel di Kota dan pintasan Bengkel membukanya, mulai level Pemain {combine}.\n\nBengkel punya 4 stasiun: Gabung, Buat, Lebur, dan Ekstrak. Pilih stasiun di atas, lalu pilih kartu. Stasiun menandai kartu yang bisa ia proses sekarang, dan filternya bisa menampilkan hanya kartu itu. Salinan cadangan adalah salinan yang tidak dipakai Dek tersimpan mana pun.\n\nGabung: 2 salinan kartu di satu Peringkat menjadi 1 salinan di Peringkat berikutnya, dengan Koin. Gabung tidak pernah gagal. Dek tersimpan yang memakai salinan lama mendapat salinan baru.\n\nEkstrak: 1 salinan menjadi Esensi. Kamu bisa Ekstrak salinan mana pun, juga salinan terakhir, dan kartu itu tetap ditemukan. Bengkel bertanya dulu jika Dek tersimpan memakai salinan itu, atau jika salinan itu Epik atau Legendaris.\n\nBuat: mulai level Pemain {craft}, Esensi menjadi 1 salinan kartu yang sudah kamu temukan, di Peringkat dasarnya. Hanya kartu dengan Peringkat dasar Biasa, Tak Biasa, atau Langka yang bisa dibuat: kartu Epik atau Legendaris tidak bisa dibuat. Kartu yang ditemukan adalah kartu yang pernah kamu miliki, minimal satu kali. Kartu dengan 0 salinan tetap ditemukan, juga setelah kamu Ekstrak salinan terakhirnya, jadi kamu bisa Buat kartu itu. Kamu tidak bisa Buat kartu yang belum pernah kamu miliki. Untuk mendapat kartu baru, buka Paket: Paket Saudagar dan Paket Kerajaan memilih kartu yang belum kamu punya, jika Peringkat yang keluar mengizinkannya. Atau pakai Lebur.\n\nLebur: mulai level Pemain {fuse}, 2 sampai 4 salinan dan Esensi menjadi 1 salinan kartu yang belum kamu temukan. Semua salinan punya Peringkat yang sama, dan semuanya Kartu Makhluk atau semuanya Kartu Keahlian. Biasa dan Tak Biasa memakai 2 salinan, Langka memakai 3, dan Epik memakai 4. Salinan Legendaris tidak bisa masuk. Kartu baru punya Peringkat dasar yang sama dengan Peringkat salinan, dan punya Ras atau Kelas dari salah satu salinan. Setiap salinan memberi Ras atau Kelasnya satu bagian peluang yang sama: Manusia + Manusia + Elf memberi Manusia 2 dari 3 dan Elf 1 dari 3. Ras atau Kelas yang tidak punya kartu tersisa untuk ditemukan tidak mendapat bagian. Panel menampilkan setiap peluang dan setiap kartu yang bisa keluar. Jika kamu sudah menemukan semua kartu yang bisa diberikan salinan itu, kamu tidak bisa meleburnya. Biaya Esensi: Biasa {common}, Tak Biasa {uncommon}, Langka {rare}, Epik {epic}. Bengkel bertanya dulu jika Dek tersimpan memakai salah satu salinan.",
      gear: "Pahlawanmu punya 4 Perlengkapan: Senjata, Zirah, Jimat, dan Panji. Barak di Kota dan pintasan Pahlawan membuka layar Pahlawan, mulai level Pemain {level}.\n\nTiap Perlengkapan punya level dari 0 sampai {max}. Satu peningkatan menambah 1 level, dengan Koin dan 1 Batu Tempa. Level menentukan tingkat Batu Tempa: Biasa untuk level 1 sampai 5, Tak Biasa untuk 6 sampai 10, Langka untuk 11 sampai 15, Epik untuk 16 sampai 20, dan Legendaris untuk 21 sampai 25. Batu Tempa dari tingkat lain tidak bisa menggantikannya. Peningkatan tidak pernah gagal, dan level tidak pernah turun.\n\nKemenangan Tahap, peti Bintang, Sweep, Dungeon, dan Heynspire memberi Batu Tempa. Kamu tidak bisa membelinya. Layar Pahlawan menampilkan Batu Tempa yang kamu punya.\n\nSerangan Crit memberi 2 kali damage-nya. Serangan yang di-Block memberi setengah damage-nya. Di tiap Pertempuran, Pahlawan dan Unit-mu memakai Perlengkapanmu.",
      seaport:
        "Pelabuhan mengirim kapal Kota untuk Ekspedisi. Dermaga Pelabuhan di Kota dan pintasan Pelabuhan membukanya, mulai level Pemain {level}.\n\nPelabuhan punya 1 kapal, jadi kapal pergi ke 1 Ekspedisi pada satu waktu. Pilih Muatan dan lama pergi, lalu berangkatkan kapal. Setelah itu kamu bisa menutup permainan. Ada {count} Muatan, dan tiap Muatan hanya memberi 1 jenis hadiah: Koin, XP, Esensi, atau Batu Tempa. Lama pergi dari {shortest} jam sampai {longest} jam. Muatan dan lama pergi yang lebih panjang terbuka pada level Pemain yang lebih tinggi. Manifes menunjukkan hadiah penuh dan waktu kapal kembali.\n\nHadiahnya bertambah untuk tiap jam kapal pergi, dan pelayaran yang lebih lama memberi sedikit lebih banyak tiap jam. Hadiahnya berhenti pada lama pergi yang kamu pilih, dan kapal menunggumu. Kamu bisa mengambil hadiah kapan saja. Ambil lebih awal memberi bagian dari waktu kapal pergi, lalu kapal kembali ke dermaga.\n\nMuatan Batu Tempa memberi Batu Tempa hanya setelah pelayaran penuh: pelayaran yang lebih lama memberi tingkat yang lebih tinggi. Jika kamu memanggil kapal pulang lebih awal, kamu tidak mendapat Batu Tempa.\n\nKamu tidak pernah kehilangan apa pun yang sudah kamu ambil: tidak ada waktu minimum dan tidak ada hukuman saat kamu pergi lama. Pelabuhan memakai jam perangkatmu. Saat jamnya mundur, Ambil berhenti sampai jamnya benar lagi.",
      dungeon:
        "Dungeon adalah tempat di luar Kampanye. Gua di Kota dan pintasan Dungeon membuka layar Dungeon, mulai level Pemain {level}.\n\nDi Dungeon, kamu melawan semua Bos-nya dalam satu Pertempuran. Papan punya {lanes} Jalur. Tiap Bos adalah Pahlawan musuh dengan Lini, Tangan, dan Dek sendiri. Unit di ujung Jalur menyerang Bos dari Lini itu.\n\nAturan Bos aktif satu kali, saat HP Bos-nya turun ke persen tertentu atau lebih rendah. Bar HP Bos menunjukkan takik di persen itu.\n\nKemenangan Dungeon tidak memberi Bintang. Setelah menang, kamu bisa memainkan Dungeon itu lagi atau melakukan Sweep. Tiap kemenangan Dungeon memberi {tickets} Tiket Sweep Dungeon.",
      heynspire:
        "Heynspire adalah menara tinggi di Kota. Heynspire terbuka setelah kemenangan pertama di Tahap {stage}. Menara di Kota dan pintasan Heynspire membukanya.\n\nHeynspire punya {floors} Lantai. Kamu hanya melawan Lantai Saat Ini: Lantai terendah yang belum kamu menangkan. Pertempuran Lantai punya {lanes} Jalur dan 1 Pahlawan musuh, dengan Lini di semua Jalur.\n\nTiap Lantai ke-{every} adalah Lantai Bos: satu Bos Kampanye kembali dengan Dek baru. Lantai Bos tidak punya Aturan Bos.\n\nTiap Lantai memberi hadiahnya satu kali, saat kamu memenangkannya. Kamu tidak bisa memainkan Lantai yang sudah menang lagi, dan tidak bisa melakukan Sweep di sana. Kemenangan juga memberi {tickets} Tiket Sweep Kampanye. Kekalahan memberi sebagian Koin dan XP, sesuai HP yang kamu ambil dari Pahlawan musuh.",
      achievement:
        "Pencapaian adalah tujuan dengan hadiah. Balai panji di Kota dan pintasan Pencapaian membuka layar Pencapaian. Layar itu menampilkan semua {count} Pencapaian dalam 4 kelompok: Kampanye, Dungeon dan Heynspire, Kemajuan, serta Aksi Hebat.\n\nPencapaian mula-mula Sedang berjalan, lalu Selesai, lalu Diklaim. Saat kamu memenuhi tujuannya pertama kali, Pencapaian itu menjadi Selesai, dan tetap Selesai. Lalu tekan Klaim di layar Pencapaian untuk mendapat hadiahnya. Klaim semua mengklaim semua Pencapaian yang Selesai sekaligus. Lencana di pintasan Pencapaian menunjukkan jumlah hadiah yang bisa diklaim.\n\nAksi Hebat adalah Pencapaian yang diselesaikan oleh satu Pertempuran yang kamu menangkan: Tahap, Dungeon, atau Lantai yang kamu mainkan. Sweep, Replay, Auto-play, dan Tutorial tidak pernah menyelesaikan Aksi Hebat. Kekalahan juga tidak.\n\nSebagian besar hadiah adalah Heynstone. Sebagian lain adalah Koin atau Esensi. {cosmetics} Pencapaian sulit memberi Kosmetik khusus hadiah. Kosmetik hadir di pembaruan nanti: game menyimpan Kosmetikmu sampai saat itu.\n\nTidak ada Pencapaian yang bisa terlewat. Kamu selalu bisa menyelesaikan tiap Pencapaian nanti.",
    },
    aliases: {
      achievement:
        "trofi, piala, misi, lencana, tantangan, prestasi, achievement, trophy, quest, feat",
      heynspire: "menara, tower, spire, endless tower, panjat",
      board: "medan, arena, peta, battlefield, map",
      lane: "baris, lorong, row, path",
      square: "kotak, sel, tile, cell",
      side: "tim, regu, team",
      hero: "komandan, jenderal, avatar, commander",
      turn: "ronde, babak, round",
      resolutionPhase: "fase tempur, fase otomatis, combat phase",
      suddenDeath: "kelelahan, perpanjangan waktu, fatigue, overtime",
      routed: "kehabisan kartu, menyerah, surrender",
      defeated: "mati, terbunuh, kalah, dead",
      creatureCard: "kartu minion, kartu pasukan, minion card",
      skillCard: "mantra, sihir, spell",
      handLimit: "ukuran tangan, hand size",
      deck: "pustaka, tumpukan ambil, library, loadout",
      graveyard: "tumpukan buang, pemakaman, discard pile",
      countdown: "mana, biaya, cost, cooldown, waktu tunggu, timer",
      ready: "bisa dimainkan, tersedia, playable",
      recall: "mastery, peluang kembali",
      countdownLimit: "biaya dek, batas mana, deck cost, mana cap",
      unit: "minion, makhluk, pasukan, karakter, creature",
      hp: "nyawa, darah, kesehatan, health, life",
      range: "jarak serang, reach",
      movement: "jalan, maju, gerak, walk",
      keywordCharge: "haste, rush, serbu, terjang",
      keywordKnockback: "dorong, push, pukul mundur",
      keywordLastBreath: "deathrattle, efek kematian",
      keywordTrample: "tembus, cleave, pierce",
      keywordWall: "taunt, penghalang, blocker",
      keywordEntangle: "root, snare, akar",
      keywordPoison: "bisa, venom, toxin",
      keywordSabotage: "tunda, delay, ganggu",
      keywordRebirth: "hidup lagi, lahir kembali, reborn, revive",
      keywordSummon: "munculkan, ciptakan, spawn",
      keywordSwarm: "kawanan, keroyok, pack",
      token: "bidak, spawn, unit panggilan",
      keywordUnique: "legend rule, satu-satunya",
      keywordRegenerate: "regeneration, regen",
      keywordRetaliate:
        "balasan, serangan balik, retaliation, thorns, counterattack",
      keywordBulwark: "zirah, armor, pengurangan damage, ketahanan",
      status: "debuff, kondisi, efek buruk",
      statusFreeze: "stun, membeku, pingsan",
      statusParalyze: "kesetrum, setrum, shock, disarm",
      statusBleed: "luka, anti-heal, kurangi penyembuhan",
      statusHobble: "lambat, slow, lumpuh",
      statusWard: "perisai, shield, barrier, serap, buff",
      statusSteadfast: "bertahan, tak mati, endure, undying, last stand",
      statusExposed: "rentan, lemah, ditandai, vulnerable, armor break",
      statusGrounded: "jatuh, tak bisa terbang, anti-udara, downed, anti-air",
      damageType: "elemen, element",
      race: "faksi, suku, kerajaan, faction",
      class: "pekerjaan, profesi, job",
      rank: "kelangkaan, rarity, tier, kualitas",
      rankGems: "pip, titik",
      stars: "skor, nilai, score",
      sweep:
        "auto battle, auto-play, quick battle, auto-resolve, raid, skip ticket, raid ticket, sweep ticket, boss ticket, farm, sapu, ulang, tiket",
      playerLevel: "level akun, xp",
      coin: "emas, perak, tembaga, uang, gold",
      pack: "booster, paket kartu, loot box, peti, chest, peluang, odds",
      workshop:
        "tempa, forge, crafting, upgrade, fuse, merge, naik level, dust, disenchant, salvage",
      gear: "equipment, gear, item, senjata, zirah, gudang senjata, enchant, refine, upgrade, crit, block",
      seaport:
        "idle, afk, offline, ekspedisi, pelayaran, kapal, pelabuhan, dermaga, port, harbor, expedition",
      dungeon: "raid, boss rush, multi-bos, world boss, instance, gua",
    },
  },
  packs: {
    label: "Paket",
    title: "Paket",
    names: {
      peddler: "Paket Penjaja",
      merchant: "Paket Saudagar",
      royal: "Paket Kerajaan",
    },
    jobs: {
      peddler:
        "Kartu terbanyak untuk tiap Koin. Tanpa kartu Epik atau Legendaris.",
      merchant: "Semua Peringkat kecuali Legendaris. Kartu Baru Dulu.",
      royal: "Tanpa kartu Biasa. Satu-satunya Paket dengan kartu Legendaris.",
    },
    pool: {
      label: "Kartu di dalam Paket",
      kind: "Kartu",
      all: "Semua kartu",
      creature: "Kartu Makhluk",
      skill: "Kartu Keahlian",
      race: "Ras",
      class: "Kelas",
    },
    open: "Buka",
    openTen: "Buka ×10",
    openTenPlus: "Buka ×10 (+1)",
    openLabel: "{action}: {pack}, {price}",
    openFreeLabel: "Buka satu {pack}, gratis",
    missingLabel: "{action}: {pack}. Kamu perlu {amount} lagi.",
    need: "Perlu {amount}",
    rankBar: "Peluang Muncul: {rates}",
    progress: {
      label: "Kartu ditemukan",
      value: "{found} / {total}",
      aria: "Kartu yang ditemukan di kumpulan ini: {found} dari {total}",
    },
    unopened: {
      label: "Paketmu",
      openRaceLabel: "Buka satu {pack}, gratis. Pilih Ras dulu.",
      count: "×{count}",
      raceTitle: "Pilih Ras",
      raceText: "{pack}-mu memberi Kartu Makhluk dari satu Ras.",
      raceClose: "Tutup",
    },
    again: "Buka lagi",
    againLabel: "Buka satu {pack} lagi, {price}",
    shopkeeper: {
      label: "Pemilik toko",
      talk: "Bicara dengan pemilik toko",
      unopened:
        "Selamat datang, teman! Ada Paket untuk kamu buka. Yang itu tanpa Koin.",
      welcome: {
        a: "Paket segar, baru datang dari percetakan!",
        b: "Selamat datang lagi! Awas kucingnya. Dia tidur di atas kartu Langka.",
        c: "Senang bertemu lagi! Mau lihat yang mana hari ini?",
      },
      all: "Semua kartu di satu rak. Pilih Ras atau Kelas untuk melihat lebih dekat.",
      races: {
        human: "Kartu Manusia. Orang yang tenang, jago memakai perisai.",
        orc: "Kartu Orc. Pegang dengan dua tangan.",
        goblin: "Kartu Goblin. Hitung jarimu sesudahnya.",
        feral: "Kartu Buas. Mereka cuma menggigit sedikit.",
        elf: "Kartu Elf. Hati-hati dengan durinya.",
        undead: "Kartu Undead. Mereka selalu kembali.",
      },
      classes: {
        warrior:
          "Kartu Keahlian Prajurit. Suaranya keras. Jauhkan dari kaca, ya.",
        ranger:
          "Kartu Keahlian Pemanah. Tidak pernah meleset. Yah, hampir tidak pernah.",
        mage: "Kartu Keahlian Penyihir. Tolong jangan dibaca keras-keras di sini.",
        priest:
          "Kartu Keahlian Pendeta. Memegangnya saja sudah membuat hatiku tenang.",
      },
      complete: "Kamu sudah menemukan semua kartu di rak ini! Hebat sekali.",
      reactions: {
        legendary: "Legendaris! Sudah kuduga Paket itu bersinar!",
        epic: "Kartu Epik! Itu tarikan yang bagus.",
        rare: "Kartu Langka! Lumayan sekali.",
        fresh: "Wajah baru untuk Koleksimu. Sambut mereka!",
        copies: "Salinan lebih? Setiap kartu ada gunanya. Sungguh!",
      },
    },
    guarantee: {
      inPacks: "{rank} atau lebih tinggi dalam {count} Paket",
      next: "{rank} atau lebih tinggi di Paket berikutnya",
      top: "{rank} dalam {count} Paket",
      topNext: "{rank} di Paket berikutnya",
    },
    rates: {
      button: "Peluang Muncul",
      title: "Peluang Muncul dan aturan Paket",
      close: "Tutup Peluang Muncul",
      caption: "Peluang Muncul dan aturan tiap Paket",
      each: "Peluang tiap Peringkat, untuk tiap kartu di dalam Paket.",
      rank: "Peringkat",
      guarantee: "Jaminan Paket",
      tenBonus: "Bonus Buka ×10",
      ten: {
        peddler: "Minimal 1 Langka atau lebih tinggi",
        merchant: "Minimal 1 Epik atau lebih tinggi",
        royal: "11 Paket",
      },
      newCardFirst: "Kartu Baru Dulu",
      yes: "Ya",
      no: "Tidak",
      price: "Harga",
      versionPrice: "Harga Paket Ras atau Paket Kelas",
      rulesTitle: "Aturan Paket",
      rules: {
        roll: "Satu Paket berisi 5 kartu. Untuk tiap kartu, Paket mengundi Peringkat dengan Peluang Muncul-nya.",
        select:
          "Lalu Paket memilih kartu yang Peringkat dasarnya sama dengan Peringkat hasil undian atau lebih rendah. Kamu mendapat kartu itu di Peringkat hasil undian.",
        uncommon:
          "Paket Penjaja dan Paket Saudagar berisi minimal 1 kartu Tak Biasa atau lebih tinggi.",
        guarantee:
          "Jaminan Paket: tiap Paket punya penghitung Paket berturut-turut tanpa kartu Peringkat Jaminan atau lebih tinggi. Jika hitungannya 1 kurang dari jumlah Paket, Paket berikutnya berisi kartu itu. Kartu itu mengembalikan penghitung ke 0. Layar Paket menunjukkan sisa Paketnya.",
        ten: "Buka ×10 membeli 10 Paket satu jenis seharga 10 × harganya. Tiap Paket dihitung untuk Jaminan Paket.",
        pool: "Semua kartu: semua Kartu Makhluk, dan hanya Kartu Keahlian dari Kelas Dek aktifmu. Paket Kelas hanya berisi Kartu Keahlian dari Kelas yang kamu pilih. Paket Ras tidak berisi Kartu Keahlian.",
        versions:
          "Paket Ras hanya berisi Kartu Makhluk dari satu Ras. Paket Kelas hanya berisi Kartu Keahlian dari satu Kelas, dan kamu bisa memilih Kelas apa saja. Harga keduanya 1,4 × harga Paket. Semua versi satu Paket memakai satu penghitung Jaminan Paket.",
      },
      newCardFirstRule:
        "Paket Saudagar dan Paket Kerajaan memilih kartu yang belum kamu punya, jika Peringkat hasil undian memungkinkan. Jika kamu sudah punya semua kartu itu, Paket memilih kartu secara acak. Paket Penjaja selalu memilih secara acak.",
    },
    reveal: {
      label: "Dibuka: {pack}",
      tenTitle: "{pack} × {count}",
      faceDown:
        "Kartu tertutup {number} dari {count}. Pilih untuk membaliknya.",
      faceDownOne: "Kartu tertutup. Pilih untuk membaliknya.",
      new: "BARU",
      newCard: "kartu baru",
      copies: "×{count}",
      revealAll: "Buka semua",
      skip: "Lewati",
      done: "Selesai",
      flip: "Balik",
      next: "Kartu berikutnya",
      seeAll: "Lihat semua kartu",
      highlightCount: "Epik dan Legendaris: {number} dari {count}",
      highlightCountEpic: "Epik: {number} dari {count}",
      summary: "{cards} kartu · {fresh} kartu baru",
      byGuarantee: "Jaminan Paket: Paket ini memberi kartu Peringkat Jaminan.",
      byTenBonus: "Bonus Buka ×10: Paket ini memberi kartu Peringkat Jaminan.",
    },
  },
  workshop: {
    label: "Bengkel",
    grid: "Kartu ditemukan",
    ownership: { all: "Semua", owned: "Dimiliki", notOwned: "0 salinan" },
    empty: {
      noneFound: "Kamu belum menemukan {group}.",
      noneOwned: "Kamu tidak punya salinan {group} sekarang.",
      allOwned: "Kamu punya salinan semua {group} yang sudah kamu temukan.",
      noCombine:
        "Kamu tidak bisa Gabung {group}: kartu Legendaris tidak punya Peringkat berikutnya.",
      noCraft:
        "Kamu tidak bisa Buat {group}: kartu Epik dan Legendaris tidak bisa dibuat.",
      noFuse:
        "Kamu tidak bisa Lebur {group}: kartu Legendaris tidak bisa masuk ke Lebur.",
      ready: {
        combine: "Kamu tidak punya pasangan {group} sekarang.",
        craft: "Kamu tidak bisa Buat {group} sekarang.",
        fuse: "Tidak ada salinan {group} yang bisa masuk ke Lebur sekarang.",
        extract: "Kamu tidak punya salinan cadangan {group}.",
      },
    },
    stations: "Aksi Bengkel",
    station: {
      combine: {
        name: "Gabung",
        recipe: "2 salinan → Peringkat berikut",
        count: "{count} kartu dengan sepasang",
        ready: "Hanya pasangan",
      },
      craft: {
        name: "Buat",
        recipe: "Esensi → 1 salinan",
        count: "{count} kartu yang bisa kamu Buat sekarang",
        ready: "Bisa Buat",
        locked: "Level {level}",
        lockedLabel: "Buat terbuka di level {level}",
      },
      fuse: {
        name: "Lebur",
        recipe: "2–4 salinan + Esensi → kartu baru",
        count: "{count} kartu yang bisa masuk ke Lebur sekarang",
        ready: "Bisa Lebur",
        locked: "Level {level}",
        lockedLabel: "Lebur terbuka di level {level}",
      },
      extract: {
        name: "Ekstrak",
        recipe: "1 salinan → Esensi",
        count: "{count} salinan cadangan",
        ready: "Hanya cadangan",
      },
    },
    pairMark: "Pasangan",
    spareMark: "{count} cadangan",
    spareCopies: "{count} salinan cadangan",
    spareInDecks: "{spare} salinan cadangan · {used} di Dek",
    craftMark: "Buat dengan {essence} Esensi",
    fuseMark: "{count} salinan bisa masuk ke Lebur",
    fusePanel: {
      title: "Lebur",
      empty:
        "Masukkan salinan dari kisi. Semua salinan punya Peringkat yang sama. Salinan pertama menentukan Peringkat dan jumlah slot.",
      slotsGuide: "Biasa dan Tak Biasa: 2\nLangka: 3\nEpik: 4",
      recipe: {
        creature: "{count} salinan Kartu Makhluk {rank}",
        skill: "{count} salinan Kartu Keahlian {rank}",
      },
      slots: "Slot Lebur",
      freeSlot: "Slot kosong",
      slotLabel: "{name}, {rank}. Tekan untuk mengeluarkannya.",
      clear: "Keluarkan semua",
      chances: "Peluang",
      chance: "{shares} dari {total} · {percent}%",
      chanceLabel: "{group}: {shares} dari {total}, {percent}%.",
      allFound: "Semua ditemukan",
      noShareLabel:
        "{group}: tanpa bagian. Kamu sudah menemukan semua kartu {group} {rank}.",
      poolLabel: "Kartu {group} yang bisa diberikan Lebur",
      moreOne: "Masukkan 1 salinan {rank} lagi.",
      moreOther: "Masukkan {count} salinan {rank} lagi.",
      poolOne: "Kamu sudah menemukan semua kartu {group} {rank}.",
      poolMany: "Kamu sudah menemukan semua kartu {rank} dari {groups}.",
      after: "Esensimu: {now} → {after}",
      short: "Esensimu: {now}. Kamu perlu {missing} lagi.",
      newCard: "Kartu baru",
      discovered:
        "{name} sekarang ditemukan. Masukkan salinan baru untuk Lebur lagi.",
    },
    chooser: {
      title: "Masukkan salinan yang mana?",
      label: "Masukkan 1 salinan {rank} dari {name}",
    },
    refusal: {
      full: "Semua slot sudah penuh. Lebur, atau keluarkan satu salinan.",
      creature: "Slot sekarang hanya menerima Kartu Makhluk.",
      skill: "Slot sekarang hanya menerima Kartu Keahlian.",
      rank: "{name} tidak punya salinan {rank}.",
      copies: "{name} tidak punya salinan yang bisa masuk ke Lebur.",
      locked: "Lebur terbuka di level {level}.",
    },
    craftPanel: {
      gives: "1 salinan {rank}",
      recipe: "{essence} Esensi membuat 1 salinan {rank} dari {name}.",
      own: "Kamu punya",
    },
    extractPanel: {
      none: "Kamu tidak punya salinan kartu ini. Buat satu, atau dapatkan dari Paket.",
      excludedEpic:
        "Kamu tidak punya salinan kartu ini. Dapatkan dari Paket Saudagar atau Kerajaan, atau dari Lebur.",
      excludedLegendary:
        "Kamu tidak punya salinan kartu ini. Dapatkan dari Paket Kerajaan.",
      spare: "Cadangan ×{count}",
    },
    noCopies: "0 salinan",
    copies: "×{count}",
    rankCopies: "{rank}, salinan: {count}",
    pairReady: "Sepasang siap untuk Gabung",
    combineLabel:
      "Gabung 2 salinan {from} menjadi 1 salinan {to}, dengan {price}",
    combineCopiesLabel: "Gabung {from} ke {to}: kamu perlu 2 salinan {from}",
    combineCoinLabel: "Gabung {from} ke {to}: kamu perlu {amount} lagi",
    needCopies: "Perlu 2 salinan",
    extract: "Ekstrak",
    extractLabel: "Ekstrak 1 salinan {rank} untuk {essence} Esensi",
    craft: "Buat",
    need: "Perlu",
    craftLabel: "Buat 1 salinan {rank} dengan {essence} Esensi",
    craftNeedLabel: "Buat 1 salinan {rank}: kamu perlu {essence} Esensi lagi",
    fuse: "Lebur",
    fuseLabel: "Lebur {count} salinan {rank} dengan {essence} Esensi",
    fuseNeedLabel:
      "Lebur {count} salinan {rank}: kamu perlu {essence} Esensi lagi",
    fuseNotReadyLabel: "Lebur: belum siap. {reason}",
    path: {
      label: "Jalan ke Legendaris",
      value: "{value}/{target}",
      leftOne: "1 salinan {rank} lagi · {coin}",
      leftOther: "{count} salinan {rank} lagi · {coin}",
      complete: "Salinanmu cukup untuk 1 salinan Legendaris.",
      aria: "{value} dari {target} salinan {rank}. Koin yang masih perlu: {coin}.",
    },
    done: {
      combine: "Digabung: {name} sekarang {rank}.",
      craft: "Dibuat: 1 salinan {rank} dari {name}.",
      extract: "Diekstrak: 1 salinan {rank} dari {name}, +{essence} Esensi.",
      fuse: "Dilebur: {name}, {rank}. Ini kartu baru.",
      fuseIn: "{name}, {rank}, ada di slot: {count} dari {total}.",
      fuseOut: "{name} keluar dari slot.",
      fuseClear: "Slot kosong.",
    },
    extractDialog: {
      title: "Ekstrak salinan ini?",
      text: "Ekstrak tidak bisa dibatalkan.",
      gain: "+{essence} Esensi",
      decks: "Dek ini memakai salinan ini. Salinan itu keluar dari Dek:",
      rank: "Salinan {rank} mahal untuk didapat lagi.",
      keep: "Simpan",
    },
    fuseDialog: {
      title: "Lebur salinan ini?",
      text: "Lebur tidak bisa dibatalkan.",
      decks: "Dek ini memakai salinan ini. Salinan itu keluar dari Dek:",
      keep: "Simpan",
    },
  },
  hero: {
    label: "Pahlawan",
    hp: "HP Pahlawan",
    hpSum: "= {base} dasar + {level} level + {armorLevel} × {perLevel} Zirah",
    hpLabel:
      "HP Pahlawan {total}: {base} dasar, {level} dari level Pemain, {armor} dari Zirah.",
    gear: "Perlengkapan",
    slots: {
      weapon: "Senjata",
      armor: "Zirah",
      trinket: "Jimat",
      banner: "Panji",
    },
    stats: {
      unitCrit: "Crit Unit",
      heroHp: "HP Pahlawan",
      skillCrit: "Crit Skill",
      unitBlock: "Block Unit",
    },
    statHelp: {
      unitCrit: "Peluang serangan Unit-mu memberi 2 kali damage.",
      heroHp: "HP lebih untuk Pahlawanmu di tiap Pertempuran.",
      skillCrit: "Peluang damage Kartu Keahlian-mu menjadi 2 kali.",
      unitBlock: "Peluang Unit-mu hanya menerima setengah damage serangan.",
    },
    level: "{level} / {max}",
    levelName: "Level",
    levelLabel: "Level {level} dari {max}",
    upgrade: "Tingkatkan",
    upgradeLabel:
      "Tingkatkan {name} ke level {level}, dengan {price} dan 1 Batu Tempa {tier}",
    needLabel: "Tingkatkan {name}: kamu perlu {amount} lagi",
    max: "Level maks",
    maxLabel: "{name} sudah di level tertinggi",
    maxSeal: "Maks",
    done: "{name} sekarang level {level}. {stat}: {value}.",
    nextTier: "Level berikutnya perlu Batu Tempa {tier}.",
    forgeStones: "Batu Tempa",
    forgeStoneCount: "Batu Tempa {tier}: {count}",
    needStoneLabel: "Tingkatkan {name}: kamu perlu 1 Batu Tempa {tier}",
    needBothLabel:
      "Tingkatkan {name}: kamu perlu {amount} lagi dan 1 Batu Tempa {tier}",
  },
  forgeStones: {
    tiers: {
      common: "Biasa",
      uncommon: "Tak Biasa",
      rare: "Langka",
      epic: "Epik",
      legendary: "Legendaris",
    },
  },
  deckBuilder: {
    title: "Dek",
    close: "Tutup Dek",
    slots: "Slot Dek",
    slotName: "Dek {number}",
    nameLabel: "Nama Dek",
    cards: "Kartu",
    ownedOf: "{owned} / {total} dimiliki",
    filters: {
      ownership: "Kepemilikan",
      kind: "Jenis kartu",
      race: "Ras",
      class: "Kelas",
      all: "Semua",
      owned: "Dimiliki",
      notOwned: "Belum dimiliki",
      creature: "Makhluk",
      skill: "Keahlian",
      allRaces: "Semua Ras",
      allClasses: "Semua Kelas",
    },
    notOwned: "Belum dimiliki",
    notOwnedCard:
      "{name}, {rank}, Hitung mundur {countdown}. Kamu belum memiliki kartu ini.",
    notOwnedGroup: "Belum dimiliki · {count}",
    groups: {
      all: "kartu",
      creature: "Kartu Makhluk",
      race: "Kartu Makhluk {race}",
      skill: "Kartu Keahlian",
      class: "Kartu Keahlian {className}",
    },
    emptyPool: {
      ownAll: "Kamu sudah memiliki semua {group}.",
      ownNone: "Kamu belum memiliki {group}.",
    },
    showAll: "Tampilkan semua",
    heroClass: "Kelas Pahlawan",
    thisDeck: "Kartu di Dek ini",
    empty:
      "Dek ini tidak berisi kartu. Pilih kartu di halaman kiri untuk menambahkannya, atau pakai Isi Otomatis.",
    size: "{count} / {max} kartu",
    countdownSum: "Hitung mundur {sum} / {limit}",
    sizeMin: "Minimal {min}",
    moreProblems: "Dan {count} lagi.",
    add: "Tambah {name}, {rank}, Hitung mundur {countdown}. Salinan dimiliki: {owned}. Sisa salinan: {left}.",
    remove: "Buang satu {name}, {rank}. Di Dek ini: {count}.",
    left: "{owned} dimiliki · {left} sisa",
    blocked: {
      none: "Semua di Dek",
      full: "Dek penuh",
      countdown: "Batas Hitung mundur",
      copies: "3 salinan",
      class: "Hanya {className}",
    },
    autoFill: "Isi Otomatis",
    clear: "Buang Semua",
    use: "Pakai Dek Ini",
    active: "Dek Aktif",
    buySlot: {
      ribbon: "Beli Slot Dek {number} seharga {price}",
      title: "Beli Slot Dek {number}?",
      price: "Harga",
      balance: "Koinmu",
      short: "Kamu butuh {amount} lagi.",
      buy: "Beli",
      cancel: "Batal",
    },
    problems: {
      tooFew: "Dek perlu minimal {min} kartu. Dek ini berisi {count}.",
      tooMany: "Dek boleh berisi maksimal {max} kartu. Dek ini berisi {count}.",
      overCountdownLimit:
        "Jumlah Hitung mundur kartu boleh maksimal {limit}. Jumlahnya {countdown}.",
      tooManyCopies: "{name}: Dek boleh berisi maksimal {max} salinan.",
      wrongClass:
        "{name} adalah kartu {className}. Buang kartu itu, atau ganti Kelas Pahlawan.",
      notOwned: "Salinan {name} ({rank}) milikmu tidak cukup.",
    },
  },
  decks: {
    vanguard: {
      name: "Barisan Depan Manusia",
      description:
        "Prajurit. Tahan jalur dengan Benteng, lalu dorong dengan ksatria.",
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
    "2-1": { name: "Jalan Berdebu", enemy: "Penunggang Mesa" },
    "2-2": { name: "Pasar Rongsokan", enemy: "Tukang Tawar Rongsokan" },
    "2-3": { name: "Gudang Mesiu", enemy: "Nyonya Sumbu" },
    "2-4": { name: "Tembok Rongsokan", enemy: "Grub Tukang Gerbang" },
    "2-5": { name: "Bukit Penembak Jitu", enemy: "Penembak Teropong" },
    "2-6": { name: "Lubang Pertarungan", enemy: "Bos Lubang" },
    "2-7": { name: "Kemah Genderang Perang", enemy: "Dukun Genderang" },
    "2-8": { name: "Terowongan Runtuh", enemy: "Mandor Terowongan" },
    "2-9": { name: "Mulut Tambang", enemy: "Pengintai Snikkit" },
    "2-10": { name: "Aula Takhta Snikkit", enemy: "Bos Snikkit" },
    "3-1": { name: "Pintu Keluar Terowongan", enemy: "Penjaga Kaki Lumut" },
    "3-2": { name: "Bor yang Macet", enemy: "Bos Bor Nub" },
    "3-3": { name: "Kolam Berpendar", enemy: "Alkemis Tetes Embun" },
    "3-4": { name: "Jembatan Tali", enemy: "Penjaga Jembatan Fennick" },
    "3-5": { name: "Pos Lentera", enemy: "Pengintai Lentera" },
    "3-6": { name: "Kemah Goblin", enemy: "Gig si Sewaan" },
    "3-7": { name: "Lingkaran Jamur", enemy: "Penyanyi Lingkaran" },
    "3-8": { name: "Air Terjun Berpendar", enemy: "Penjaga Air Terjun" },
    "3-9": { name: "Gerbang Akar", enemy: "Penjaga Gerbang Glimmerbough" },
    "3-10": { name: "Aula Hutan Glimmerbough", enemy: "Nyonya Glimmerbough" },
    "4-1": { name: "Gerbang Miring", enemy: "Penjaga Pagar Sorrel" },
    "4-2": { name: "Pohon Lentera", enemy: "Penyala Lentera Teasel" },
    "4-3": { name: "Lingkaran Jamur Payung", enemy: "Vetch si Jamur Debu" },
    "4-4": { name: "Jembatan Jurang", enemy: "Penjaga Tali Alder" },
    "4-5": { name: "Gua Jaring", enemy: "Induk Sutra Tua" },
    "4-6": { name: "Batu-Batu Tegak", enemy: "Penyanyi Batu Bryony" },
    "4-7": { name: "Desa Puncak Pohon", enemy: "Tetua Hawthorn" },
    "4-8": { name: "Kolam Tenang", enemy: "Penjaga Kolam Willow" },
    "4-9": {
      name: "Pagar Duri yang Jebol",
      enemy: "Penjaga Pagar Bramble Tua",
    },
    "4-10": { name: "Bukit Bramble", enemy: "Bramble Tua" },
    "5-1": { name: "Tiang Bengkok", enemy: "Penjaga Tiang Grimsby" },
    "5-2": { name: "Kapel yang Tenggelam", enemy: "Koster Mildew" },
    "5-3": { name: "Rawa Beku", enemy: "Pemasang Jerat Shiver" },
    "5-4": { name: "Titian Panjang", enemy: "Kapten Creakbones" },
    "5-5": { name: "Makam-Makam Miring", enemy: "Juru Kunci Mould" },
    "5-6": { name: "Kincir Angin Rusak", enemy: "Tukang Giling Dustwhistle" },
    "5-7": { name: "Perahu Tambang Tulang", enemy: "Tukang Perahu Charn" },
    "5-8": { name: "Gua Es", enemy: "Gembala Es Ulla" },
    "5-9": { name: "Jembatan Api Sihir", enemy: "Penarik Tol Sang Ratu" },
    "5-10": { name: "Kastel Marrow", enemy: "Ratu Marrow" },
  },
  // Draft names (PRD open question 1).
  dungeons: {
    label: "Dungeon",
    tabs: { label: "Dungeon", later: "Segera hadir" },
    board: {
      label: "Para Bos di Dungeon ini",
    },
    strip: {
      label:
        "Lini para Bos di Jalur. Jalur 1 ada di atas, dan Pahlawanmu ada di kiri.",
      startUnit:
        "{name} ({rank}), ada di Papan di Jalur {lane} saat Pertempuran dimulai",
    },
    poster: {
      wanted: "Dicari",
      summon: "Panggil {name} ({rank}) di Jalur {lane}",
      rule: "{at}: {effect}.",
      claimed: "Hadiah diklaim",
      hp: "HP Pahlawan {hp}.",
    },
    rewards: {
      firstWin: "Kemenangan pertama: kartu ini, Koin, XP, dan Batu Tempa.",
      firstWinClaimed: "Kemenangan pertama: sudah diklaim.",
      repeatWin: "Kemenangan ulang",
      stoneChance: "Peluang {percent}%: 1 Batu Tempa {tier}",
      cardChance: "Peluang {percent}%: 1 kartu dari Dungeon ini",
      essence: "+{amount} Esensi",
    },
    wins: "Menang: {count}",
    fightLabel: "Bertarung: {name}",
    "dungeon-1": {
      name: "Tambang Akar Dalam",
      bosses: {
        foremanGritjaw: "Mandor Gritjaw",
        rootwardenSylla: "Penjaga Akar Sylla",
      },
      // Kalimat draf untuk poster buronan, dengan nama draf.
      wanted: {
        foremanGritjaw: "Karena menggali di bawah Lembah Jamur Cahaya.",
        rootwardenSylla: "Karena menyewa Goblin untuk menjaga akar.",
      },
    },
    "dungeon-2": {
      name: "Gundukan Beku",
      bosses: {
        abbotKnell: "Kepala Biara Knell",
        seerVell: "Peramal Vell",
      },
      // Kalimat draf untuk poster buronan, dengan nama draf.
      wanted: {
        abbotKnell: "Karena membangunkan orang mati dari kuburnya.",
        seerVell: "Karena melepas hewan buas es ke para pengembara.",
      },
    },
    "dungeon-3": {
      name: "Brankas Retak",
      bosses: {
        baronBrassbelly: "Baron Brassbelly",
        oldBramble: "Bramble Tua",
        queenMarrow: "Ratu Marrow",
      },
      // Kalimat draf untuk poster buronan, dengan nama draf.
      wanted: {
        baronBrassbelly: "Karena memungut pajak jalan dua kali.",
        oldBramble: "Karena bangun dengan marah.",
        queenMarrow: "Karena tetap berkuasa setelah pemakamannya sendiri.",
      },
    },
  },
  // Draft names (PRD open question 1).
  heynspire: {
    label: "Heynspire",
    rail: "Lantai-lantai Heynspire",
    floor: "Lantai {number}",
    floorName: "Heynspire, Lantai {number}",
    winFirst: "Menangkan Lantai {number} dulu.",
    state: {
      won: "sudah menang",
      current: "Lantai Saat Ini",
      locked: "terkunci",
    },
    stone: {
      floor: "Lantai {number}, {name}, {state}",
      boss: "Lantai {number}, Lantai Bos, {name}, {state}",
    },
    flight: {
      range: "Lantai {first}–{last}",
      label:
        "Lantai {first} sampai {last}, Bos {boss}, {won} dari 10 sudah menang. Tunjukkan Lantai ini.",
    },
    panel: {
      won: "Sudah menang",
      close: "Tutup",
    },
    result: {
      nextFloor: "Lantai Berikutnya",
      tryAgain: "Coba Lagi",
      back: "Kembali ke Heynspire",
    },
    // Musuh dari setiap templat Lantai (`FLOOR_TEMPLATES` di packages/rules).
    // Lantai Bos memakai nama Bos dari Tahap Bos-nya.
    enemies: {
      spireWardenHolt: "Penjaga Menara Holt",
      emberchiefRazka: "Kepala Bara Razka",
      trapmasterKrink: "Ahli Jebakan Krink",
      groveSisterMyrra: "Suster Hutan Myrra",
      houndmasterBrokk: "Pawang Binatang Brokk",
      bonecaptainRusk: "Kapten Tulang Rusk",
      lightbearerAnselm: "Pembawa Cahaya Anselm",
      warbossGnash: "Panglima Perang Gnash",
      rimecallerIsolde: "Pemanggil Es Isolde",
    },
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
    goblin: "Goblin",
    feral: "Buas",
  },
  ranks: {
    common: "Biasa",
    uncommon: "Tak Biasa",
    rare: "Langka",
    epic: "Epik",
    legendary: "Legendaris",
  },
  damageTypes: {
    physical: "Fisik",
    fire: "Api",
    frost: "Es",
    holy: "Suci",
    lightning: "Petir",
  },
  keywords: {
    bleed: "Pendarahan {value}",
    bolt: "Sambaran {value}",
    bulwark: "Benteng {value}",
    charge: "Terjang {value}",
    entangle: "Jerat",
    extremeRange: "Jangkauan Ekstrem",
    firstStrike: "Serang Duluan",
    fleet: "Lesat",
    flying: "Terbang",
    heavy: "Berat",
    heroic: "Heroik {value}",
    herosBane: "Bencana Pahlawan",
    hobble: "Pincang {value}",
    ironGuard: "Kawal Besi",
    knockback: "Hentakan {value}",
    lastBreath: "Nafas Terakhir {value}",
    longRange: "Jangkauan Jauh",
    midRange: "Jangkauan Sedang",
    pivot: "Berbalik",
    poison: "Racun",
    rebirth: "Bangkit",
    rally: "Semangat {value}",
    regenerate: "Regenerasi {value}",
    retaliate: "Balas",
    sabotage: "Sabotase {value}",
    soulHarvest: "Panen Jiwa",
    spawnbane: "Bencana Panggilan {value}",
    summon: "Panggil {token}",
    swarm: "Gerombolan {value}",
    swift: "Gesit",
    trample: "Gilas",
    unique: "Unik",
    vampirism: "Vampirisme",
    wall: "Tembok",
    ranged: "Jarak Jauh {value}",
    melee: "Jarak Dekat",
  },
  keywordRules: {
    bleed:
      "Unit musuh yang diserangnya mendapat setengah dari tiap penyembuhan, dibulatkan ke bawah, selama {value} Giliran. Balas tidak menerapkan Pendarahan.",
    bolt: "Pada tiap Fase Awal-mu, Unit ini memberi {value} damage sesuai Tipe Damage-nya ke Unit musuh acak, atau ke Pahlawan musuh di depannya. Tidak menerapkan Status.",
    bulwark: "Mengurangi damage Fisik ke Unit ini sebesar {value}.",
    charge: "+{value} Kecepatan pada Giliran saat Unit ini dipanggil.",
    entangle:
      "Unit musuh yang diserangnya punya Kecepatan 0 pada aksi berikutnya. Unit itu masih dapat menyerang.",
    extremeRange: "+3 Jangkauan.",
    fleet: "+2 Kecepatan.",
    heavy: "−1 Kecepatan.",
    herosBane:
      "Pada tiap Fase Awal-mu, Unit ini memberi 1 damage Fisik ke Pahlawan musuh di depannya.",
    ironGuard: "Tiap damage Fisik ke Unit ini paling banyak 4.",
    longRange: "+2 Jangkauan.",
    midRange: "+1 Jangkauan.",
    swift: "+1 Kecepatan.",
    firstStrike:
      "Saat Unit musuh jarak dekat menyerang Unit ini, Unit ini memberi damage lebih dulu. Jika penyerang mati, serangannya tidak terjadi.",
    flying:
      "Bergerak melewati semua Unit, tetapi berhenti sebelum Unit Terbang musuh. Berhenti di Petak kosong.",
    heroic:
      "Setelah Unit ini menyerang Unit musuh, ia mendapat +{value} Serangan.",
    hobble:
      "Unit musuh yang diserangnya punya Kecepatan maksimum 1 selama {value} Giliran. Balas tidak menerapkan Pincang.",
    knockback:
      "Mendorong Unit musuh yang diserangnya {value} Petak ke belakang. Balas tidak menerapkan Hentakan.",
    lastBreath:
      "Saat Unit ini meninggalkan Papan, ia memberi {value} damage ke Unit musuh terdekat di depannya.",
    pivot:
      "Unit ini dapat menyerang Unit musuh tepat di belakangnya atau di sebelahnya, sebelum Unit di depannya. Lalu ia tidak bergerak.",
    poison:
      "Setelah Unit ini memberi damage serangan di atas 0, Unit itu mendapat 1 tumpukan Racun. Pada tiap Fase Akhir pemiliknya, ia menerima 1 damage per tumpukan, lalu kehilangan 1 tumpukan.",
    rally:
      "Pada Fase Awal-mu, Unit kawan lain dalam Jalur yang sama mendapat +{value} Serangan sampai akhir Giliran. Unit dengan Serangan Dasar 0 tidak mendapat bonus.",
    regenerate: "Pada Fase Awal-mu, Unit ini memulihkan {value} HP.",
    retaliate:
      "Saat Unit ini selamat dari serangan jarak dekat, ia memberi damage sebesar Serangannya ke penyerang.",
    sabotage:
      "Saat Unit ini datang dari kartunya, kartu dengan Hitung mundur terendah di Tangan musuh mendapat +{value} Hitung mundur. Kartu Siap adalah yang terendah.",
    soulHarvest:
      "Saat Unit musuh mati, Unit ini mendapat +1 Serangan dan +1 HP. Bangkit mengakhiri bonus.",
    spawnbane:
      "Saat Pahlawan musuh memanggil Unit dari Kartu Makhluk, Unit ini memberi {value} damage ke Unit itu. Token bukan Unit dari Kartu Makhluk.",
    trample:
      "Saat Unit ini membunuh Unit musuh dengan serangan, sisa damage mengenai Unit musuh di Petak berikutnya di belakangnya. Tidak pernah mengenai Pahlawan.",
    unique: "Hanya satu salinan kartu ini yang boleh ada di sisi Papan-mu.",
    vampirism:
      "Saat Unit ini memberi damage Fisik, ia memulihkan HP sebesar damage itu.",
    wall: "Unit ini tidak bisa bergerak dan tidak bisa menyerang. Kamu bisa memanggilnya ke 5 Petak terdekat dengan Pahlawanmu. Ia menghalangi Unit musuh di Jalurnya, dan dorongan tidak pernah memindahkannya.",
    rebirth:
      "Saat Unit ini mati untuk pertama kali, ia kembali di Petak yang sama dengan 1 HP. Status-nya berakhir, dan ia kehilangan Bangkit.",
    summon:
      "Saat kamu memanggil Unit ini, sebuah {token} dengan Peringkat yang sama juga muncul di Petak kosong di sebelahnya: di belakangnya, atau di Kolom yang sama pada Jalur sebelah. Jika tidak ada Petak kosong, Token itu tidak muncul.",
    swarm:
      "Selama ada Unit kawan lain dalam Jalur yang sama, Unit ini mendapat +{value} Serangan, juga untuk Balas. Unit kawan yang lebih banyak tidak menambah bonus.",
    fire: "Api: target terbakar 1 damage pada 2 Fase Akhir berikutnya.",
    frost: "Es: target melewatkan aksi berikutnya.",
    holy: "Suci: Block dari Pahlawan target tidak berlaku pada damage ini.",
    lightning:
      "Petir: target tidak menyerang pada aksi berikutnya, tetapi ia tetap bisa bergerak.",
  },
  effects: {
    damageUnit: "Beri {amount} damage {damageType} ke satu Unit musuh.",
    damageUnitNoRebirth:
      "{hit} Jika Unit itu mati, Unit itu tidak kembali dengan Bangkit.",
    damageArea:
      "Beri {amount} damage {damageType} ke satu Unit musuh dan {extra} Petak berikutnya di belakangnya.",
    damageLane:
      "Beri {amount} damage {damageType} ke semua Unit musuh dalam satu Jalur.",
    damageEntangle:
      "Beri {amount} damage {damageType} ke satu Unit musuh. Jika Unit itu terkena damage dan bertahan hidup, Unit itu menjadi Terjerat.",
    damagePush:
      "Beri {amount} damage {damageType} ke satu Unit musuh. Jika Unit itu bertahan hidup, dorong Unit itu {squares} Petak mundur ke arah Pahlawannya, juga saat Unit itu tidak terkena damage.",
    damageHero: "Beri {amount} damage ke Pahlawan musuh.",
    damageKnockback:
      "{hit} Jika Unit itu terkena damage dan bertahan hidup, dorong Unit itu {squares} mundur ke arah Pahlawannya.",
    damageBleed:
      "{hit} Jika Unit itu terkena damage dan bertahan hidup, Unit itu menjadi Berdarah {bleed}.",
    damagePoison:
      "{hit} Jika Unit itu bertahan hidup, Unit itu mendapat {poison} tumpukan Racun, juga saat Unit itu tidak terkena damage.",
    damageGround:
      "{hit} Jika Unit itu adalah Unit Terbang dan bertahan hidup, Unit itu menjadi Jatuh 2, juga saat Unit itu tidak terkena damage.",
    damageLaneEntangle:
      "Beri {amount} damage {damageType} ke semua Unit musuh dalam satu Jalur. Tiap Unit yang terkena damage dan bertahan hidup menjadi Terjerat.",
    damageByAttack:
      "Beri damage {damageType} ke satu Unit musuh, sebesar Serangan Unit itu.",
    damageLaneBulwark:
      "{hit} Unit kawan dalam Jalurnya mendapat Benteng {bulwark} selama {turns}.",
    damageLaneHeal:
      "{hit} Sembuhkan {heal} HP pada setiap Unit kawan dalam Jalurnya.",
    damageUnitHero: "{hit} Lalu beri {heroAmount} damage ke Pahlawan musuh.",
    laneBulwark:
      "Unit kawan dalam satu Jalur mendapat Benteng {bulwark} selama {turns} Giliran musuh berikutnya.",
    lowerCountdown:
      "Hitung mundur {cards} kartu acak di Tanganmu turun sebesar {amount}.",
    healUnit: "Sembuhkan {heal} HP pada satu Unit kawan.",
    healLane: "Sembuhkan {heal} HP pada setiap Unit kawan dalam satu Jalur.",
    wardUnit:
      "Satu Unit kawan mendapat Pelindung {ward}: ia menyerap {ward} damage berikutnya.",
    wardLane:
      "Setiap Unit kawan dalam satu Jalur mendapat Pelindung {ward}: ia menyerap {ward} damage berikutnya.",
    steadfastUnit:
      "Satu Unit kawan mendapat Teguh: saat damage akan membawanya ke 0 HP, ia tetap pada 1 HP.",
    cleanseUnit:
      "Hapus semua Debuff dari satu Unit kawan. Lalu sembuhkan {heal} HP padanya.",
    exposeUnit:
      "Satu Unit musuh menjadi Terbuka {exposed}: tiap serangan Fisik padanya memberi {exposed} damage tambahan, setelah Benteng, sampai akhir Giliranmu berikutnya.",
    laneAttack:
      "Unit kawan dalam satu Jalur mendapat +{attack} Serangan sampai akhir Giliranmu berikutnya.",
    unitAttackRange:
      "Satu Unit kawan mendapat +{attack} Serangan dan +{range} Jangkauan sampai akhir Giliranmu berikutnya. Unit jarak dekat menyerang sebagai Unit jarak jauh.",
    laneExtraAction:
      "Setiap Unit kawan dalam satu Jalur mendapat satu aksi lagi sekarang: ia bergerak dan menyerang, dari Unit terdepan ke Unit paling belakang.",
    laneExtraActionLegendary:
      "Setiap Unit kawan dalam satu Jalur mendapat +{attack} Serangan sampai akhir Giliranmu berikutnya, lalu mendapat satu aksi lagi sekarang: ia bergerak dan menyerang, dari Unit terdepan ke Unit paling belakang.",
    damageArc:
      "Beri {amount} damage {damageType} ke satu Unit musuh dan ke Unit musuh di Kolom yang sama pada Jalur di sebelahnya.",
    damageRandom:
      "Beri {amount} damage {damageType} ke {units} Unit musuh acak yang berbeda.",
    fieldEffect:
      "Pilih area {lanes} Jalur × {columns} Kolom. Selama {turns}, pada tiap Fase Akhirmu, tiap Unit musuh di area itu terkena {amount} damage {damageType}.",
    counts: {
      squareOne: "{value} Petak",
      squareOther: "{value} Petak",
      enemyTurnOne: "Giliran musuh berikutnya",
      enemyTurnOther: "{value} Giliran musuh berikutnya",
      turnOne: "{value} Giliran",
      turnOther: "{value} Giliran",
    },
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
      townBarricade: {
        name: "Barikade Kota",
        flavor: "Izin lewatnya ada di bawah karung pasir.",
      },
      bridgePikeman: {
        name: "Prajurit Tombak Jembatan",
        flavor: "Silakan masuk antrean. Antrean paling belakang.",
      },
      bannerChaplain: {
        name: "Rohaniwan Panji",
        flavor: "Khotbahnya selesai saat moral pasukan membaik.",
      },
      kingsCourier: {
        name: "Kurir Raja",
        flavor: "Pesannya bertulis mendesak. Ia sudah berlari duluan.",
      },
      paviseArbalist: {
        name: "Arbalester Pavise",
        flavor: "Ia membawa temboknya sendiri dan menyebutnya posisi tembak.",
      },
      dawnReliquary: {
        name: "Relikui Fajar",
        flavor: "Meski hancur, ia tetap punya kata terakhir.",
      },
      marshalElianVoss: {
        name: "Marsekal Elian Voss",
        flavor: "Tahan barisan. Aku masih punya enam alasan lagi.",
      },
      serAldricStonewall: {
        name: "Ser Aldric Stonewall",
        flavor: "Tahan barisan. Lalu tahan lagi.",
      },
    },
    orc: {
      badlandRunt: {
        name: "Si Kerdil Tandus",
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
      bonestakePalisade: {
        name: "Pagar Pancang Tulang",
        flavor: "Pancangnya untuk musuh. Sosisnya untuk nanti.",
      },
      cinderhornBreaker: {
        name: "Pendobrak Tanduk Bara",
        flavor: "Ia tak pernah menunggu gerbang dibuka.",
      },
      warhowlerDrummer: {
        name: "Penabuh Lolongan Perang",
        flavor: "Ia hanya tahu satu irama: lebih cepat.",
      },
      ashspitHunter: {
        name: "Pemburu Ludah Abu",
        flavor: "Ia mengukur jarak dari seberapa jauh alis terbakar.",
      },
      mesaPitFighter: {
        name: "Petarung Arena Mesa",
        flavor: "Pukul dia sekali. Begitulah pelajaran berhitung dimulai.",
      },
      pyreaxeRavager: {
        name: "Perusak Kapak Api",
        flavor: "Kapaknya panas. Amarahnya lebih panas.",
      },
      warbandStandardBearer: {
        name: "Pembawa Panji Pasukan Perang",
        flavor: "Ikuti panjinya. Abaikan ke mana arahnya.",
      },
      ashcallerGrosh: {
        name: "Grosh Pemanggil Abu",
        flavor: "Semua terbakar. Sebagian terbakar sesuai jadwal.",
      },
    },
    goblin: {
      ankleSnatcher: {
        name: "Penyambar Mata Kaki",
        flavor: "Mata kaki adalah bagian ksatria yang paling mudah dijangkau.",
      },
      fuseRunner: {
        name: "Pelari Sumbu",
        flavor: "Sumbunya panjang. Rencananya pendek.",
      },
      junkSlinger: {
        name: "Pelempar Rongsokan",
        flavor: "Rongsokan satu goblin adalah pincangnya satu ksatria.",
      },
      tunnelSaboteur: {
        name: "Penyabot Terowongan",
        flavor: "Ia tidak melawan pasukanmu. Ia melawan jadwalmu.",
      },
      scrapPlateGuard: {
        name: "Penjaga Pelat Bekas",
        flavor: "Zirah tetaplah zirah. Walau dulunya kompor.",
      },
      sidestepShiv: {
        name: "Belati Menyamping",
        flavor: "Pintu depan? Belum pernah dengar.",
      },
      junkBarricade: {
        name: "Barikade Rongsokan",
        flavor: "Dibangun dalam satu malam. Tak seorang pun membayarnya.",
      },
      bombLobber: {
        name: "Pelontar Bom",
        flavor: "Tangkap!",
      },
      greaseTrapper: {
        name: "Penjebak Oli",
        flavor: "Awas lantainya.",
      },
      rocketBarrelRider: {
        name: "Penunggang Tong Roket",
        flavor: "Setir baru ditemukan belakangan.",
      },
      mineSapper: {
        name: "Penggali Ranjau",
        flavor: "Setiap tembok punya titik lemah. Aku bawa sendiri.",
      },
      spyglassSniper: {
        name: "Penembak Teropong",
        flavor: "Aku melihat rencanamu. Aku tidak menyukainya.",
      },
      junkWalker: {
        name: "Pejalan Rongsokan",
        flavor: "Ia berjalan. Biasanya ke depan.",
      },
      grandGearjammer: {
        name: "Pengganjal Roda Gigi Agung",
        flavor: "Setiap rencana punya roda gigi. Kami punya lebih banyak.",
      },
      bossSnikkit: {
        name: "Bos Snikkit",
        flavor: '"Semua di bawah sini milikku. Itu leluconnya. Tertawalah."',
      },
      grixRatwhistle: {
        name: "Grix Peluit Tikus",
        flavor: "Ia tidak membidik kau. Ia membidik yang di belakangmu.",
      },
    },
    feral: {
      bristlebackBoar: {
        name: "Babi Hutan Punggung Duri",
        flavor: "Ia tidak pernah memutar.",
      },
      cragLizard: {
        name: "Kadal Tebing",
        flavor: "Ia duduk di batu ini seratus tahun. Sekarang ini batumu.",
      },
      frostfangLynx: {
        name: "Kucing Hutan Taring Es",
        flavor: "Kau tak akan mendengarnya. Kau akan merasakan dinginnya dulu.",
      },
      caveBear: {
        name: "Beruang Gua",
        flavor: "Ia bangun dalam keadaan lapar. Ia masih belum selesai bangun.",
      },
      webSpitter: {
        name: "Peludah Jaring",
        flavor: "Mampirlah untuk makan malam.",
      },
      boulderTortoise: {
        name: "Kura-Kura Batu Besar",
        flavor:
          "Ia tidak bergeser untuk siapa pun. Untuk dirinya sendiri pun jarang.",
      },
      tailsweepBasilisk: {
        name: "Basilisk Sapu Ekor",
        flavor: "Menatap matanya? Ia menatap mata kakimu.",
      },
      caveTroll: {
        name: "Troll Gua",
        flavor: "Potong. Tunggu. Potong lagi.",
      },
      cragRhino: {
        name: "Badak Tebing",
        flavor: "Jalan berakhir di tempat ia berhenti.",
      },
      frostElkMatriarch: {
        name: "Induk Rusa Es",
        flavor: "Ke mana ia berjalan, kawanan mengikuti.",
      },
      avalancheYeti: {
        name: "Yeti Longsor",
        flavor: "Ia turun bersama salju. Saljunya masalah yang lebih kecil.",
      },
      woollyMammoth: {
        name: "Mamut Berbulu",
        flavor: "Ia tidak berhenti. Susun rencanamu di sekitarnya.",
      },
      rimebreathDrake: {
        name: "Naga Napas Embun Beku",
        flavor: "Napasnya adalah cuaca.",
      },
      mountainColossus: {
        name: "Raksasa Gunung",
        flavor: "Gunung itu berdiri. Lalu ia berjalan.",
      },
      oldFrostmaw: {
        name: "Si Tua Rahang Beku",
        flavor:
          "Setiap desa punya cerita tentangnya. Setiap cerita terlalu kecil.",
      },
      gorehornRedMaw: {
        name: "Gorehorn Mulut Merah",
        flavor: "Ia memakan yang ia bunuh. Sisanya disimpan.",
      },
    },
    elf: {
      rootboundGuard: {
        name: "Penjaga Berakar",
        flavor: "Ia menjaga jalan ini sejak jalan ini masih di tempat lain.",
      },
      brambleDuelist: {
        name: "Duelis Semak Duri",
        flavor:
          "Satu tebasan demi kehormatan. Dua karena pagar semak itu kurang ajar.",
      },
      fernwingCourier: {
        name: "Kurir Sayap Pakis",
        flavor: "Pesannya bilang mendesak. Paketnya roti lapis.",
      },
      mosspitcherLookout: {
        name: "Pengintai Kantong Lumut",
        flavor:
          "Ia bisa mendengar langkah sepatu. Ia tidak bisa mendengar nasihat.",
      },
      acornTender: {
        name: "Perawat Biji Ek",
        flavor: "Tumbuh butuh kesabaran. Layu butuh lebih sedikit.",
      },
      gladeTurnblade: {
        name: "Bilah Putar Rimba",
        flavor: "Di belakangnya hanya ada garis depan lain.",
      },
      canopySkirmisher: {
        name: "Pengacau Kanopi",
        flavor: "Tangga dinilai tidak efisien.",
      },
      thornlineArcher: {
        name: "Pemanah Garis Duri",
        flavor: "Anak panahnya pergi. Rasa sakitnya tinggal.",
      },
      dewkeeper: {
        name: "Penjaga Embun",
        flavor:
          "Ia mengumpulkan embun pagi. Embun sore itu urusan administrasi.",
      },
      brambleNest: {
        name: "Sarang Semak Duri",
        flavor: "Ia tidak menghalangi jalan. Sekarang ia adalah jalannya.",
      },
      amberwingDart: {
        name: "Anak Panah Sayap Amber",
        flavor:
          "Ia menghentikan pasukan, tetapi kalah berdebat dengan jendela.",
      },
      elderreedDartmaster: {
        name: "Ahli Sumpit Buluh Tua",
        flavor:
          "Ia menunggu tembakan yang sempurna. Makan siangnya juga menunggu.",
      },
      seedwindShepherd: {
        name: "Gembala Angin Benih",
        flavor: "Setiap benih punya tujuan. Ia tinggal untuk menyiraminya.",
      },
      canopyVinewarden: {
        name: "Penjaga Sulur Kanopi",
        flavor: "Peringatannya sudah kemarin.",
      },
      lethielFirstGardener: {
        name: "Lethiel, Tukang Kebun Pertama",
        flavor: "Hutan tumbuh liar. Lethiel bilang itu cukup.",
      },
      wardenSaelith: {
        name: "Penjaga Saelith",
        flavor: "Tiap gerbang punya penjaga. Yang ini menembak lebih dulu.",
      },
    },
    undead: {
      graveyardDrudge: {
        name: "Kuli Kuburan",
        flavor: "Kerjanya lebih baik kalau ada yang menonton.",
      },
      rattleknife: {
        name: "Pisau Gemeretak",
        flavor: "Satu pisau itu hobi. Dua pisau itu rencana.",
      },
      coffinLidSkater: {
        name: "Peluncur Tutup Peti",
        flavor: "Bukit itu lebih curam waktu ia masih hidup.",
      },
      hushbow: {
        name: "Busur Senyap",
        flavor: "Pendiam semasa hidup. Jauh lebih berisik sesudahnya.",
      },
      graveBellTender: {
        name: "Penjaga Lonceng Makam",
        flavor: "Satu dentang untuk makan malam. Dua untuk bala bantuan.",
      },
      backwatchBailiff: {
        name: "Juru Sita Jaga Belakang",
        flavor: "Tidak ada yang lewat tanpa izin kedaluwarsa yang benar.",
      },
      chatteringCohort: {
        name: "Pasukan Gemeletuk",
        flavor: "Mereka setuju soal semuanya, dengan sangat keras.",
      },
      paleGalloper: {
        name: "Penunggang Pucat",
        flavor: "Penunggangnya minta kuda yang lebih lambat.",
      },
      rimeEyeReaper: {
        name: "Penuai Mata Beku",
        flavor:
          "Ia memejamkan satu mata. Mata yang lain sudah membeku terbuka.",
      },
      ossuaryPiper: {
        name: "Peniup Seruling Osuarium",
        flavor: "Tidak ada yang tahu lagunya. Semua ikut berbaris.",
      },
      coffinLancer: {
        name: "Penombak Peti Mati",
        flavor: "Peti mati itu perlengkapan bertahan.",
      },
      winterMaw: {
        name: "Rahang Musim Dingin",
        flavor: "Ia membawa cukup dingin untuk seluruh kawanan.",
      },
      lanternWidow: {
        name: "Janda Lentera",
        flavor:
          "Ia selalu menyalakan lampu untuk mendiang yang pulang terlambat.",
      },
      sirOdoLastTaxman: {
        name: "Sir Odo, Pemungut Pajak Terakhir",
        flavor: "Kematian tidak menghapus utang, apalagi dendanya.",
      },
      boneRampart: {
        name: "Benteng Tulang",
        flavor: "Silakan pakai Jalur yang lain.",
      },
      paleCantorYsolde: {
        name: "Kantor Pucat Ysolde",
        flavor: "Ia menyanyi agar yang mati jadi lebih baik.",
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
      shoulderCharge: {
        name: "Terjangan Bahu",
        flavor: "Bahu dulu. Tanya belakangan.",
      },
      shieldBash: {
        name: "Hantaman Perisai",
        flavor: "Perisai juga pintu yang bisa dibanting.",
      },
      cleave: { name: "Tebasan Lebar", flavor: "Satu ayunan, dua masalah." },
      groundSlam: {
        name: "Guncangan Bumi",
        flavor: "Tanah pun setuju denganku.",
      },
      callToArms: {
        name: "Seruan Perang",
        flavor: "Satu terompet. Semua pedang menjawab.",
      },
      exposeWeakness: {
        name: "Bongkar Kelemahan",
        flavor: "Di sana. Di bawah tali zirah. Pukul di sana.",
      },
      onslaught: {
        name: "Serbuan",
        flavor: "Lagi! Sebelum mereka bangkit!",
      },
    },
    ranger: {
      pinningShot: { name: "Tembakan Penjepit", flavor: "Diam di situ." },
      warningShot: {
        name: "Tembakan Peringatan",
        flavor: "Yang berikutnya tidak akan meleset.",
      },
      longShot: {
        name: "Tembakan Jauh",
        flavor: "Melewati kepala mereka, ke Pahlawan.",
      },
      quickShot: {
        name: "Tembakan Cepat",
        flavor: "Tarik, lepas, tarik lagi.",
      },
      harryingShot: {
        name: "Tembakan Pengganggu",
        flavor: "Satu untuk hewannya. Satu untuk tuannya.",
      },
      barbedArrow: {
        name: "Panah Berduri",
        flavor: "Keluarnya lebih sakit dari masuknya.",
      },
      skybreaker: {
        name: "Pemecah Langit",
        flavor: "Yang terbang bisa jatuh.",
      },
      venomArrow: {
        name: "Panah Bisa",
        flavor: "Panahnya kecil. Racunnya tidak.",
      },
      huntersFocus: {
        name: "Fokus Pemburu",
        flavor: "Embuskan napas. Lalu lepaskan.",
      },
      rainOfArrows: {
        name: "Hujan Panah",
        flavor: "Lihat ke atas. Terlambat.",
      },
    },
    mage: {
      fireball: { name: "Bola Api", flavor: "Sambutan yang hangat." },
      frostBolt: { name: "Panah Es", flavor: "Tinggallah sebentar." },
      flameWave: { name: "Gelombang Api", flavor: "Seluruh jalur kebagian." },
      frostShards: {
        name: "Serpihan Es",
        flavor: "Kecil, tajam, dan sangat dingin.",
      },
      frostWave: {
        name: "Gelombang Es",
        flavor: "Seluruh jalur berhenti diam.",
      },
      spark: {
        name: "Percikan",
        flavor: "Diam di tempat. Kamu tidak punya pilihan.",
      },
      arcLightning: {
        name: "Busur Petir",
        flavor: "Ia tidak pernah menyambar sekali saja.",
      },
      wildfire: {
        name: "Api Liar",
        flavor: "Rumput itu memang pantas terbakar.",
      },
      thunderstorm: {
        name: "Badai Petir",
        flavor: "Selalu ada yang tersambar.",
      },
      blizzard: {
        name: "Badai Salju",
        flavor: "Hari ini tidak ada yang pergi ke mana pun.",
      },
    },
    priest: {
      mend: { name: "Pulihkan", flavor: "Bangkitlah. Kamu belum selesai." },
      smite: {
        name: "Hantaman Suci",
        flavor: "Tidak ada zirah yang menyembunyikanmu dari cahaya.",
      },
      sanctuary: { name: "Suaka", flavor: "Berdirilah di dalam cahaya." },
      blessingOfLight: {
        name: "Berkah Cahaya",
        flavor: "Sedikit cahaya pun sangat berarti.",
      },
      radiantStrike: {
        name: "Sambaran Cahaya",
        flavor: "Cahaya yang melukai. Cahaya yang memulihkan.",
      },
      penance: {
        name: "Penebusan",
        flavor: "Kekuatanmu sendiri, kembali kepadamu.",
      },
      prayerOfHealing: {
        name: "Doa Penyembuhan",
        flavor: "Satu doa untuk seluruh barisan.",
      },
      cleanse: {
        name: "Penyucian",
        flavor: "Basuh semuanya. Berdirilah dengan bersih.",
      },
      unbrokenVow: {
        name: "Sumpah Teguh",
        flavor: "Bukan hari ini. Bukan seperti ini.",
      },
      aegisOfDawn: {
        name: "Perisai Fajar",
        flavor: "Cahaya pertama menjaga seluruh barisan.",
      },
    },
  },
  tokens: {
    skeleton: { name: "Kerangka" },
    restlessWisp: { name: "Arwah Gelisah" },
  },
  // #endregion GAME
} as const satisfies LanguageMessages;
