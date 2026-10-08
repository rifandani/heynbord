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
    ticking: "berjalan",
    waiting: "menunggu",
    tickingLine: "Turun 1 di awal Giliranmu berikutnya.",
    waitingLine:
      "Menunggu. Angkanya turun saat salah satu dari 3 kartu sebelumnya Siap.",
    selectTarget: "Pilih target",
    noTarget: "Tidak ada target yang sah sekarang",
    uniqueBlocked: "{name} sudah ada di sisi Papan-mu.",
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
      handbook: "Buka Buku Panduan",
      cancel: "Batal",
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
      burnRule: "1 damage pada tiap Langkah Akhir pemiliknya.",
      burnLeft: "Sisa Langkah Akhir: {value}.",
      frozen: "Beku",
      frozenRule: "Ia melewatkan aksi berikutnya.",
      poisoned: "Racun {value}",
      poisonedRule:
        "1 damage per tumpukan pada tiap Langkah Akhir pemiliknya. Lalu ia kehilangan 1 tumpukan.",
      hobbled: "Terpincang {value}",
      hobbledRule:
        "Unit ini punya Kecepatan maksimum 1, setelah semua bonus. Hitungan turun 1 pada tiap Langkah Akhir pemiliknya.",
      bleeding: "Berdarah {value}",
      bleedingRule:
        "Unit ini mendapat setengah dari tiap penyembuhan, dibulatkan ke bawah. Hitungan turun 1 pada tiap Langkah Akhir pemiliknya.",
      entangled: "Terjerat",
      entangledRule:
        "Kecepatan 0 pada aksi berikutnya. Ia tetap bisa menyerang.",
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
  campaign: {
    label: "Kampanye",
    regionOf: "Wilayah {number} dari {count}",
    regions: {
      "1": "Hearthvale",
      "2": "Hutan Duri",
      "3": "Rawa Hampa",
    },
    previousRegion: "Wilayah sebelumnya: {name}",
    nextRegion: "Wilayah berikutnya: {name}",
    regionLater: "{name} dibuka nanti.",
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
      earned:
        "Bintangmu cukup untuk peti ini. Hadiah peti belum ada di permainan.",
      needed: "{count} Bintang lagi membuka peti ini.",
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
        "Kemenangan ulang: Koin, XP, dan peluang kartu dari Tahap ini.",
      deck: "Dek",
      fight: "Bertarung",
    },
  },
  settings: {
    title: "Pengaturan",
    close: "Tutup Pengaturan",
    language: "Bahasa",
    sound: "Suara",
    volume: "Volume suara",
    soundOn: "Suara aktif",
  },
  tutorial: {
    label: "Tutorial",
    gotIt: "Mengerti",
    skip: "Lewati tutorial",
    steps: {
      ready: {
        title: "Hitung Mundur dan Siap",
        text: "Angka di setiap kartu di Tanganmu adalah Hitung mundurnya. Di awal setiap Giliranmu, 3 kartu pertama dari kiri yang belum Siap turun 1. Jam pasirnya berjalan. Kartu lain menunggu. Saat 0, kartu itu Siap dan bisa kamu mainkan. Mainkan kartu yang Siap, atau akhiri Giliranmu.",
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
      kinds: { name: "Ras, Kelas, dan Peran", short: "Ras" },
      ranks: { name: "Peringkat", short: "Peringkat" },
      progress: { name: "Kemajuan", short: "Kemajuan" },
    },
    entryList: "Entri di {chapter}",
    results: "Hasil pencarian",
    resultCount: "Entri yang ditemukan: {count}",
    alias: "{alias} → {name}",
    noResult: "Tidak ada Entri yang cocok dengan “{query}”.",
    toBattle: "Buka Bab Pertempuran",
    back: "Kembali ke daftar",
    seeAlso: "Lihat juga",
    n: "N",
    seeCard: "N ada di tiap kartu. Lihat kartunya.",
    rankTable: "N pada tiap Peringkat",
    rankColumn: "Peringkat",
    valueColumn: "N",
    rankLine:
      "{gems} Permata Peringkat. Serangan dan HP ×{scale:number}. Peluang Kembali Kartu Keahlian: {recall}%.",
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
      startStep: "Langkah Awal",
      playPhase: "Fase Main",
      resolutionPhase: "Fase Resolusi",
      endStep: "Langkah Akhir",
      suddenDeath: "Mati Mendadak",
      routed: "Tercerai-berai",
      defeated: "Tumbang",
      creatureCard: "Kartu Makhluk",
      skillCard: "Kartu Keahlian",
      handLimit: "Batas Tangan",
      countdown: "Hitung mundur",
      tickingCard: "Kartu Berjalan",
      waitingCard: "Kartu Menunggu",
      recall: "Kembali",
      countdownLimit: "Batas Hitung mundur",
      unit: "Unit",
      ranged: "Jarak Jauh",
      movement: "Gerakan",
      status: "Status",
      damageType: "Jenis Damage",
      race: "Ras",
      class: "Kelas",
      role: "Peran",
      rank: "Peringkat",
      rankGems: "Permata Peringkat",
      stars: "Bintang",
      playerLevel: "Level pemain",
    },
    entries: {
      board:
        "Papan adalah medan dari satu Pertempuran. Dalam satu Tahap, Papan punya {lanes} Jalur.\n\nPahlawanmu ada di ujung kiri Jalur, dan Pahlawan musuh ada di ujung kanan. Unit-mu bergerak dari kiri ke kanan, dan Unit musuh bergerak dari kanan ke kiri.",
      lane: "Jalur adalah satu baris berisi {squares} Petak dari Pahlawanmu ke Pahlawan musuh.\n\nUnit selalu tetap di Jalurnya. Ia hanya bergerak di sepanjang Jalurnya.",
      square:
        "Petak adalah satu tempat di Jalur. Petak berisi 0 atau 1 Unit. Kamu memanggil Unit ke Petak yang kosong.",
      column:
        "Kolom adalah semua Petak dengan jarak yang sama dari satu Pahlawan, di semua Jalur.\n\nTiap Pihak menghitung Kolom dari Pahlawannya sendiri. Kolom 1-mu ada di sebelah Pahlawanmu, dan Kolom {squares}-mu ada di sebelah Pahlawan musuh.",
      front:
        "Lini dari seorang Pahlawan adalah Jalur yang ada di depan Pahlawan itu. Dalam satu Tahap, tiap Pahlawan punya Lini berupa semua Jalur.\n\nUnit di ujung Jalurnya menyerang Pahlawan musuh dari Lini itu.",
      summonZone:
        "Zona Panggilmu adalah Kolom 1 sampai {columns}-mu, di semua Jalur. Kamu hanya bisa memanggil Unit ke Petak kosong di Zona Panggilmu.\n\nKamu juga bisa memanggil ke Petak yang ada di belakang Unit musuh. Unit jarak dekat hanya menyerang ke depan, jadi kedua Unit ini tidak bertarung.\n\nUnit dengan Tembok juga bisa masuk ke Kolom {next} dan {wall}-mu.",
      closedLane:
        "Di Jalur Tertutup, tidak ada Pihak yang bisa memanggil Unit, dan tidak ada Kartu Keahlian yang bisa menargetkan Petak.\n\nBeberapa Tahap punya Jalur Tertutup. Jalur itu terbuka pada nomor Giliran tertentu, atau tetap tertutup selama Pertempuran.",
      side: "Pihak adalah salah satu dari dua tim dalam Pertempuran: Pihakmu dan Pihak musuh. Tiap Pihak punya Pahlawan.\n\nPihakmu ada di kiri Papan, dan Pihak musuh ada di kanan.",
      hero: "Pahlawan adalah pemimpin dari satu Pihak. Ia berdiri di belakang Lini-nya, di luar Papan.\n\nPahlawan punya HP, Kelas, dan Dek. Saat HP-nya menjadi 0, Pahlawan itu Tumbang.",
      turn: "Dalam satu Giliran, satu Pihak memainkan kartunya, dan Unit-nya bertindak. Giliran punya 4 bagian: Langkah Awal, Fase Main, Fase Resolusi, dan Langkah Akhir.\n\nKamu mengambil Giliran pertama. Lalu musuh mengambil Giliran. Nomor Giliran naik 1 setelah kedua Pihak mengambil Giliran.",
      startStep:
        "Langkah Awal adalah bagian pertama Giliranmu. Hal-hal ini terjadi dengan urutan ini:\n\n1. Efek seperti Regenerasi dan Semangat terjadi.\n\n2. Mulai Giliran {turn}, damage Mati Mendadak mengenai Pahlawanmu.\n\n3. Hitung mundur dari tiap Kartu Berjalan-mu turun 1.\n\n4. Pahlawanmu mengambil 1 kartu, jika Tangan berisi kurang dari {limit} kartu.",
      playPhase:
        "Di Fase Main, kamu memainkan kartu yang Siap. Kamu bisa memainkan semuanya, dengan urutan apa pun, atau tidak memainkan kartu.\n\nKartu Makhluk masuk ke Petak kosong di Zona Panggilmu. Kartu Keahlian menuju targetnya.\n\nPilih Akhiri Giliran untuk mengakhiri Fase Main. Tidak ada batas waktu.",
      resolutionPhase:
        "Di Fase Resolusi, Unit-mu bertindak sendiri. Kamu tidak mengendalikannya.\n\nMereka bertindak Jalur demi Jalur, dari Jalur 1 sampai Jalur terakhir. Di tiap Jalur, Unit yang paling dekat dengan Pahlawan musuh bertindak lebih dulu. Tiap Unit bergerak, lalu menyerang. Unit yang kamu panggil di Giliran ini juga bertindak.\n\nUnit musuh tidak bertindak. Mereka hanya bisa memakai Balasan dan Serang Duluan.",
      endStep:
        "Langkah Akhir adalah bagian terakhir Giliranmu. Damage Terbakar dan Racun mengenai Unit-mu. Lalu efek berwaktu turun 1, dan Unit dengan 0 HP meninggalkan Papan.\n\nLalu musuh mengambil Gilirannya.",
      suddenDeath:
        "Mati Mendadak membuat tiap Pertempuran berakhir. Mulai Giliran {turn}, Pahlawan dari Pihak yang aktif menerima 1 damage di tiap Langkah Awal. Mulai Giliran {double}, damage-nya 2.\n\nJika belum ada Pihak yang menang di akhir Giliran {limit}, musuh menang.",
      routed:
        "Pihak Tercerai-berai saat tidak punya Unit di Papan dan tidak punya kartu di Tangan dan Dek. Pihak yang Tercerai-berai tidak bisa bertindak lagi, jadi ia kalah.\n\nAturan ini sama untukmu dan untuk musuh.",
      defeated:
        "Pahlawan dengan 0 HP Tumbang. Saat semua Pahlawan dari satu Pihak Tumbang, Pihak itu kalah.\n\nDalam satu Tahap, tiap Pihak punya 1 Pahlawan, jadi Pahlawan dengan 0 HP mengakhiri Pertempuran.",
      creatureCard:
        "Kartu Makhluk memanggil Unit ke Papan. Kartu ini punya Ras, Peran, Serangan, HP, dan Kecepatan. Beberapa Kartu Makhluk punya Kata Kunci.\n\nSaat Unit-nya mati, kartu itu masuk ke Kuburanmu.",
      skillCard:
        "Kartu Keahlian punya efek sekali pakai, misalnya damage ke Unit musuh. Kartu ini punya Kelas. Hanya Pahlawan dengan Kelas yang sama yang bisa memakainya.\n\nSetelah efeknya, Kembali bisa mengirim kartu itu kembali ke Tanganmu.",
      hand: "Tanganmu adalah kartu yang dipegang Pahlawanmu dalam Pertempuran. Kartu itu tampil di bagian bawah layar.\n\nDi awal Pertempuran, Pahlawanmu mengambil {start} kartu. Tiap kartu di Tangan menunjukkan Hitung mundurnya. Tangan menyimpan urutan masuknya kartu.",
      handLimit:
        "Tanganmu bisa berisi paling banyak {limit} kartu. Saat Tanganmu penuh, Pahlawanmu tidak mengambil kartu, dan kartu itu tetap di Dek.",
      deck: "Dek-mu adalah kartu yang dibawa Pahlawanmu ke Pertempuran. Kamu menyusunnya di penyusun Dek.\n\nDek boleh berisi paling banyak {copies} salinan dari satu kartu. Dek hanya boleh berisi Kartu Keahlian dari Kelas Pahlawanmu.\n\nDalam Pertempuran, Dek hanya berisi kartu yang belum diambil Pahlawanmu.",
      graveyard:
        "Kuburan berisi kartumu yang sudah dipakai atau mati. Kartu Makhluk masuk ke sana saat Unit-nya mati. Kartu Keahlian masuk ke sana saat Kembali tidak mengirimnya kembali.",
      countdown:
        "Hitung mundur adalah jumlah Giliran yang harus dijalani kartu sebelum Siap. Angkanya tampil di sudut kiri atas kartu.\n\nDi Langkah Awal-mu, Hitung mundur dari tiap Kartu Berjalan turun 1. Peringkat kartu tidak mengubah Hitung mundurnya.",
      tickingCard:
        "Kartu Berjalan adalah {count} kartu tertua di Tanganmu yang belum Siap. Hanya Kartu Berjalan yang menghitung mundur, dan jam pasirnya berputar.\n\nKartu tertua adalah kartu yang pertama masuk ke Tangan.",
      waitingCard:
        "Kartu Menunggu adalah kartu di Tanganmu yang belum Siap dan bukan Kartu Berjalan. Hitung mundurnya tidak turun.\n\nKartu ini menjadi Kartu Berjalan saat kartu yang lebih tua menjadi Siap atau meninggalkan Tangan.",
      ready:
        "Kartu dengan Hitung mundur 0 adalah kartu yang Siap. Hanya kartu Siap yang bisa dimainkan. Kartu Siap bercahaya di Tanganmu.",
      recall:
        "Kembali adalah peluang Kartu Keahlian kembali ke Tanganmu setelah efeknya. Peringkat kartu menentukan peluangnya: dari {low}% pada Biasa sampai {high}% pada Legendaris.\n\nKartu yang kembali punya Hitung mundur penuh lagi. Jika tidak, kartu masuk ke Kuburan.",
      countdownLimit:
        "Batas Hitung mundur adalah jumlah maksimum Hitung mundur dari kartu di Dek-mu. Tiap kartu dihitung, juga Kartu Keahlian.\n\nPada Level pemain 1, batasnya {first}. Batas ini naik dengan Level pemainmu. Dek musuh dalam Tahap tidak punya batas ini.",
      unit: "Unit adalah figur di Papan. Kartu Makhluk menaruhnya di sana.\n\nUnit menunjukkan Serangan dan HP-nya di kakinya. Unit-mu menghadap Pahlawan musuh, dan Unit musuh menghadap Pahlawanmu.",
      attack:
        "Serangan adalah damage yang diberikan Unit dengan satu serangan. Zirah dari target bisa memperkecil damage itu.\n\nUnit dengan Serangan 0 di kartunya tidak pernah menyerang, juga dengan bonus. Peringkat yang lebih tinggi memberi Serangan lebih besar.",
      hp: "HP adalah nyawa dari Unit atau Pahlawan. Damage menurunkannya, dan penyembuhan mengembalikannya sampai maksimumnya.\n\nPada 0 HP, Unit meninggalkan Papan, dan Pahlawan Tumbang. Peringkat yang lebih tinggi memberi HP lebih banyak.",
      speed:
        "Kecepatan adalah jumlah Petak maksimum yang ditempuh Unit ke depan dalam satu Giliran. Unit dengan Kecepatan 0 tidak pernah bergerak.",
      range:
        "Jangkauan adalah jumlah Petak maksimum di depan Unit jarak jauh tempat ia bisa menyerang.\n\nPendukung jarak jauh punya Jangkauan 2, dan Penembak punya Jangkauan 3.",
      melee:
        "Unit jarak dekat menyerang Unit musuh di Petak berikutnya di depannya.\n\nSaat ia ada di Kolom terakhirnya dan tidak ada Unit musuh di depannya, ia menyerang Pahlawan musuh.",
      ranged:
        "Unit jarak jauh menyerang Unit musuh terdekat di depannya, di Jalurnya dan dalam Jangkauannya. Ia tidak bergerak saat ada Unit musuh dalam Jangkauannya.\n\nSaat tidak ada Unit musuh dalam Jangkauannya dan Pahlawan musuh ada di dalamnya, ia menyerang Pahlawan musuh. Pahlawan musuh berjarak 1 Petak setelah Kolom terakhir.",
      movement:
        "Dalam aksinya, Unit lebih dulu bergerak maju di sepanjang Jalurnya, sampai sejauh Kecepatannya.\n\nIa bergerak melewati Unit kawan, tetapi berhenti sebelum Unit musuh. Ia selalu berhenti di Petak kosong. Unit Terbang bergerak melewati semua Unit.",
      status:
        "Status adalah efek yang tetap ada pada Unit. Damage Api dan Es serta beberapa Kata Kunci memberi Status.\n\nUnit menunjukkan Status-nya sebagai ikon di atasnya. Detail Kartu dari Unit itu menunjukkan tiap Status dengan aturannya.",
      damageType:
        "Tiap serangan dan tiap efek damage punya Jenis Damage: Fisik, Api, Es, atau Suci.\n\nDi kartu, Jenis Damage tampil sebagai ikon dan warna dari Serangan.",
      damagePhysical: "Fisik: damage biasa. Zirah menguranginya.",
      race: "Ras adalah bangsa yang dibela Kartu Makhluk. Ras tampil di lambang di sudut kanan atas kartu.\n\nDek boleh mencampur semua Ras. Tiap Ras punya gaya bermainnya sendiri.",
      raceHuman:
        "Manusia dan orang-orang tangguh dari kota sungai. Mereka menahan barisan dengan Zirah kuat, Tembok, dan dukungan untuk kawan.",
      raceElf:
        "Elf dari hutan tua, dan roh tanaman yang bertarung bersama mereka. Mereka mengendalikan Jalur dari jauh, dengan penyembuhan dan Racun.",
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
        "Bonus dan kecepatan. Kartu Keahlian Prajurit membuat kartumu lebih cepat Siap dan memberi Zirah ke Unit-mu.",
      classRanger: "Kendali, dan damage ke Pahlawan musuh.",
      classMage:
        "Damage area. Kartu Keahlian Penyihir mengenai Unit musuh dengan Api dan Es.",
      classPriest: "Penyembuhan, perlindungan, dan Unit yang bangkit kembali.",
      role: "Peran adalah tugas Kartu Makhluk dalam Pertempuran. Peran membantumu membaca kartu. Tidak ada aturan yang memakainya, tetapi Peran menentukan Jangkauan dari Unit jarak jauh.",
      roleFrontliner:
        "HP tinggi dan Kecepatan rendah. Garis Depan menahan Jalurnya dari Unit musuh.",
      roleStriker:
        "Serangan tinggi dan HP rendah. Penyerang membunuh Unit musuh.",
      roleRunner:
        "Kecepatan tinggi, atau Terbang. Pelari cepat sampai ke Pahlawan musuh.",
      roleShooter:
        "Unit jarak jauh dengan Jangkauan 3. Penembak tetap di belakang dan menyerang.",
      roleSupport:
        "Pendukung membuat Unit lain lebih baik, misalnya dengan Semangat atau Regenerasi. Ia jarak dekat, atau jarak jauh dengan Jangkauan 2.",
      roleWall:
        "Tembok menghalangi Jalurnya dari Unit musuh. Tiap Tembok punya Kata Kunci Tembok.",
      rank: "Peringkat adalah tingkat kekuatan dari satu salinan kartu: Biasa, Tak Biasa, Langka, Epik, atau Legendaris.\n\nPeringkat yang lebih tinggi memberi Serangan dan HP lebih besar, peluang Kembali lebih tinggi, dan kadang nilai Kata Kunci lebih tinggi. Hitung mundur tidak berubah dengan Peringkat.\n\nTiap kartu punya Peringkat terendah. Salinannya tidak pernah di bawahnya.",
      rankGems:
        "Permata Peringkat di bagian atas kartu menunjukkan Peringkatnya: 1 permata abu-abu untuk Biasa, sampai 5 permata oranye untuk Legendaris.\n\nJumlah permata selalu menunjukkan Peringkat, jadi kamu tidak perlu warnanya.",
      stars:
        "Kemenangan di Tahap memberi 1 sampai 3 Bintang. 1 Bintang: menangkan Pertempuran. 2 Bintang: menang dengan setengah HP Pahlawanmu atau lebih. 3 Bintang: menang dengan setengah HP Pahlawanmu atau lebih, sebelum Giliran 15.\n\nKampanye menyimpan Bintang terbaikmu untuk tiap Tahap. Bintang dari satu Wilayah membuka petinya.",
      playerLevel:
        "Level pemainmu naik dengan XP. Kamu mendapat XP dari tiap Pertempuran, juga saat kalah.\n\nLevel yang lebih tinggi memberi Pahlawanmu lebih banyak HP, Dek yang lebih besar, dan Batas Hitung mundur yang lebih tinggi. Tiap Tahap menunjukkan Level yang disarankan.",
      coin: "Koin adalah mata uang yang kamu dapat dari Pertempuran. Koin membayar Slot Dek. Nanti, Koin juga membayar Paket, Gabung, dan Perlengkapan.\n\nKoin tampil sebagai Emas, Perak, dan Tembaga: 100 Tembaga adalah 1 Perak, dan 100 Perak adalah 1 Emas. Semuanya satu mata uang dengan satu saldo.",
    },
    aliases: {
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
      keywordUnique: "legend rule, satu-satunya",
      keywordRetaliation: "serangan balik, thorns, counterattack",
      status: "debuff, kondisi, efek buruk",
      statusFreeze: "stun, membeku, pingsan",
      statusBleed: "luka, anti-heal, kurangi penyembuhan",
      statusHobble: "lambat, slow, lumpuh",
      damageType: "elemen, element",
      race: "faksi, suku, kerajaan, faction",
      class: "pekerjaan, profesi, job",
      role: "tipe unit, unit type",
      rank: "kelangkaan, rarity, tier, kualitas",
      rankGems: "pip, titik",
      stars: "skor, nilai, score",
      playerLevel: "level akun, xp",
      coin: "emas, perak, tembaga, uang, gold",
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
    curve: "Kurva Hitung mundur",
    curveColumn:
      "Hitung mundur {countdown}: {creatures} Kartu Makhluk, {skills} Kartu Keahlian",
    creature: "Makhluk",
    skill: "Keahlian",
    thisDeck: "Kartu di Dek ini",
    empty:
      "Dek ini tidak berisi kartu. Pilih kartu di halaman kiri untuk menambahkannya, atau pakai Isi Otomatis.",
    size: "{count} / {max} kartu",
    countdownSum: "Hitung mundur {sum} / {limit}",
    sizeMin: "Minimal {min}",
    add: "Tambah {name}, {rank}, Hitung mundur {countdown}. Sisa salinan: {left}.",
    remove: "Buang satu {name}, {rank}. Di Dek ini: {count}.",
    left: "×{count}",
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
      text: "Kamu mendapat satu tempat lagi untuk menyimpan Dek. Slot ini milikmu selamanya.",
      price: "Harga",
      balance: "Koinmu",
      after: "Setelah membeli",
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
    bleed: "Pendarahan {value}",
    charge: "Terjang {value}",
    entangle: "Jerat",
    firstStrike: "Serang Duluan",
    flying: "Terbang",
    heroic: "Heroik {value}",
    hobble: "Pincang {value}",
    knockback: "Hentakan {value}",
    lastBreath: "Nafas Terakhir {value}",
    pivot: "Berbalik",
    poison: "Racun",
    rally: "Semangat {value}",
    regeneration: "Regenerasi {value}",
    retaliation: "Balasan",
    sabotage: "Sabotase {value}",
    trample: "Gilas",
    unique: "Unik",
    wall: "Tembok",
    ranged: "Jarak Jauh {value}",
    melee: "Jarak Dekat",
  },
  keywordRules: {
    armor:
      "Mengurangi damage ke Unit ini sebesar {value}. Tidak mengurangi damage Suci.",
    bleed:
      "Unit musuh yang diserangnya mendapat setengah dari tiap penyembuhan, dibulatkan ke bawah, selama {value} Giliran. Balasan tidak menerapkan Pendarahan.",
    charge: "+{value} Kecepatan pada Giliran saat Unit ini dipanggil.",
    entangle:
      "Unit musuh yang diserangnya punya Kecepatan 0 pada aksi berikutnya. Unit itu masih dapat menyerang.",
    firstStrike:
      "Saat Unit musuh jarak dekat menyerang Unit ini, Unit ini memberi damage lebih dulu. Jika penyerang mati, serangannya tidak terjadi.",
    flying:
      "Bergerak melewati semua Unit, juga Unit musuh. Berhenti di Petak kosong.",
    heroic: "+{value} damage saat Unit ini menyerang Pahlawan.",
    hobble:
      "Unit musuh yang diserangnya punya Kecepatan maksimum 1 selama {value} Giliran. Balasan tidak menerapkan Pincang.",
    knockback:
      "Mendorong Unit musuh yang diserangnya {value} Petak ke belakang. Balasan tidak menerapkan Hentakan.",
    lastBreath:
      "Saat Unit ini meninggalkan Papan, ia memberi {value} damage ke Unit musuh terdekat di depannya.",
    pivot:
      "Unit ini dapat menyerang Unit musuh tepat di belakangnya atau di sebelahnya, sebelum Unit di depannya. Lalu ia tidak bergerak.",
    poison:
      "Setelah Unit ini memberi damage serangan di atas 0, Unit itu mendapat 1 tumpukan Racun. Pada tiap Langkah Akhir pemiliknya, ia menerima 1 damage per tumpukan, lalu kehilangan 1 tumpukan.",
    rally:
      "Pada Langkah Awal-mu, Unit kawan lain dalam Jalur yang sama mendapat +{value} Serangan sampai akhir Giliran. Unit dengan Serangan Dasar 0 tidak mendapat bonus.",
    regeneration: "Pada Langkah Awal-mu, Unit ini memulihkan {value} HP.",
    retaliation:
      "Saat Unit ini selamat dari serangan jarak dekat, ia memberi damage sebesar Serangannya ke penyerang.",
    sabotage:
      "Saat Unit ini datang dari kartunya, kartu dengan Hitung mundur terendah di Tangan musuh mendapat +{value} Hitung mundur. Kartu Siap adalah yang terendah.",
    trample:
      "Saat Unit ini membunuh Unit musuh dengan serangan, sisa damage mengenai Unit musuh di Petak berikutnya di belakangnya. Tidak pernah mengenai Pahlawan.",
    unique: "Hanya satu salinan kartu ini yang boleh ada di sisi Papan-mu.",
    wall: "Unit ini tidak bisa bergerak dan tidak bisa menyerang. Kamu bisa memanggilnya ke 5 Petak terdekat dengan Pahlawanmu. Ia menghalangi Unit musuh di Jalurnya, dan dorongan tidak pernah memindahkannya.",
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
      dusthideBrawler: {
        name: "Petarung Kulit Debu",
        flavor: "Ia mengira setiap peringatan adalah tepuk tangan.",
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
