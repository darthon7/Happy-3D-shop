import re
import codecs

path = 'src/pages/admin/Products.jsx'
with codecs.open(path, 'r', 'utf-8') as f:
    text = f.read()

# 1. replace variants: [],
text = text.replace(
    'isFeatured: false, isNew: true, variants: [],',
    "isFeatured: false, isNew: true, variants: [{ material: 'PLA', stock: '0', sku: '', weightGrams: '', printTechnology: '', isActive: true }],"
)

# 2. replace openEditModal mapping
old1 = r"variants:\s*variants\.map\(v\s*=>\s*(\{[\s\S]*?stlSpecs:\s*v\.stlSpecs\s*\?\?\s*'?',\s*\})\),"
new1 = """variants: variants.length > 0 ? variants.map(v => ({
        id: v.id,
        sku: v.sku || '',
        material: v.material || '',
        stock: v.stock ?? '',
        isActive: v.isActive ?? true,
        weightGrams: v.weightGrams ?? '',
        printTechnology: v.printTechnology ?? '',
      })) : [{ material: 'PLA', stock: '0', sku: '', weightGrams: '', printTechnology: '', isActive: true }],"""
text = re.sub(old1, new1, text)

# 3. replace handleSubmit mapping
old2 = r"variants:\s*formData\.variants\.map\(\(v,\s*i\)\s*=>\s*(\{[\s\S]*?stlSpecs:\s*v\.stlSpecs\s*\|\|\s*null,\s*\})\),"
new2 = """variants: formData.variants.map((v, i) => ({
          id: v.id,
          sku: v.sku || `3DP-${Date.now().toString(36).toUpperCase()}-${i}`,
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
        })),"""
text = re.sub(old2, new2, text)

with codecs.open(path, 'w', 'utf-8') as f:
    f.write(text)

print("Done")
