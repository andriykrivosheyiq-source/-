const b = import.meta.env.BASE_URL

export const productCategories = [
  { id: 'hoodie-basic',    name: 'Худі базові' },
  { id: 'hoodie-fleece',   name: 'Худі оверсайз з флісом' },
  { id: 'hoodie-premium',  name: 'Худі преміум без флісу' },
  { id: 'tshirt-basic',    name: 'Футболки базові' },
  { id: 'tshirt-oversized', name: 'Оверсайз футболки' },
  { id: 'sweatshirt',      name: 'Світшоти' },
  { id: 'shopper',         name: 'Шопери' },
  { id: 'cap',             name: 'Кепки' },
]

export const products = [
  // ── Худі базові ───────────────────────────────────────────────
  { id: 'hoodie-black',       nameUk: 'Чорний худі',              category: 'hoodie-basic', image: `${b}Чорний перед.jpg` },
  { id: 'hoodie-white',       nameUk: 'Білий худі',               category: 'hoodie-basic', image: `${b}Білий перед.jpg` },
  { id: 'hoodie-gray',        nameUk: 'Сірий худі',               category: 'hoodie-basic', image: `${b}Сірий перед.jpg` },
  { id: 'hoodie-graphite',    nameUk: 'Графітовий худі',          category: 'hoodie-basic', image: `${b}Графіт перед.jpg` },
  { id: 'hoodie-beige',       nameUk: 'Бежевий худі',             category: 'hoodie-basic', image: `${b}Бежевий перед.jpg` },
  { id: 'hoodie-blue',        nameUk: 'Синій худі',               category: 'hoodie-basic', image: `${b}Синій перед.jpg` },
  { id: 'hoodie-lightblue',   nameUk: 'Блакитний худі',           category: 'hoodie-basic', image: `${b}Блакитний перед.jpg` },
  { id: 'hoodie-darkblue',    nameUk: 'Темно-синій худі',         category: 'hoodie-basic', image: `${b}Темно синій перед.jpg` },
  { id: 'hoodie-darkgreen',   nameUk: 'Темно-зелений худі',       category: 'hoodie-basic', image: `${b}Темно зелений перед.jpg` },
  { id: 'hoodie-khaki',       nameUk: 'Хакі худі',                category: 'hoodie-basic', image: `${b}Хакі перед.jpg` },
  { id: 'hoodie-red',         nameUk: 'Червоний худі',            category: 'hoodie-basic', image: `${b}Червоний перед.jpg` },
  { id: 'hoodie-burgundy',    nameUk: 'Бордовий худі',            category: 'hoodie-basic', image: `${b}Бордовий перед.jpg` },
  { id: 'hoodie-pink',        nameUk: 'Рожевий худі',             category: 'hoodie-basic', image: `${b}Рожевий перед.jpg` },
  { id: 'hoodie-orange-kids', nameUk: 'Помаранчевий дитячий худі', category: 'hoodie-basic', image: `${b}Помаранчевий дитячий перед.jpg` },
  // ── Худі оверсайз з флісом ────────────────────────────────────
  { id: 'jh030-purple',       nameUk: 'Фіолетовий JH030',         category: 'hoodie-fleece', image: `${b}JH030 PURPLE (FRONT).jpg` },
  { id: 'jh030-yellow',       nameUk: 'Жовтий JH030',             category: 'hoodie-fleece', image: `${b}JH030 SUN YELLOW (FRONT).jpg` },
  // ── Худі преміум без флісу ────────────────────────────────────
  // (додай фото до public/ — скажи назву файлу)
  // ── Футболки базові ───────────────────────────────────────────
  { id: 'tshirt-black',       nameUk: 'Чорна футболка',           category: 'tshirt-basic', image: `${b}футболка чорна.jpg` },
  { id: 'tshirt-white',       nameUk: 'Біла футболка',            category: 'tshirt-basic', image: `${b}футболка біла.jpg` },
  { id: 'tshirt-lightblue',   nameUk: 'Блакитна футболка',        category: 'tshirt-basic', image: `${b}футболка блакитна .jpg` },
  { id: 'tshirt-lightgray',   nameUk: 'Світло-сіра футболка',     category: 'tshirt-basic', image: `${b}футболка світло-сіра.jpg` },
  { id: 'tshirt-graphite',    nameUk: 'Графітова футболка',       category: 'tshirt-basic', image: `${b}футболка графіт.jpg` },
  { id: 'tshirt-burgundy',    nameUk: 'Бордова футболка',         category: 'tshirt-basic', image: `${b}футболка бордова .jpg` },
  { id: 'tshirt-darkblue',    nameUk: 'Темно-синя футболка',      category: 'tshirt-basic', image: `${b}футболка темно-синя.jpg` },
  { id: 'tshirt-darkgreen',   nameUk: 'Темно-зелена футболка',    category: 'tshirt-basic', image: `${b}футболка темно-зелена.jpg` },
  { id: 'tshirt-khaki',       nameUk: 'Хакі футболка',            category: 'tshirt-basic', image: `${b}футболка хакі.jpg` },
  { id: 'tshirt-red',         nameUk: 'Червона футболка',         category: 'tshirt-basic', image: `${b}футболка черовна.jpg` },
  { id: 'tshirt-pink',        nameUk: 'Рожева футболка',          category: 'tshirt-basic', image: `${b}футолка рожева.jpg` },
  { id: 'tshirt-yellow',      nameUk: 'Жовта футболка',           category: 'tshirt-basic', image: `${b}футболка жовта.jpg` },
  { id: 'tshirt-orange',      nameUk: 'Помаранчева футболка',     category: 'tshirt-basic', image: `${b}футболка помаранчева.jpg` },
  { id: 'tshirt-sand',        nameUk: 'Пісочна футболка',         category: 'tshirt-basic', image: `${b}футболка пісочна.jpg` },
  { id: 'tshirt-purple',      nameUk: 'Фіолетова футболка',       category: 'tshirt-basic', image: `${b}футболка фіолетова.jpg` },
  // ── Оверсайз футболки ─────────────────────────────────────────
  // (додай фото до public/ — скажи назву файлу)
  // ── Світшоти ──────────────────────────────────────────────────
  // (додай фото до public/ — скажи назву файлу)
  // ── Шопери ────────────────────────────────────────────────────
  // (додай фото до public/ — скажи назву файлу)
  // ── Кепки ─────────────────────────────────────────────────────
  // (додай фото до public/ — скажи назву файлу)
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
