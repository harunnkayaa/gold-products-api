// Gerekli paketleri çağırıyoruz
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const axios = require('axios');

// Express uygulamasını oluştur
const app = express();

// CORS middleware'i ekliyoruz
app.use(cors());

const PORT = process.env.PORT || 3001;


// Altın fiyatını çeken fonksiyon
async function getGoldPrice() {
  try {
    const response = await axios.get(
      'https://www.goldapi.io/api/XAU/USD',
      {
        headers: {
          'x-access-token': 'goldapi-kn2o8vsmct3at1c-io',
          'Content-Type': 'application/json'
        }
      }
    );

    const goldPriceOunce = response.data.price;
    const goldPricePerGram = goldPriceOunce / 31.1035;

    console.log('Gram Altın Fiyatı (USD):', goldPricePerGram);
    return goldPricePerGram;

  } catch (error) {
    console.error('Altın fiyatını çekerken hata:', error.message);
    return null;
  }
}

// Ürünleri döndüren endpoint
app.get('/products', async (req, res) => {
  try {
    // 1. Altının gram fiyatını çek
    const goldPricePerGram = await getGoldPrice();

    if (!goldPricePerGram) {
      return res.status(500).send('Altın fiyatı alınamadı.');
    }

    // 2. JSON dosyasını SENKRON oku
    const data = fs.readFileSync('./data/products.json', 'utf8');
    const productsRaw = JSON.parse(data);

    // 3. Ürünlerin fiyatını hesapla
    const productsWithPrice = productsRaw.map(product => {
      const price = (product.popularityScore + 1) * product.weight * goldPricePerGram;
      const popularityOutOfFive = (product.popularityScore * 5).toFixed(1);

      return {
        name: product.name,
        price: price.toFixed(2),
        popularityScore: popularityOutOfFive,
        weight: product.weight,
        images: product.images
      };
    });

    // 4. Frontend’e JSON döndür
    res.json(productsWithPrice);

  } catch (error) {
    console.error('Hata:', error.message);
    res.status(500).send('Sunucu Hatası');
  }
});

// Server'ı başlat
app.listen(PORT, () => {
  console.log(`Server çalışıyor → http://localhost:${PORT}`);
});
