const b = import.meta.env.BASE_URL

export const productCategories = [
  { id: 'hoodie',      name: 'Худі' },
  { id: 'hoodie-jh030', name: 'Худі JH030' },
  { id: 'tshirt',     name: 'Футболка' },
]

export const products = [
  // ── Худі ──────────────────────────────────────────────────────
  { id: 'hoodie-black',       nameUk: 'Чорний худі',              category: 'hoodie',       image: `${b}Чорний перед.jpg` },
  { id: 'hoodie-white',       nameUk: 'Білий худі',               category: 'hoodie',       image: `${b}Білий перед.jpg` },
  { id: 'hoodie-gray',        nameUk: 'Сірий худі',               category: 'hoodie',       image: `${b}Сірий перед.jpg` },
  { id: 'hoodie-graphite',    nameUk: 'Графітовий худі',          category: 'hoodie',       image: `${b}Графіт перед.jpg` },
  { id: 'hoodie-beige',       nameUk: 'Бежевий худі',             category: 'hoodie',       image: `${b}Бежевий перед.jpg` },
  { id: 'hoodie-blue',        nameUk: 'Синій худі',               category: 'hoodie',       image: `${b}Синій перед.jpg` },
  { id: 'hoodie-lightblue',   nameUk: 'Блакитний худі',           category: 'hoodie',       image: `${b}Блакитний перед.jpg` },
  { id: 'hoodie-darkblue',    nameUk: 'Темно-синій худі',         category: 'hoodie',       image: `${b}Темно синій перед.jpg` },
  { id: 'hoodie-darkgreen',   nameUk: 'Темно-зелений худі',       category: 'hoodie',       image: `${b}Темно зелений перед.jpg` },
  { id: 'hoodie-khaki',       nameUk: 'Хакі худі',                category: 'hoodie',       image: `${b}Хакі перед.jpg` },
  { id: 'hoodie-red',         nameUk: 'Червоний худі',            category: 'hoodie',       image: `${b}Червоний перед.jpg` },
  { id: 'hoodie-burgundy',    nameUk: 'Бордовий худі',            category: 'hoodie',       image: `${b}Бордовий перед.jpg` },
  { id: 'hoodie-pink',        nameUk: 'Рожевий худі',             category: 'hoodie',       image: `${b}Рожевий перед.jpg` },
  { id: 'hoodie-orange-kids', nameUk: 'Помаранчевий дитячий худі', category: 'hoodie',     image: `${b}Помаранчевий дитячий перед.jpg` },
  // ── Худі JH030 ────────────────────────────────────────────────
  { id: 'jh030-purple',       nameUk: 'Фіолетовий JH030',         category: 'hoodie-jh030', image: `${b}JH030 PURPLE (FRONT).jpg` },
  { id: 'jh030-yellow',       nameUk: 'Жовтий JH030',             category: 'hoodie-jh030', image: `${b}JH030 SUN YELLOW (FRONT).jpg` },
  // ── Футболки ──────────────────────────────────────────────────
  { id: 'tshirt-black',       nameUk: 'Чорна футболка',           category: 'tshirt',       image: `${b}футболка чорна.jpg` },
  { id: 'tshirt-white',       nameUk: 'Біла футболка',            category: 'tshirt',       image: `${b}футболка біла.jpg` },
  { id: 'tshirt-lightblue',   nameUk: 'Блакитна футболка',        category: 'tshirt',       image: `${b}футболка блакитна .jpg` },
  { id: 'tshirt-lightgray',   nameUk: 'Світло-сіра футболка',     category: 'tshirt',       image: `${b}футболка світло-сіра.jpg` },
  { id: 'tshirt-graphite',    nameUk: 'Графітова футболка',       category: 'tshirt',       image: `${b}футболка графіт.jpg` },
  { id: 'tshirt-burgundy',    nameUk: 'Бордова футболка',         category: 'tshirt',       image: `${b}футболка бордова .jpg` },
  { id: 'tshirt-darkblue',    nameUk: 'Темно-синя футболка',      category: 'tshirt',       image: `${b}футболка темно-синя.jpg` },
  { id: 'tshirt-darkgreen',   nameUk: 'Темно-зелена футболка',    category: 'tshirt',       image: `${b}футболка темно-зелена.jpg` },
  { id: 'tshirt-khaki',       nameUk: 'Хакі футболка',            category: 'tshirt',       image: `${b}футболка хакі.jpg` },
  { id: 'tshirt-red',         nameUk: 'Червона футболка',         category: 'tshirt',       image: `${b}футболка черовна.jpg` },
  { id: 'tshirt-pink',        nameUk: 'Рожева футболка',          category: 'tshirt',       image: `${b}футолка рожева.jpg` },
  { id: 'tshirt-yellow',      nameUk: 'Жовта футболка',           category: 'tshirt',       image: `${b}футболка жовта.jpg` },
  { id: 'tshirt-orange',      nameUk: 'Помаранчева футболка',     category: 'tshirt',       image: `${b}футболка помаранчева.jpg` },
  { id: 'tshirt-sand',        nameUk: 'Пісочна футболка',         category: 'tshirt',       image: `${b}футболка пісочна.jpg` },
  { id: 'tshirt-purple',      nameUk: 'Фіолетова футболка',       category: 'tshirt',       image: `${b}футболка фіолетова.jpg` },
]

export const designStyles = [
  {
    id: 'est-face',
    name: 'З рисами обличчя',
    nameUk: 'З рисами обличчя',
    image: `${b}1a0ac8a8-3d48-4892-bfa5-b0325a4b0e92-removebg-preview.png`,
  },
  {
    id: 'faceless-face',
    name: 'Без рис обличчя',
    nameUk: 'Без рис обличчя',
    image: `${b}без рис обличчя.jpg`,
  },
]

export const mockOrders = [
  {
    id: '#10425',
    status: 'new',
    productId: 'hoodie-black',
    name: 'Худі з собакою',
    date: '31 травня 2024, 10:42',
    colors: ['#1a1a1a', '#9ca3af', '#d4b896', '#8b5e3c'],
    image: `${b}Чорний перед.jpg`,
  },
  {
    id: '#10424',
    status: 'in_progress',
    productId: 'tshirt-white',
    name: 'Футболка сімейна',
    date: '30 травня 2024, 14:18',
    colors: ['#f5f5f5'],
    image: `${b}футболка біла.jpg`,
  },
]
