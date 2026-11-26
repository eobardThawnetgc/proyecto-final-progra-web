import { useState } from 'react'
import { Button, Form, FormGroup, Input } from 'reactstrap'
import AppModal, { ErrorList } from './Modal.jsx'
import { ADJUST_OPERATIONS } from '../../constants/inventory.js'

//Props y estado local
export default function StockAdjustModal({ item, saving, error, onSubmit, onClose }) {
  const [operation, setOperation] = useState('INCREMENT')
  const [amount, setAmount] = useState('')
  const setInteger = (value) => { if (/^\d*$/.test(value)) setAmount(value) }

  //Envio del ajuste
  const handleSubmit = (event) => {
    event.preventDefault()
    onSubmit({ operation, amount: Number(amount) })
  }

  return (
    <AppModal title={`Ajustar stock: ${item.name}`} onClose={onClose}>
      <p className="inventory-current-stock">
        Existencia actual: <strong>{item.quantity} {item.unit}</strong>
      </p>
      <ErrorList error={error} />

      <Form onSubmit={handleSubmit}>
        <FormGroup>
          <Input className="inventory-filter" type="select" aria-label="Tipo de ajuste" value={operation} onChange={(e) => setOperation(e.target.value)}>
            {ADJUST_OPERATIONS.map((op) => (
              <option key={op.value} value={op.value}>{op.label}</option>
            ))}
          </Input>
        </FormGroup>

        <FormGroup>
          <Input className="inventory-filter" type="text" inputMode="numeric" pattern="[0-9]*" maxLength="9" required placeholder={`Cantidad en ${item.unit}`}
            value={amount} onChange={(e) => setInteger(e.target.value)} />
        </FormGroup>

        <div className="d-flex justify-content-end gap-2">
          <Button type="button" className="inventory-secondary-button" onClick={onClose}>Cancelar</Button>
          <Button type="submit" className="inventory-primary-button" disabled={saving}>
            {saving ? <><span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />Aplicando...</> : 'Aplicar ajuste'}
          </Button>
        </div>
      </Form>
    </AppModal>
  )
}
