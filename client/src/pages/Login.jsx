import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Alert, Button, Card, CardBody, Form, FormGroup, Input, Label } from 'reactstrap'
import { useAuth } from '../context/auth-context.js'

export default function Login() {
  const { employee, login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (employee) return <Navigate to="/inventario" replace />

  const handleChange = (event) =>
    setForm({ ...form, [event.target.name]: event.target.value })

  const handleSubmit = async (event) => {
    event.preventDefault()
    try {
      setSubmitting(true)
      setError('')
      await login(form.email, form.password)
      navigate('/inventario')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-vh-100 d-flex align-items-center justify-content-center bg-light p-3">
      <Card className="shadow-sm w-100" style={{ maxWidth: 400 }}>
        <CardBody className="p-4">
          <h1 className="h3 fw-bold">Orígenes SV</h1>
          <p className="text-muted">Inicia sesión para continuar</p>

          {error && <Alert color="danger">{error}</Alert>}

          <Form onSubmit={handleSubmit}>
            <FormGroup>
              <Label for="email">Correo</Label>
              <Input id="email" name="email" type="email" value={form.email}
                onChange={handleChange} required />
            </FormGroup>
            <FormGroup>
              <Label for="password">Contraseña</Label>
              <Input id="password" name="password" type="password" value={form.password}
                onChange={handleChange} required />
            </FormGroup>
            <Button color="warning" block disabled={submitting}>
              {submitting ? 'Ingresando...' : 'Ingresar'}
            </Button>
          </Form>
        </CardBody>
      </Card>
    </main>
  )
}