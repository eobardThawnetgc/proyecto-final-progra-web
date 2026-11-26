import { Button, Table } from 'reactstrap'
import StockBadge from './StockBadge.jsx'
import { typeLabel } from '../../constants/inventory.js'

//Props que recibe el componente
export default function InventoryTable({ items, canManage, onEdit, onAdjust, onDelete }) {
  //si esta vacio mostrar el mensaje
  if (items.length === 0) {
    return <div className="inventory-empty-state">
      <i className="bi bi-box-seam" aria-hidden="true" />
      <p className="mb-1">No hay insumos que coincidan con la búsqueda.</p>
      <small>Prueba con otro término o cambia los filtros.</small>
    </div>
  }

  return (
    <Table responsive hover className="inventory-table align-middle mb-0">
      <thead>
        <tr>
          <th>Insumo</th>
          <th>Tipo</th>
          <th className="text-end">Existencia</th>
          <th className="text-end">Mínimo</th>
          <th>Estado</th>
          {canManage && <th className="text-end">Acciones</th>}
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          //filas de datos y alerta visual
          <tr key={item.id} className={item.status === 'OK' ? '' : 'inventory-row-alert'}>
            <td className="fw-semibold">{item.name}</td>
            <td>{typeLabel(item.type)}</td>
            <td className="text-end">{item.quantity} {item.unit}</td>
            <td className="text-end">{item.minimumStock} {item.unit}</td>
            <td><StockBadge status={item.status} /></td>
            {canManage && (
              //botones de accion
              <td className="text-end text-nowrap">
                <Button type="button" size="sm" className="inventory-action-adjust me-1" onClick={() => onAdjust(item)}>
                  <i className="bi bi-arrow-left-right me-1" aria-hidden="true" />Ajustar
                </Button>
                <Button type="button" size="sm" className="inventory-action-edit me-1" onClick={() => onEdit(item)}>
                  <i className="bi bi-pencil me-1" aria-hidden="true" />Editar
                </Button>
                <Button type="button" size="sm" className="inventory-action-delete" onClick={() => onDelete(item)}>
                  <i className="bi bi-trash3 me-1" aria-hidden="true" />Eliminar
                </Button>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </Table>
  )
}
