import { useState } from 'react'
import { Button, Form, FormGroup, Input } from 'reactstrap'
import AppModal, { ErrorList } from './Modal.jsx'
import { ADJUST_OPERATIONS } from '../../constants/inventory.js'

//Props y estado local
export default function StockAdjustModal({ item, saving, error, onSubmit, onClose }) {
  const [operation, setOperation] = useState('INCREMENT')
  const [amount, setAmount] = useState('')

  //Envio del ajuste
  const handleSubmit = (event) => {
    event.preventDefault()
    onSubmit({ operation, amount: Number(amount) })
  }

  return (
    <AppModal title={`Ajustar stock: ${item.name}`} onClose={onClose}>
      <p className="text-muted">
        Existencia actual: <strong>{item.quantity} {item.unit}</strong>
      </p>
      <ErrorList error={error} />

      <Form onSubmit={handleSubmit}>
        <FormGroup>
          <Input type="select" value={operation} onChange={(e) => setOperation(e.target.value)}>
            {ADJUST_OPERATIONS.map((op) => (
              <option key={op.value} value={op.value}>{op.label}</option>
            ))}
          </Input>
        </FormGroup>

        <FormGroup>
          <Input type="number" min="0" step="0.001" required placeholder={`Cantidad en ${item.unit}`}
            value={amount} onChange={(e) => setAmount(e.target.value)} />
        </FormGroup>

        <div className="d-flex justify-content-end gap-2">
          <Button type="button" color="secondary" outline onClick={onClose}>Cancelar</Button>
          <Button color="warning" disabled={saving}>{saving ? 'Aplicando...' : 'Aplicar'}</Button>
        </div>
      </Form>
    </AppModal>
  )
}