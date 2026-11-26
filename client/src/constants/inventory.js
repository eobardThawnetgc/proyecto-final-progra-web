export const INVENTORY_TYPES = [
  { value: 'RAW_MATERIAL', label: 'Materia prima' },
  { value: 'SUPPLY', label: 'Insumo' },
  { value: 'PACKAGED', label: 'Producto empacado' },
]

export const UNITS = ['g', 'kg', 'ml', 'l', 'unidad', 'paquete', 'caja']

export const ADJUST_OPERATIONS = [
  { value: 'INCREMENT', label: 'Agregar existencia' },
  { value: 'DECREMENT', label: 'Descontar existencia' },
  { value: 'SET', label: 'Establecer existencia' },
]

export const typeLabel = (value) =>
  INVENTORY_TYPES.find((type) => type.value === value)?.label ?? value
