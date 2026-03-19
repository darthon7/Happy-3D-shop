import codecs

path = 'src/pages/admin/Products.jsx'
with codecs.open(path, 'r', 'utf-8') as f:
    text = f.read()

start_marker = "              {/* Materials */}"
end_marker = "              {/* Shipping Dimensions */}"

start_index = text.find(start_marker)
end_index = text.find(end_marker)

if start_index == -1 or end_index == -1:
    print("Markers not found!")
    exit(1)

new_materials_section = """              {/* Materials */}
              <div>
                <h3 className="font-semibold mb-3 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-primary text-sm">3</span>
                    Materiales
                  </div>
                </h3>

                {fieldErrors.variants && <p className="text-red-400 text-sm mb-4">{fieldErrors.variants}</p>}

                  <div className="space-y-4">
                    {formData.variants.map((variant, index) => (
                      <div key={index} className={`flex flex-col gap-3 bg-surface-elevated p-4 rounded-xl border relative transition-all duration-300 ${variant.isActive === false ? 'border-amber-500/30 opacity-60 bg-surface-elevated/50' : 'border-border'}`}>
                        {!variant.isActive && (
                          <div className="absolute inset-x-0 inset-y-0 rounded-xl bg-surface/50 pointer-events-none z-10" />
                        )}
                        <div className="flex items-start justify-between">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 flex-1">
                            <div>
                              <label className="block text-xs text-text-secondary mb-1">Material *</label>
                              <input
                                type="text"
                                value={variant.material}
                                onChange={(e) => {
                                  const newVariants = [...formData.variants];
                                  newVariants[index].material = e.target.value;
                                  setFormData({ ...formData, variants: newVariants });
                                }}
                                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                placeholder="PLA, PETG, Resina..."
                              />
                              {fieldErrors[`variant_${index}_size`] && <span className="text-red-400 text-xs mt-0.5 block">{fieldErrors[`variant_${index}_size`]}</span>}
                            </div>
                            <div>
                              <label className="block text-xs text-text-secondary mb-1">Stock</label>
                              <input
                                type="number"
                                min="0"
                                value={variant.stock}
                                onChange={(e) => {
                                  const newVariants = [...formData.variants];
                                  newVariants[index].stock = e.target.value;
                                  setFormData({ ...formData, variants: newVariants });
                                }}
                                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                placeholder="0"
                              />
                              {fieldErrors[`variant_${index}_stock`] && <span className="text-red-400 text-xs mt-0.5 block">{fieldErrors[`variant_${index}_stock`]}</span>}
                            </div>
                            <div>
                              <label className="block text-xs text-text-secondary mb-1">SKU</label>
                              <input
                                type="text"
                                value={variant.sku}
                                onChange={(e) => {
                                  const newVariants = [...formData.variants];
                                  newVariants[index].sku = e.target.value;
                                  setFormData({ ...formData, variants: newVariants });
                                }}
                                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                                placeholder="3DP-001-PLA"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-text-secondary mb-1">Peso (gramos)</label>
                              <input
                                type="number"
                                min="0"
                                value={variant.weightGrams}
                                onChange={(e) => {
                                  const newVariants = [...formData.variants];
                                  newVariants[index].weightGrams = e.target.value;
                                  setFormData({ ...formData, variants: newVariants });
                                }}
                                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                placeholder="50"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-text-secondary mb-1">Tecnología</label>
                              <select
                                value={variant.printTechnology}
                                onChange={(e) => {
                                  const newVariants = [...formData.variants];
                                  newVariants[index].printTechnology = e.target.value;
                                  setFormData({ ...formData, variants: newVariants });
                                }}
                                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                              >
                                <option value="">Seleccionar</option>
                                <option value="FDM">FDM</option>
                                <option value="SLA">SLA / Resina</option>
                                <option value="SLS">SLS</option>
                                <option value="DLP">DLP</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
              </div>

"""

new_text = text[:start_index] + new_materials_section + text[end_index:]

with codecs.open(path, 'w', 'utf-8') as f:
    f.write(new_text)

print("Materials section replaced successfully")
