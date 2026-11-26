import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLoaderData, useNavigate } from 'react-router-dom'
import {
  Alert, Button, Card, CardBody, Col, Container, FormGroup, Input,
  Label, Row, Spinner,
} from 'reactstrap'
import { logout } from '../services/authService.js'
import { inventoryService } from '../services/inventoryService.js'
import { INVENTORY_TYPES } from '../constants/inventory.js'
import InventoryTable from '../components/inventory/InventoryTable.jsx'
import InventoryForm from '../components/inventory/InvertoryForm.jsx'
import StockAdjustModal from '../components/inventory/StockAdjustModal.jsx'
import AppNavbar from '../components/AppNavbar.jsx'
import './inventory.css'

const EMPTY_FILTERS = { search: '', type: '', lowStock: false }

export default function InventoryPage() {
  const { employee } = useLoaderData()
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
      navigate('/auth/login', { replace: true })
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
      if (error.status === 401) navigate('/auth/login', { replace: true })
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
    try {
      await logout()
      navigate('/auth/login', { replace: true })
    } catch (error) {
      setPageError(error.message)
    }
  }

  const summaryCards = [
    ['Insumos', summary.total, 'bi-box-seam', 'inventory-summary-total'],
    ['Stock bajo', summary.low, 'bi-exclamation-triangle', 'inventory-summary-low'],
    ['Agotados', summary.out, 'bi-archive', 'inventory-summary-out'],
  ]

  return (
    <main className="inventory-page">
      <AppNavbar employee={employee} onSignOut={handleLogout} />

      <Container className="inventory-content py-4 py-md-5">
        <div className="inventory-heading">
          <div>
            <p className="inventory-eyebrow mb-1">CONTROL DE EXISTENCIAS</p>
            <h1 className="inventory-title mb-1">Inventario de insumos</h1>
            <p className="inventory-description mb-0">Consulta existencias, revisa alertas y mantén actualizado el stock de la sucursal.</p>
          </div>
          {canManage && (
            <Button type="button" className="inventory-primary-button" onClick={() => setFormItem(null)}>
              <i className="bi bi-plus-lg me-2" aria-hidden="true" />Nuevo insumo
            </Button>
          )}
        </div>

        {/* Alertas de stock mínimo */}
        {alerts.length > 0 && (
          <Alert className="inventory-alert" color="warning">
            <h2 className="h6 fw-bold"><i className="bi bi-exclamation-triangle-fill me-2" aria-hidden="true" />{alerts.length} insumo(s) requieren reabastecimiento</h2>
            <ul className="inventory-alert-list list-unstyled mb-0">
              {alerts.map((item) => (
                <li key={item.id}>
                  <span>{item.name} · {item.branch.name}</span><strong>{item.quantity} / {item.minimumStock} {item.unit}</strong>
                </li>
              ))}
            </ul>
          </Alert>
        )}

        {/* Resumen */}
        <Row className="mb-3">
          {summaryCards.map(([label, value, icon, tone]) => (
            <Col key={label} xs="4">
              <Card className={`inventory-summary-card ${tone}`}>
                <CardBody className="d-flex align-items-center gap-3">
                  <span className="inventory-summary-icon"><i className={`bi ${icon}`} aria-hidden="true" /></span>
                  <div>
                    <small>{label}</small>
                    <p className="h3 fw-bold mb-0">{value}</p>
                  </div>
                </CardBody>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Filtros y acción */}
        <Card className="inventory-card mb-3">
          <CardBody>
            <Row className="g-2 align-items-center">
              <Col md="5">
                <Input className="inventory-filter" aria-label="Buscar insumo" placeholder="Buscar insumo..." value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
              </Col>
              <Col md="3">
                <Input className="inventory-filter" type="select" aria-label="Filtrar por tipo" value={filters.type}
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
                  <Label className="inventory-low-filter" check for="lowStock">Solo stock bajo</Label>
                </FormGroup>
              </Col>
            </Row>
          </CardBody>
        </Card>

        {notice && <Alert color="success" toggle={() => setNotice('')}>{notice}</Alert>}
        {pageError && <Alert color="danger">{pageError}</Alert>}

        <Card className="inventory-card inventory-table-card">
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
