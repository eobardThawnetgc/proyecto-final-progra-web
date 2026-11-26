import { useState } from 'react'
import { Button, Col, Form, FormGroup, FormText, Input, Label, Row } from 'reactstrap'
import AppModal, { ErrorList } from './Modal.jsx'
import { INVENTORY_TYPES, UNITS } from '../../constants/inventory.js'

// item === null → crear | item = {...} → editar
export default function InventoryForm({ item, saving, error, onSubmit, onClose }) {
  const isEdit = item !== null
  const setInteger = (name, value) => { if (/^\d*$/.test(value)) setForm((current) => ({ ...current, [name]: value })) }

  //estado del formulario y actualizacion de campos
  const [form, setForm] = useState({
    name: item?.name ?? '',
    type: item?.type ?? 'RAW_MATERIAL',
    unit: item?.unit ?? 'g',
    quantity: item?.quantity ?? 0,
    minimumStock: item?.minimumStock ?? 0,
  })

  //envio y preparacion del payload
  const handleChange = (event) =>
    setForm({ ...form, [event.target.name]: event.target.value })

  const handleSubmit = (event) => {
    event.preventDefault()

    const payload = {
      name: form.name,
      type: form.type,
      unit: form.unit,
      minimumStock: Number(form.minimumStock),
    }
    // La existencia inicial solo se envía al crear.
    if (!isEdit) payload.quantity = Number(form.quantity)

    onSubmit(payload)
  }

  return (
    <AppModal title={isEdit ? 'Editar insumo' : 'Registrar insumo'} onClose={onClose}>
      <ErrorList error={error} />

      <Form onSubmit={handleSubmit}>
        <FormGroup>
          <Label for="name">Nombre</Label>
          <Input id="name" name="name" value={form.name} onChange={handleChange} required />
        </FormGroup>

        <Row>
          <Col xs="6">
            <FormGroup>
              <Label for="type">Tipo</Label>
              <Input id="type" type="select" name="type" value={form.type} onChange={handleChange}>
                {INVENTORY_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </Input>
            </FormGroup>
          </Col>
          <Col xs="6">
            <FormGroup>
              <Label for="unit">Unidad</Label>
              <Input id="unit" name="unit" list="units" value={form.unit} onChange={handleChange} required />
              <datalist id="units">
                {UNITS.map((unit) => <option key={unit} value={unit} />)}
              </datalist>
            </FormGroup>
          </Col>
        </Row>

        <Row>
          {!isEdit && (
            <Col xs="6">
              <FormGroup>
                <Label for="quantity">Existencia inicial</Label>
                <Input id="quantity" name="quantity" type="text" inputMode="numeric" pattern="[0-9]*" maxLength="9"
                  value={form.quantity} onChange={(event) => setInteger("quantity", event.target.value)} />
              </FormGroup>
            </Col>
          )}
          <Col xs={isEdit ? '12' : '6'}>
            <FormGroup>
              <Label for="minimumStock">Stock mínimo</Label>
              <Input id="minimumStock" name="minimumStock" type="text" inputMode="numeric" pattern="[0-9]*" maxLength="9"
                value={form.minimumStock} onChange={(event) => setInteger("minimumStock", event.target.value)} />
            </FormGroup>
          </Col>
        </Row>

        {isEdit && (
          <FormText>Para cambiar la existencia usa la opción «Ajustar» de la tabla.</FormText>
        )}

        <div className="d-flex justify-content-end gap-2 mt-3">
          <Button type="button" className="inventory-secondary-button" onClick={onClose}>Cancelar</Button>
          <Button type="submit" className="inventory-primary-button" disabled={saving}>
            {saving ? <><span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />Guardando...</> : 'Guardar'}
          </Button>
        </div>
      </Form>
    </AppModal>
  )
}
