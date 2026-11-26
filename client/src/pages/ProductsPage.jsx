import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLoaderData, useNavigate } from 'react-router-dom';
import { Alert, Badge, Button, Card, CardBody, Container, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Spinner } from 'reactstrap';
import { toast } from 'sonner';
import { logout } from '../services/authService.js';
import { productsService } from '../services/productsService.js';
import AppNavbar from '../components/AppNavbar.jsx';
import './products.css';

const money = (value) => new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' }).format(Number(value));
const emptyForm = () => ({ name: '', description: '', type: 'PREPARED', price: '', recipe: [{ inventoryItemId: '', quantity: '' }], inventoryItemId: '' });

export default function ProductsPage() {
    const { employee, products: initialProducts, ingredients, packagedInventory } = useLoaderData();
    const navigate = useNavigate();
    const canManage = ['ADMIN', 'MANAGER'].includes(employee.role);
    const canConsume = ['ADMIN', 'MANAGER', 'CASHIER'].includes(employee.role);
    const [products, setProducts] = useState(initialProducts);
    const [search, setSearch] = useState('');
    const [type, setType] = useState('');
    const [modal, setModal] = useState(null);
    const [form, setForm] = useState(emptyForm());
    const [consumeAmount, setConsumeAmount] = useState('1');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    const loadProducts = useCallback(async () => {
        const result = await productsService.list({ search: search.trim(), type, active: 'true' });
        setProducts(result.products);
    }, [search, type]);

    useEffect(() => {
        const timer = setTimeout(() => loadProducts().catch((e) => setError(e.message)), 250);
        return () => clearTimeout(timer);
    }, [loadProducts]);

    const summary = useMemo(() => ({
        total: products.length,
        prepared: products.filter((product) => product.type === 'PREPARED').length,
        packaged: products.filter((product) => product.type === 'PACKAGED').length,
        low: products.filter((product) => product.recipe.some((line) => line.stock <= line.minimumStock)
            || (product.inventoryItem && product.inventoryItem.quantity <= product.inventoryItem.minimumStock)).length,
    }), [products]);

    const openCreate = () => { setForm(emptyForm()); setError(''); setModal({ kind: 'edit' }); };
    const openEdit = (product) => {
        setForm({
            name: product.name, description: product.description ?? '', type: product.type, price: String(product.price),
            recipe: product.recipe.length ? product.recipe.map((line) => ({ inventoryItemId: String(line.inventoryItemId), quantity: String(line.quantity) })) : [{ inventoryItemId: '', quantity: '' }],
            inventoryItemId: String(product.inventoryItem?.id ?? ''),
        });
        setError(''); setModal({ kind: 'edit', product });
    };

    const save = async (event) => {
        event.preventDefault(); setSaving(true); setError('');
        const payload = {
            name: form.name.trim(), description: form.description.trim() || null,
            type: form.type, price: Number(form.price),
            ...(form.type === 'PREPARED' ? { recipe: form.recipe.filter((line) => line.inventoryItemId && line.quantity).map((line) => ({ inventoryItemId: Number(line.inventoryItemId), quantity: Number(line.quantity) })) } : { inventoryItemId: Number(form.inventoryItemId) }),
        };
        try {
            if (modal.product) await productsService.update(modal.product.id, payload);
            else await productsService.create(payload);
            toast.success(modal.product ? 'Producto actualizado' : 'Producto creado');
            setModal(null); await loadProducts();
        } catch (e) { setError(e.message); }
        finally { setSaving(false); }
    };

    const deactivate = async (product) => {
        if (!window.confirm(`¿Retirar “${product.name}” del menú?`)) return;
        try { await productsService.deactivate(product.id); toast.success('Producto retirado del menú'); await loadProducts(); }
        catch (e) { setError(e.message); }
    };

    const consume = async (event) => {
        event.preventDefault(); setBusy(true); setError('');
        try {
            const result = await productsService.consume(modal.product.id, Number(consumeAmount));
            toast.success(`Consumo registrado: ${result.consumed.map((line) => `${line.name} −${line.quantity} ${line.unit}`).join(', ')}`);
            setModal(null); await loadProducts();
        } catch (e) { setError(e.message); }
        finally { setBusy(false); }
    };

    const signOut = async () => { await logout(); navigate('/auth/login'); };
    const changeForm = (key, value) => setForm((current) => ({ ...current, [key]: value }));

    return <main className="products-page">
        <AppNavbar employee={employee} onSignOut={signOut} />
        <Container className="products-content py-4 py-lg-5">
            <div className="products-heading"><div><p className="eyebrow">CATÁLOGO Y PRODUCCIÓN</p><h1>Productos y recetas</h1><p>Define el menú y controla cada ingrediente que se utiliza.</p></div>{canManage && <Button className="products-create" onClick={openCreate}><i className="bi bi-plus-lg me-2"/>Nuevo producto</Button>}</div>
            <div className="products-stats">
                <div><span>En el menú</span><strong>{summary.total}</strong></div><div><span>Elaborados</span><strong>{summary.prepared}</strong></div><div><span>Empacados</span><strong>{summary.packaged}</strong></div><div className={summary.low ? 'warning' : ''}><span>Revisar stock</span><strong>{summary.low}</strong></div>
            </div>
            {error && !modal && <Alert color="danger" toggle={() => setError('')}>{error}</Alert>}
            <div className="products-filters"><div className="products-search"><i className="bi bi-search"/><Input aria-label="Buscar producto" placeholder="Buscar en el menú" value={search} onChange={(e) => setSearch(e.target.value)}/></div><Input aria-label="Filtrar por tipo" type="select" value={type} onChange={(e) => setType(e.target.value)}><option value="">Todos los tipos</option><option value="PREPARED">Elaborados</option><option value="PACKAGED">Empacados</option></Input></div>
            {products.length ? <div className="products-grid">{products.map((product) => {
                const low = product.type === 'PREPARED' ? product.recipe.some((line) => line.stock <= line.minimumStock) : product.inventoryItem?.quantity <= product.inventoryItem?.minimumStock;
                return <Card key={product.id} className="product-card"><CardBody>
                    <div className="product-card-top"><span className={`product-icon ${product.type === 'PACKAGED' ? 'packaged' : ''}`}><i className={`bi ${product.type === 'PACKAGED' ? 'bi-box-seam' : 'bi-cup-hot'}`}/></span><Badge pill className={product.type === 'PREPARED' ? 'badge-prepared' : 'badge-packaged'}>{product.type === 'PREPARED' ? 'Elaborado' : 'Empacado'}</Badge>{low && <span className="stock-warning" title="Hay ingredientes en nivel mínimo"><i className="bi bi-exclamation-circle-fill"/></span>}</div>
                    <h2>{product.name}</h2><p className="product-description">{product.description || 'Sin descripción'}</p><div className="product-price">{money(product.price)} <span>por unidad</span></div>
                    <div className="recipe-preview">{product.type === 'PREPARED' ? <><strong>Receta</strong><span>{product.recipe.map((line) => `${line.quantity} ${line.unit} ${line.name}`).join(' · ')}</span></> : <><strong>Existencia</strong><span>{product.inventoryItem?.quantity ?? 0} {product.inventoryItem?.unit ?? 'unidades'} disponibles</span></>}</div>
                    <div className="product-actions">{canConsume && <Button outline className="consume-button" onClick={() => { setError(''); setConsumeAmount('1'); setModal({ kind: 'consume', product }); }}><i className="bi bi-dash-circle me-2"/>Registrar consumo</Button>}{canManage && <><Button className="icon-action" aria-label={`Editar ${product.name}`} onClick={() => openEdit(product)}><i className="bi bi-pencil"/></Button><Button className="icon-action danger" aria-label={`Retirar ${product.name}`} onClick={() => deactivate(product)}><i className="bi bi-archive"/></Button></>}</div>
                </CardBody></Card>;
            })}</div> : <div className="products-empty"><i className="bi bi-journal-x"/><h2>No hay productos para mostrar</h2><p>Prueba otro filtro o agrega el primer producto al menú.</p>{canManage && <Button className="products-create" onClick={openCreate}>Crear producto</Button>}</div>}
        </Container>
        <Modal isOpen={Boolean(modal)} toggle={() => setModal(null)} centered size={modal?.kind === 'edit' ? 'lg' : undefined} className="products-modal">
            {modal?.kind === 'edit' ? <form onSubmit={save}><ModalHeader toggle={() => setModal(null)}>{modal.product ? 'Editar producto' : 'Nuevo producto'}</ModalHeader><ModalBody>
                {error && <Alert color="danger">{error}</Alert>}
                <div className="editor-grid"><div><Label for="product-name">Nombre del producto</Label><Input id="product-name" value={form.name} onChange={(e) => changeForm('name', e.target.value)} minLength="2" maxLength="100" required/></div><div><Label for="product-price">Precio de venta · USD</Label><Input id="product-price" type="number" min="0.01" step="0.01" value={form.price} onChange={(e) => changeForm('price', e.target.value)} required/></div><div className="editor-full"><Label for="product-description">Descripción</Label><Input id="product-description" value={form.description} onChange={(e) => changeForm('description', e.target.value)} maxLength="500"/></div><div className="editor-full"><Label for="product-type">Tipo de producto</Label><Input id="product-type" type="select" value={form.type} onChange={(e) => changeForm('type', e.target.value)}><option value="PREPARED">Elaborado con receta</option><option value="PACKAGED">Empacado para reventa</option></Input></div></div>
                {form.type === 'PREPARED' ? <section className="recipe-editor"><div className="recipe-editor-heading"><div><h3>Ingredientes por unidad</h3><p>Al registrar consumo, estas cantidades se descuentan del inventario.</p></div><Button type="button" className="add-ingredient" onClick={() => changeForm('recipe', [...form.recipe, { inventoryItemId: '', quantity: '' }])}><i className="bi bi-plus-lg me-1"/>Agregar</Button></div>{form.recipe.map((line, index) => <div className="ingredient-row" key={index}><Input aria-label="Ingrediente" type="select" value={line.inventoryItemId} onChange={(e) => changeForm('recipe', form.recipe.map((row, i) => i === index ? { ...row, inventoryItemId: e.target.value } : row))}><option value="">Selecciona un insumo</option>{ingredients.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.unit} · stock {item.quantity}</option>)}</Input><Input aria-label="Cantidad del ingrediente" type="number" min="0.001" step="0.001" placeholder="Cantidad" value={line.quantity} onChange={(e) => changeForm('recipe', form.recipe.map((row, i) => i === index ? { ...row, quantity: e.target.value } : row))}/><Button type="button" className="remove-ingredient" aria-label="Quitar ingrediente" disabled={form.recipe.length === 1} onClick={() => changeForm('recipe', form.recipe.filter((_, i) => i !== index))}><i className="bi bi-x-lg"/></Button></div>)}</section> : <section className="recipe-editor"><Label for="packaged-inventory">Existencia de inventario vinculada</Label><Input id="packaged-inventory" type="select" value={form.inventoryItemId} onChange={(e) => changeForm('inventoryItemId', e.target.value)} required><option value="">Selecciona el producto empacado</option>{packagedInventory.map((item) => <option key={item.id} value={item.id}>{item.name} · stock {item.quantity} {item.unit}</option>)}{modal.product?.inventoryItem && !packagedInventory.some((item) => String(item.id) === form.inventoryItemId) && <option value={form.inventoryItemId}>{modal.product.inventoryItem.name} · stock {modal.product.inventoryItem.quantity}</option>}</Input><p>El producto y su existencia se descuentan juntos al registrar consumo.</p></section>}
            </ModalBody><ModalFooter><Button className="cancel-button" onClick={() => setModal(null)} type="button">Cancelar</Button><Button className="products-create" disabled={saving}>{saving ? 'Guardando…' : modal.product ? 'Guardar cambios' : 'Crear producto'}</Button></ModalFooter></form> : modal?.kind === 'consume' ? <form onSubmit={consume}><ModalHeader toggle={() => setModal(null)}>Registrar consumo</ModalHeader><ModalBody>{error && <Alert color="danger">{error}</Alert>}<p className="consume-intro">Se actualizarán las existencias según la receta de <strong>{modal.product.name}</strong>.</p><Label for="consume-quantity">Unidades vendidas / consumidas</Label><Input id="consume-quantity" type="number" min="0.001" step="0.001" value={consumeAmount} onChange={(e) => setConsumeAmount(e.target.value)} required/><div className="consume-preview">{modal.product.recipe.map((line) => <span key={line.inventoryItemId}>{line.name}<strong>{(line.quantity * Number(consumeAmount || 0)).toLocaleString('es-SV')} {line.unit}</strong></span>)}</div></ModalBody><ModalFooter><Button className="cancel-button" type="button" onClick={() => setModal(null)}>Cancelar</Button><Button className="products-create" disabled={busy}>{busy ? <><Spinner size="sm" className="me-2"/>Registrando…</> : 'Confirmar consumo'}</Button></ModalFooter></form> : null}
        </Modal>
    </main>;
}
