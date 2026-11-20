import { Alert, Modal, ModalBody, ModalHeader } from 'reactstrap'

// Envuelve el Modal de Reactstrap. Se monta solo cuando hace falta, por eso isOpen es true.
export default function AppModal({ title, onClose, children }) {
  return (
    <Modal isOpen toggle={onClose} centered>
      <ModalHeader toggle={onClose}>{title}</ModalHeader>
      <ModalBody>{children}</ModalBody>
    </Modal>
  )
}

// Aplana el error de Zod { fieldErrors } a un arreglo de mensajes.
export const ErrorList = ({ error }) => {
  if (!error) return null
  const details = Object.values(error.details?.fieldErrors ?? {}).flat()
  return (
    <Alert color="danger">
      <p className="mb-0">{error.message}</p>
      {details.length > 0 && (
        <ul className="mb-0 mt-1">
          {details.map((detail) => <li key={detail}>{detail}</li>)}
        </ul>
      )}
    </Alert>
  )
}