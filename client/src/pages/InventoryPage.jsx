import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Alert, Button, Card, CardBody, Col, Container, FormGroup, Input,
  Label, Navbar, NavbarBrand, Row, Spinner,
} from 'reactstrap'
import { useAuth } from '../context/auth-context.js'
import { inventoryService } from '../services/inventoryService.js'
import { INVENTORY_TYPES } from '../constants/inventory.js'
import InventoryTable from '../components/inventory/InventoryTable.jsx'
import InventoryForm from '../components/inventory/InventoryForm.jsx'
import StockAdjustModal from '../components/inventory/StockAdjustModal.jsx'

const EMPTY_FILTERS = { search: '', type: '', lowStock: false }

export default function InventoryPage() {
  const { employee, logout } = useAuth()
  const navigate = useNavigate()

  const [items, setItems] = useState([])
  const [alerts, setAlerts] = useState([])
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')
  const [notice, setNotice] = useState('')

  // formItem: undefined = cerrado | null = crear | objeto = editar
  const [formItem, setFormItem] = useState(undefined)
  const [adjustItem, setAdjustItem] = useState(null)
  const [saving, setSaving] = useState(false)
  const [modalError, setModalError] = useState(null)

  const canManage = ['ADMIN', 'MANAGER'].includes(employee.role)

  const handleApiError = useCallback((error) => {
    if (error.status === 401) {
      navigate('/login')
      return
    }
    setPageError(error.message)
  }, [navigate])

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setPageError('')

      // Dos peticiones en paralelo: listado filtrado + alertas globales.
      const [list, alertData] = await Promise.all([
        inventoryService.list({
          search: filters.search.trim(),
          type: filters.type,
          lowStock: filters.lowStock || '',
        }),
        inventoryService.getAlerts(),
      ])

      setItems(list.items)
      setAlerts(alertData.items)
    } catch (error) {
      handleApiError(error)
    } finally {
      setLoading(false)
    }
  }, [filters, handleApiError])

  // Debounce de 300 ms para no consultar en cada tecla.
  useEffect(() => {
    const timer = setTimeout(loadData, 300)
    return () => clearTimeout(timer)
  }, [loadData])

  const summary = useMemo(
    () => items.reduce(
      (acc, item) => {
        acc.total += 1
        if (item.status === 'LOW') acc.low += 1
        if (item.status === 'OUT') acc.out += 1
        return acc
      },
      { total: 0, low: 0, out: 0 },
    ),
    [items],
  )

  const closeModals = () => {
    setFormItem(undefined)
    setAdjustItem(null)
    setModalError(null)
  }

  // Patrón común de guardado para los dos modales.
  const runAction = async (action, successMessage) => {
    try {
      setSaving(true)
      setModalError(null)
      await action()
      closeModals()
      setNotice(successMessage)
      await loadData()
    } catch (error) {
      if (error.status === 401) navigate('/login')
      else setModalError(error)
    } finally {
      setSaving(false)
    }
  }

  const handleSave = (payload) =>
    formItem === null
      ? runAction(() => inventoryService.create(payload), 'Insumo registrado correctamente')
      : runAction(() => inventoryService.update(formItem.id, payload), 'Insumo actualizado correctamente')

  const handleAdjust = (payload) =>
    runAction(() => inventoryService.adjustStock(adjustItem.id, payload), 'Stock actualizado correctamente')

  const handleDelete = async (item) => {
    if (!window.confirm(`¿Eliminar "${item.name}"?`)) return

    try {
      await inventoryService.remove(item.id)
      setNotice('Insumo eliminado correctamente')
      await loadData()
    } catch (error) {
      handleApiError(error)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const summaryCards = [
    ['Insumos', summary.total, 'text-dark'],
    ['Stock bajo', summary.low, 'text-warning'],
    ['Agotados', summary.out, 'text-danger'],
  ]

  return (
    <main className="min-vh-100 bg-light">
      <Navbar color="white" light className="shadow-sm px-3">
        <NavbarBrand tag="div">
          <span className="h5 fw-bold d-block mb-0">Inventario de insumos</span>
          <small className="text-muted">{employee.name} · {employee.role}</small>
        </NavbarBrand>
        <Button color="link" size="sm" onClick={handleLogout}>Cerrar sesión</Button>
      </Navbar>

      <Container className="py-4">
        {/* Alertas de stock mínimo */}
        {alerts.length > 0 && (
          <Alert color="warning">
            <h2 className="h6 fw-bold">⚠ {alerts.length} insumo(s) requieren reabastecimiento</h2>
            <ul className="list-inline mb-0">
              {alerts.map((item) => (
                <li key={item.id} className="list-inline-item bg-white rounded-pill px-3 py-1 mb-1 shadow-sm">
                  {item.name}: <strong>{item.quantity}</strong>/{item.minimumStock} {item.unit}
                </li>
              ))}
            </ul>
          </Alert>
        )}

        {/* Resumen */}
        <Row className="mb-3">
          {summaryCards.map(([label, value, color]) => (
            <Col key={label} xs="4">
              <Card className="shadow-sm">
                <CardBody>
                  <small className="text-muted">{label}</small>
                  <p className={`h3 fw-bold mb-0 ${color}`}>{value}</p>
                </CardBody>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Filtros y acción */}
        <Card className="shadow-sm mb-3">
          <CardBody>
            <Row className="g-2 align-items-center">
              <Col md="5">
                <Input placeholder="Buscar insumo..." value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
              </Col>
              <Col md="3">
                <Input type="select" value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
                  <option value="">Todos los tipos</option>
                  {INVENTORY_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </Input>
              </Col>
              <Col md="2">
                <FormGroup check className="mb-0">
                  <Input id="lowStock" type="checkbox" checked={filters.lowStock}
                    onChange={(e) => setFilters({ ...filters, lowStock: e.target.checked })} />
                  <Label check for="lowStock">Solo stock bajo</Label>
                </FormGroup>
              </Col>
              {canManage && (
                <Col md="2" className="text-md-end">
                  <Button color="warning" onClick={() => setFormItem(null)}>+ Nuevo insumo</Button>
                </Col>
              )}
            </Row>
          </CardBody>
        </Card>

        {notice && <Alert color="success" toggle={() => setNotice('')}>{notice}</Alert>}
        {pageError && <Alert color="danger">{pageError}</Alert>}

        <Card className="shadow-sm">
          {loading
            ? <div className="p-5 text-center"><Spinner color="secondary" /></div>
            : <InventoryTable items={items} canManage={canManage}
                onEdit={setFormItem} onAdjust={setAdjustItem} onDelete={handleDelete} />}
        </Card>
      </Container>

      {formItem !== undefined && (
        <InventoryForm item={formItem} saving={saving} error={modalError}
          onSubmit={handleSave} onClose={closeModals} />
      )}

      {adjustItem && (
        <StockAdjustModal item={adjustItem} saving={saving} error={modalError}
          onSubmit={handleAdjust} onClose={closeModals} />
      )}
    </main>
  )
}