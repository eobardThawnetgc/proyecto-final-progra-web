import { useEffect, useMemo, useState } from "react";
import { fetchPosProducts, createPosSale } from "../services/salesService";

export default function PosPage() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [submittingSale, setSubmittingSale] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  useEffect(() => {
    const loadProducts = async () => {
      setLoadingProducts(true);
      try {
        const list = await fetchPosProducts();
        setProducts(Array.isArray(list) ? list : []);
      } catch (err) {
        setFeedback({
          type: "error",
          message:
          err?.message ||
            "No se pudieron cargar los productos del menú.",
        });
      } finally {
        setLoadingProducts(false);
      }
    };

    loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return products;
    return products.filter((prod) =>
      String(prod.name || "").toLowerCase().includes(query)
    );
  }, [products, searchTerm]);

  const addToCart = (product) => {
    setFeedback({ type: "", message: "" });
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(
        (item) => item.productId === product.id
      );
      if (existingIndex > -1) {
        return prevCart.map((item, idx) =>
          idx === existingIndex ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prevCart,
        {
          productId: product.id,
          name: product.name,
          unitPrice: Number(product.price),
          quantity: 1,
        },
      ];
    });
  };

  const updateQuantity = (productId, delta) => {
    setCart((prevCart) =>
      prevCart
        .map((item) =>
          item.productId === productId
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId) => {
    setCart((prevCart) =>
      prevCart.filter((item) => item.productId !== productId)
    );
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  }, [cart]);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      setFeedback({
        type: "error",
        message: "Agrega al menos un producto al carrito.",
      });
      return;
    }

    setSubmittingSale(true);
    setFeedback({ type: "", message: "" });

    try {
      const payload = {
        paymentMethod,
        amountPaid: Number(cartTotal.toFixed(2)),
        items: cart.map(({ productId, quantity }) => ({
          productId,
          quantity,
        })),
      };

      const result = await createPosSale(payload);
      setCart([]);
      setFeedback({
        type: "success",
        message: result?.message || "Venta registrada correctamente.",
      });
    } catch (err) {
      setFeedback({
        type: "error",
        message: err?.message || "Error al registrar la venta.",
      });
    } finally {
      setSubmittingSale(false);
    }
  };

  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
      <section className="lg:col-span-2 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-2xl font-bold">Punto de Venta (POS)</h1>
          <input
            type="text"
            placeholder="Buscar producto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border rounded px-3 py-2 w-full sm:w-64"
          />
        </div>

        {feedback.message && (
          <div
            className={`p-3 rounded text-sm ${
              feedback.type === "success"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {feedback.message}
          </div>
        )}

        {loadingProducts ? (
          <p>Cargando productos...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="border rounded-lg p-4 flex flex-col justify-between"
              >
                <div>
                  <h2 className="font-semibold text-base">{product.name}</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    ${Number(product.price).toFixed(2)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => addToCart(product)}
                  className="mt-4 bg-black text-white py-2 px-3 rounded text-sm hover:opacity-90"
                >
                  Agregar al carrito
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <aside className="border rounded-lg p-4 flex flex-col justify-between h-fit space-y-4">
        <div>
          <h2 className="text-xl font-semibold mb-3">Carrito de compra</h2>

          {cart.length === 0 ? (
            <p className="text-sm text-gray-500">No hay productos agregados.</p>
          ) : (
            <ul className="divide-y">
              {cart.map((item) => (
                <li
                  key={item.productId}
                  className="py-3 flex items-center justify-between gap-2"
                >
                  <div>
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-gray-500">
                      ${(item.unitPrice * item.quantity).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.productId, -1)}
                      className="px-2 py-1 border rounded text-xs"
                    >
                      -
                    </button>
                    <span className="text-sm">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.productId, 1)}
                      className="px-2 py-1 border rounded text-xs"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.productId)}
                      className="text-xs text-red-600 ml-1"
                    >
                      Quitar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t pt-4 space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">
              Método de pago
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
            >
              <option value="CASH">Efectivo</option>
              <option value="CARD">Tarjeta</option>
              <option value="CHIVO_WALLET">Chivo Wallet / Bitcoin</option>
            </select>
          </div>

          <div className="flex items-center justify-between text-lg font-bold">
            <span>Total</span>
            <span>${cartTotal.toFixed(2)}</span>
          </div>

          <button
            type="button"
            disabled={submittingSale || cart.length === 0}
            onClick={handleCheckout}
            className="w-full bg-emerald-600 text-white py-2.5 rounded font-medium disabled:opacity-50"
          >
            {submittingSale ? "Registrando venta..." : "Registrar venta"}
          </button>
        </div>
      </aside>
    </div>
  );
}
