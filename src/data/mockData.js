const b = import.meta.env.BASE_URL

export const productCategories = [
  { id: 'hoodie-basic',     name: 'Худі базові' },
  { id: 'hoodie-fleece',    name: 'Худі оверсайз з флісом' },
  { id: 'hoodie-premium',   name: 'Худі преміум без флісу' },
  { id: 'tshirt-basic',     name: 'Футболки базові' },
  { id: 'tshirt-oversized', name: 'Оверсайз футболки' },
  { id: 'sweatshirt',       name: 'Світшоти' },
  { id: 'shopper',          name: 'Шопери' },
  { id: 'cap',              name: 'Кепки' },
]

export const products = [
  // ── Худі базові ───────────────────────────────────────────────
  { id: 'hoodie-black',       nameUk: 'Чорний худі',               category: 'hoodie-basic',     image: `${b}Чорний перед.jpg` },
  { id: 'hoodie-white',       nameUk: 'Білий худі',                category: 'hoodie-basic',     image: `${b}Білий перед.jpg` },
  { id: 'hoodie-gray',        nameUk: 'Сірий худі',                category: 'hoodie-basic',     image: `${b}Сірий перед.jpg` },
  { id: 'hoodie-graphite',    nameUk: 'Графітовий худі',           category: 'hoodie-basic',     image: `${b}Графіт перед.jpg` },
  { id: 'hoodie-beige',       nameUk: 'Бежевий худі',              category: 'hoodie-basic',     image: `${b}Бежевий перед.jpg` },
  { id: 'hoodie-blue',        nameUk: 'Синій худі',                category: 'hoodie-basic',     image: `${b}Синій перед.jpg` },
  { id: 'hoodie-lightblue',   nameUk: 'Блакитний худі',            category: 'hoodie-basic',     image: `${b}Блакитний перед.jpg` },
  { id: 'hoodie-darkblue',    nameUk: 'Темно-синій худі',          category: 'hoodie-basic',     image: `${b}Темно синій перед.jpg` },
  { id: 'hoodie-darkgreen',   nameUk: 'Темно-зелений худі',        category: 'hoodie-basic',     image: `${b}Темно зелений перед.jpg` },
  { id: 'hoodie-khaki',       nameUk: 'Хакі худі',                 category: 'hoodie-basic',     image: `${b}Хакі перед.jpg` },
  { id: 'hoodie-red',         nameUk: 'Червоний худі',             category: 'hoodie-basic',     image: `${b}Червоний перед.jpg` },
  { id: 'hoodie-burgundy',    nameUk: 'Бордовий худі',             category: 'hoodie-basic',     image: `${b}Бордовий перед.jpg` },
  { id: 'hoodie-pink',        nameUk: 'Рожевий худі',              category: 'hoodie-basic',     image: `${b}Рожевий перед.jpg` },
  { id: 'hoodie-orange-kids', nameUk: 'Помаранчевий дитячий худі', category: 'hoodie-basic',     image: `${b}Помаранчевий дитячий перед.jpg` },
  { id: 'hoodie-vanilla',     nameUk: 'Ванільний худі',            category: 'hoodie-basic',     image: `${b}Ванільний перед.jpg` },
  { id: 'hoodie-lavender',    nameUk: 'Лавандовий худі',           category: 'hoodie-basic',     image: `${b}Лавандовий перед.jpg` },
  { id: 'hoodie-mint',        nameUk: "М'ятний худі",              category: 'hoodie-basic',     image: `${b}М_ятний перед.jpg` },
  { id: 'hoodie-chocolate',   nameUk: 'Шоколадний худі',           category: 'hoodie-basic',     image: `${b}Шоколадний перед.webp` },

  // ── Худі оверсайз з флісом ────────────────────────────────────
  { id: 'hoodie-fleece-brown',  nameUk: 'Коричневий флісовий оверсайз', category: 'hoodie-fleece', image: `${b}Копия Мокап_худі_з_флісом_новий_преміум_коричневий_перед.jpg` },
  { id: 'hoodie-fleece-pink',   nameUk: 'Рожевий флісовий оверсайз',    category: 'hoodie-fleece', image: `${b}Копия Мокап_худі_з_флісом_новий_преміум_перед_рожевий.jpg` },
  { id: 'hoodie-fleece-blue',   nameUk: 'Синій флісовий оверсайз',      category: 'hoodie-fleece', image: `${b}Копия Мокап_худі_з_флісом_новий_преміум_перед_синій.jpg` },
  { id: 'jh030-purple',         nameUk: 'Фіолетовий JH030',             category: 'hoodie-fleece', image: `${b}JH030 PURPLE (FRONT).jpg` },
  { id: 'jh030-yellow',         nameUk: 'Жовтий JH030',                 category: 'hoodie-fleece', image: `${b}JH030 SUN YELLOW (FRONT).jpg` },

  // ── Худі преміум без флісу ────────────────────────────────────
  { id: 'hoodie-prem-white',    nameUk: 'Білий преміум',      category: 'hoodie-premium', image: `${b}Копия Мокап_худі_без_флісу_новий_преміум_білий_перед.jpg` },
  { id: 'hoodie-prem-coyote',   nameUk: 'Койот преміум',      category: 'hoodie-premium', image: `${b}Копия Мокап_худі_без_флісу_новий_преміум_койот_перед.jpg` },
  { id: 'hoodie-prem-fume',     nameUk: 'Фюме преміум',       category: 'hoodie-premium', image: `${b}Копия Мокап_худі_без_флісу_новий_преміум_перед_фюме.jpg` },
  { id: 'hoodie-prem-black',    nameUk: 'Чорний преміум',     category: 'hoodie-premium', image: `${b}Копия Мокап_худі_без_флісу_новий_преміум_перед_чорний.jpg` },
  { id: 'hoodie-prem-gray',     nameUk: 'Сірий преміум',      category: 'hoodie-premium', image: `${b}Копия Мокап_худі_без_флісу_новий_преміум_сірий_перед_.jpg` },
  { id: 'hoodie-prem-khaki',    nameUk: 'Хакі преміум',       category: 'hoodie-premium', image: `${b}Копия Мокап_худі_без_флісу_новий_преміум_хакі_перед.jpg` },
  { id: 'hoodie-prem-brown',    nameUk: 'Коричневий преміум',  category: 'hoodie-premium', image: `${b}Копия Мокап_худі_без_флісу_преміум_коричневий_перед.jpg` },

  // ── Футболки базові ───────────────────────────────────────────
  { id: 'polo-lightblue',   nameUk: 'Блакитне поло',         category: 'tshirt-basic', image: `${b}IMG_9813.PNG` },
  { id: 'shirt-green',      nameUk: 'Зелена сорочка',        category: 'tshirt-basic', image: `${b}IMG_9820.PNG` },
  { id: 'shirt-gray',       nameUk: 'Сіра сорочка',          category: 'tshirt-basic', image: `${b}IMG_9821.PNG` },
  { id: 'tshirt-black',       nameUk: 'Чорна футболка',        category: 'tshirt-basic', image: `${b}футболка чорна.jpg` },
  { id: 'tshirt-white',       nameUk: 'Біла футболка',         category: 'tshirt-basic', image: `${b}футболка біла.jpg` },
  { id: 'tshirt-lightblue',   nameUk: 'Блакитна футболка',     category: 'tshirt-basic', image: `${b}футболка блакитна .jpg` },
  { id: 'tshirt-lightgray',   nameUk: 'Світло-сіра футболка',  category: 'tshirt-basic', image: `${b}футболка світло-сіра.jpg` },
  { id: 'tshirt-graphite',    nameUk: 'Графітова футболка',    category: 'tshirt-basic', image: `${b}футболка графіт.jpg` },
  { id: 'tshirt-burgundy',    nameUk: 'Бордова футболка',      category: 'tshirt-basic', image: `${b}футболка бордова .jpg` },
  { id: 'tshirt-darkblue',    nameUk: 'Темно-синя футболка',   category: 'tshirt-basic', image: `${b}футболка темно-синя.jpg` },
  { id: 'tshirt-darkgreen',   nameUk: 'Темно-зелена футболка', category: 'tshirt-basic', image: `${b}футболка темно-зелена.jpg` },
  { id: 'tshirt-khaki',       nameUk: 'Хакі футболка',         category: 'tshirt-basic', image: `${b}футболка хакі.jpg` },
  { id: 'tshirt-red',         nameUk: 'Червона футболка',      category: 'tshirt-basic', image: `${b}футболка черовна.jpg` },
  { id: 'tshirt-pink',        nameUk: 'Рожева футболка',       category: 'tshirt-basic', image: `${b}футолка рожева.jpg` },
  { id: 'tshirt-yellow',      nameUk: 'Жовта футболка',        category: 'tshirt-basic', image: `${b}футболка жовта.jpg` },
  { id: 'tshirt-orange',      nameUk: 'Помаранчева футболка',  category: 'tshirt-basic', image: `${b}футболка помаранчева.jpg` },
  { id: 'tshirt-sand',        nameUk: 'Пісочна футболка',      category: 'tshirt-basic', image: `${b}футболка пісочна.jpg` },
  { id: 'tshirt-purple',      nameUk: 'Фіолетова футболка',    category: 'tshirt-basic', image: `${b}футболка фіолетова.jpg` },

  // ── Оверсайз футболки ─────────────────────────────────────────
  { id: 'over-black',     nameUk: 'Чорна оверсайз',       category: 'tshirt-oversized', image: `${b}Копия Мокап футболка нова чорний перед оверсайз.jpg` },
  { id: 'over-tash',      nameUk: 'Таш оверсайз',         category: 'tshirt-oversized', image: `${b}Копия Мокап футболка нова перед таш оверсайз.jpg` },
  { id: 'over-lightblue', nameUk: 'Блакитна оверсайз',    category: 'tshirt-oversized', image: `${b}Копия Мокап_футболка_нова_перед_блакитний оверссайз.jpg` },
  { id: 'over-cream',     nameUk: 'Кремова оверсайз',     category: 'tshirt-oversized', image: `${b}Копия Мокап_футболка_нова_перед_кремовий оверсайз.jpg` },
  { id: 'over-lightgray', nameUk: 'Світло-сіра оверсайз', category: 'tshirt-oversized', image: `${b}Копия Мокап_футболка_нова_перед_світло_сірий оверсайз.jpg` },
  { id: 'over-darkgray',  nameUk: 'Темно-сіра оверсайз',  category: 'tshirt-oversized', image: `${b}Копия Мокап_футболка_нова_перед_темно_сірий оверсайз.jpg` },
  { id: 'over-white',     nameUk: 'Біла оверсайз',        category: 'tshirt-oversized', image: `${b}Білий колір футболка мокап оверсайз.png` },
  { id: 'over-mocco',     nameUk: 'Мокко оверсайз',       category: 'tshirt-oversized', image: `${b}Мокко перед оверсайз.jpg` },
  { id: 'over-pink',      nameUk: 'Рожева оверсайз',      category: 'tshirt-oversized', image: `${b}Рожевий оверсайз.jpg` },

  // ── Світшоти ──────────────────────────────────────────────────
  { id: 'sweat-purple', nameUk: 'Фіолетовий світшот JH001', category: 'sweatshirt', image: `${b}JH001 PURPLE (TORSO).jpg` },
  { id: 'sweat-blue',   nameUk: 'Синій світшот JH001',      category: 'sweatshirt', image: `${b}JH001 ROYAL BLUE (TORSO).jpg` },
  { id: 'sweat-yellow', nameUk: 'Жовтий світшот JH001',     category: 'sweatshirt', image: `${b}JH001 SUN YELLOW (TORSO).jpg` },

  // ── Шопери ────────────────────────────────────────────────────
  { id: 'shop-natural',       nameUk: 'Натуральний шопер',       category: 'shopper', image: `${b}IMG_9815.PNG` },
  { id: 'shop-beige-bottom', nameUk: 'Бежевий з дном шопер',   category: 'shopper', image: `${b}Копия бежевий з дном.jpg` },
  { id: 'shop-white',        nameUk: 'Білий шопер',             category: 'shopper', image: `${b}Копия білий.jpg` },
  { id: 'shop-beige',        nameUk: 'Звичайний бежевий шопер', category: 'shopper', image: `${b}Копия звичайний бежевий.jpg` },
  { id: 'shop-darkblue',     nameUk: 'Темно-синій шопер',       category: 'shopper', image: `${b}Копия темно-синій.jpg` },
  { id: 'shop-black',        nameUk: 'Чорний шопер',            category: 'shopper', image: `${b}Копия чорний.jpg` },

  // ── Кепки ─────────────────────────────────────────────────────
  { id: 'cap-lightblue', nameUk: 'Блакитна кепка',    category: 'cap', image: `${b}кепка блакитна.JPEG` },
  { id: 'cap-white',     nameUk: 'Біла кепка',         category: 'cap', image: `${b}кепка біла.JPEG` },
  { id: 'cap-brown',     nameUk: 'Коричнева кепка',    category: 'cap', image: `${b}кепка коричнева.JPEG` },
  { id: 'cap-milk',      nameUk: 'Молочна кепка',      category: 'cap', image: `${b}кепка молочна.JPEG` },
  { id: 'cap-orange',    nameUk: 'Помаранчева кепка',  category: 'cap', image: `${b}кепка помаранчева.JPEG` },
  { id: 'cap-blue',      nameUk: 'Синя кепка',         category: 'cap', image: `${b}кепка синя.png` },
  { id: 'cap-darkgreen', nameUk: 'Темно-зелена кепка', category: 'cap', image: `${b}кепка темно-зелена.JPEG` },
  { id: 'cap-darkblue',  nameUk: 'Темно-синя кепка',   category: 'cap', image: `${b}кепка темно-синій.JPEG` },
  { id: 'cap-darkgray',  nameUk: 'Темно-сіра кепка',   category: 'cap', image: `${b}кепка темно-сірий.JPEG` },
  { id: 'cap-black',     nameUk: 'Чорна кепка',        category: 'cap', image: `${b}кепка чорна.JPEG` },
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
    colors: ['#1a1a1a'],
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
