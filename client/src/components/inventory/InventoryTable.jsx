import { Button, Table } from 'reactstrap'
import StockBadge from './StockBadge.jsx'
import { typeLabel } from '../../constants/inventory.js'

//Props que recibe el componente
export default function InventoryTable({ items, canManage, onEdit, onAdjust, onDelete }) {
  //si esta vacio mostrar el mensaje
  if (items.length === 0) {
    return <p className="p-4 text-center text-muted mb-0">No hay insumos que coincidan con la búsqueda.</p>
  }

  return (
    <Table responsive hover className="align-middle mb-0">
      <thead className="table-light">
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
          <tr key={item.id} className={item.status === 'OK' ? '' : 'table-warning'}>
            <td className="fw-semibold">{item.name}</td>
            <td>{typeLabel(item.type)}</td>
            <td className="text-end">{item.quantity} {item.unit}</td>
            <td className="text-end">{item.minimumStock} {item.unit}</td>
            <td><StockBadge status={item.status} /></td>
            {canManage && (
              //botones de accion
              <td className="text-end text-nowrap">
                <Button size="sm" color="warning" outline className="me-1" onClick={() => onAdjust(item)}>Ajustar</Button>
                <Button size="sm" color="primary" outline className="me-1" onClick={() => onEdit(item)}>Editar</Button>
                <Button size="sm" color="danger" outline onClick={() => onDelete(item)}>Eliminar</Button>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </Table>
  )
}