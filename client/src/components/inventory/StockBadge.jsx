import { Badge } from 'reactstrap' //Etiqueta o insignia

//Direccion de estados
const STATUS = {
  OK: { label: 'Disponible', color: 'success' },
  LOW: { label: 'Stock bajo', color: 'warning' },
  OUT: { label: 'Agotado', color: 'danger' },
}

export default function StockBadge({ status }) {
  //Selección del estado y valor por defecto
  const { label, color } = STATUS[status] ?? STATUS.OK
  return <Badge color={color} pill>{label}</Badge>
}