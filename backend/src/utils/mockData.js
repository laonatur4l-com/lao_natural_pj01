export const mockProducts = [
  {
    id: 1,
    name: 'ຊາມອນທອດສະໝຸນໄພ (Wild Herbal Green Tea)',
    description: 'ຊາຂຽວສະໝຸນໄພທຳມະຊາດ ຈາກພູເຂົາສູງ ຫຼວງພະບາງ ຊ່ວຍຜ່ອນຄາຍ ແລະ ບຳລຸງສຸຂະພາບ.',
    category: 'Tea',
    size: '100g',
    price: 85000,
    import_price: 45000,
    stock: 50,
    image_url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&q=80&w=600',
    ingredients: '100% Organic Lao Green Tea Leaves',
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    name: 'ນ້ຳມັນນວດສະໝຸນໄພລາວ (Natural Herbal Massage Oil)',
    description: 'ນ້ຳມັນນວດສະໝຸນໄພສູດໂບຮານ ຊ່ວຍຫຼຸດຜ່ອນຄວາມເມື່ອຍລ້າ ບັນເທົາອາການປວດເມື່ອຍ.',
    category: 'Essential Oils',
    size: '100ml',
    price: 120000,
    import_price: 60000,
    stock: 35,
    image_url: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&q=80&w=600',
    ingredients: 'Lemongrass, Ginger, Coconut Oil, Plai Essential Oil',
    created_at: new Date().toISOString()
  },
  {
    id: 3,
    name: 'ສະບູ່ສະໝຸນໄພຂະໝີ້ນ (Organic Turmeric Soap)',
    description: 'ສະບູ່ທຳມະຊາດຜະສົມຂະໝີ້ນ ແລະ ນ້ຳເຜິ້ງທຳມະຊາດ ຊ່ວຍບຳລຸງຜິວໃຫ້ຜຸດຜ່ອງ.',
    category: 'Skincare',
    size: '120g',
    price: 45000,
    import_price: 20000,
    stock: 100,
    image_url: 'https://images.unsplash.com/photo-1607006482172-e58918973b88?auto=format&fit=crop&q=80&w=600',
    ingredients: 'Wild Honey, Turmeric Extract, Organic Virgin Coconut Oil',
    created_at: new Date().toISOString()
  },
  {
    id: 4,
    name: 'ກາເຟອາຣາບິກ້າ ບໍລິເວນ (Bolaven Arabica Coffee Beans)',
    description: 'ເມັດກາເຟອາຣາບິກ້າແທ້ 100% ຈາກພູພຽງບໍລິເວນ ຮູບແບບຄົ້ວເຂັ້ມ ຫອມກົມກ່ອມ.',
    category: 'Coffee',
    size: '250g',
    price: 95000,
    import_price: 50000,
    stock: 80,
    image_url: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&q=80&w=600',
    ingredients: '100% Single Origin Bolaven Arabica Coffee Beans',
    created_at: new Date().toISOString()
  },
  {
    id: 5,
    name: 'ນ້ຳເຜິ້ງປ່າທຳມະຊາດ (Pure Wild Mountain Honey)',
    description: 'ນ້ຳເຜິ້ງປ່າແທ້ 100% ເກັບຈາກປ່າທຳມະຊາດພູເຂົາສູງ ເຮັດໃຫ້ໄດ້ລົດຊາດຫອມຫວານກົມກ່ອມ.',
    category: 'Honey',
    size: '500ml',
    price: 150000,
    import_price: 80000,
    stock: 25,
    image_url: 'https://images.unsplash.com/photo-1587049352847-4a222e784d38?auto=format&fit=crop&q=80&w=600',
    ingredients: '100% Raw Wild Mountain Honey',
    created_at: new Date().toISOString()
  }
];

export const mockCategories = [
  { id: 1, name: 'Tea', description: 'Organic Lao Teas & Herbal Infusions' },
  { id: 2, name: 'Essential Oils', description: 'Natural Essential Oils & Aromatherapy' },
  { id: 3, name: 'Skincare', description: 'Handcrafted Soaps & Herbal Skincare' },
  { id: 4, name: 'Coffee', description: 'Bolaven Plateau Speciality Coffee' },
  { id: 5, name: 'Honey', description: 'Wild Mountain Honey & Natural Sweeteners' }
];

export const mockBanners = [
  {
    id: 1,
    title: 'Lao Natural Essentials',
    type: 'hero',
    image_url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=1200',
    link_url: '/products'
  }
];

export const mockDistributors = [
  { id: 1, name: 'Anousith Express', contact_phone: '020 5555 1111', location: 'Vientiane' },
  { id: 2, name: 'HAL Logistics', contact_phone: '020 5555 2222', location: 'Vientiane' },
  { id: 3, name: 'VET Express', contact_phone: '020 5555 3333', location: 'Luang Prabang' }
];

export const mockExchangeRates = {
  thb_rate: 670,
  usd_rate: 21800,
  updated_at: new Date().toISOString()
};
