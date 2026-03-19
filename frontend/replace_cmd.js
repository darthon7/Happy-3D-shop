const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/Products.jsx', 'utf8');

// replace resetForm
content = content.replace(
  'isFeatured: false, isNew: true, variants: [],',
  'isFeatured: false, isNew: true, variants: [{ material: \\'PLA\\', stock: \\'0\\', sku: \\'\\', weightGrams: \\'\\', printTechnology: \\'\\', isActive: true }],'
);

const newMapping1 = \      variants: variants.length > 0 ? variants.map(v => ({
        id: v.id,
        sku: v.sku || '',
        material: v.material || '',
        stock: v.stock ?? '',
        isActive: v.isActive ?? true,
        weightGrams: v.weightGrams ?? '',
        printTechnology: v.printTechnology ?? '',
      })) : [{ material: 'PLA', stock: '0', sku: '', weightGrams: '', printTechnology: '', isActive: true }],\;
      
const regex1 = /variants:\\s*variants\\.map\\(v\\s*=>\\s*\\(\\{[\\s\\S]*?stlSpecs:\\s*v\\.stlSpecs\\s*\\?\\?\\s*'',\\s*\\}\\)\\),/g;
content = content.replace(regex1, newMapping1);

const newMapping2 = \        variants: formData.variants.map((v, i) => ({
          id: v.id,
          sku: v.sku || \\\3DP-\\\-\\\\\\,
          material: v.material || 'PLA',
          stock: Number(v.stock) || 0,
          isActive: v.isActive !== false,
          weightGrams: v.weightGrams ? parseInt(v.weightGrams) : null,
          printTechnology: v.printTechnology || null,
          color: '',
          colorHex: '#000000',
          priceAdjustment: 0,
          estimatedPrintMinutes: null,
          infillOptions: null,
          layerHeightOptions: null,
          requiresSupport: false,
          postProcessing: null,
          dimensionalAccuracy: null,
          stlSpecs: null,
        })),\;
const regex2 = /variants:\\s*formData\\.variants\\.map\\(\\(v,\\s*i\\)\\s*=>\\s*\\(\\{[\\s\\S]*?stlSpecs:\\s*v\\.stlSpecs\\s*\\|\\|\\s*null,\\s*\\}\\)\\),/g;
content = content.replace(regex2, newMapping2);

fs.writeFileSync('src/pages/admin/Products.jsx', content);
console.log('Replaced correctly!');
