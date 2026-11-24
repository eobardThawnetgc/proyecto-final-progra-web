import prisma from "../../../config/prisma.js";

export const getSales = async (req, res, next) => {
  try {
    const sales = await prisma.sale.findMany({
      include: {
        details: {
          include: {
            product: true,
          },
        },
        payments: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({
      ok: true,
      data: sales,
    });
  } catch (error) {
    next(error);
  }
};

export const createSale = async (req, res, next) => {
  try {
    const { branchId, cashSessionId, items, paymentMethod, amountPaid } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        ok: false,
        message: "El carrito debe contener al menos un producto.",
      });
    }

    if (!paymentMethod || typeof paymentMethod !== "string") {
      return res.status(400).json({
        ok: false,
        message: "Debes indicar un método de pago válido.",
      });
    }

    const createdSale = await prisma.$transaction(async (tx) => {
      let subtotal = 0;
      const normalizedDetails = [];

      for (const item of items) {
        const quantity = Number(item.quantity);
        if (!item.productId || !Number.isInteger(quantity) || quantity <= 0) {
          throw new Error("INVALID_ITEM");
        }

        const product = await tx.product.findUnique({
          where: { id: item.productId },
          include: {
            recipes: true,
          },
        });

        if (!product) {
          throw new Error("PRODUCT_NOT_FOUND");
        }

        const unitPrice = Number(product.price);
        const lineTotal = Number((unitPrice * quantity).toFixed(2));
        subtotal = Number((subtotal + lineTotal).toFixed(2));

        normalizedDetails.push({
          productId: product.id,
          quantity,
          unitPrice,
          lineTotal,
        });

        if (Array.isArray(product.recipes) && product.recipes.length > 0) {
          for (const recipe of product.recipes) {
            const requiredQty = Number(recipe.quantity) * quantity;
            const ingredient = await tx.inventoryItem.findUnique({
              where: { id: recipe.inventoryItemId },
            });

            if (!ingredient || Number(ingredient.stock) < requiredQty) {
              throw new Error("INSUFFICIENT_STOCK");
            }

            await tx.inventoryItem.update({
              where: { id: ingredient.id },
              data: {
                stock: {
                  decrement: requiredQty,
                },
              },
            });
          }
        }
      }

      const total = subtotal;

      const sale = await tx.sale.create({
        data: {
          branchId: branchId ?? null,
          cashSessionId: cashSessionId ?? null,
          subtotal,
          total,
          status: "COMPLETED",
          details: {
            create: normalizedDetails,
          },
          payments: {
            create: [
              {
                method: paymentMethod,
                amount: Number(amountPaid ?? total),
              },
            ],
          },
        },
        include: {
          details: {
            include: { product: true },
          },
          payments: true,
        },
      });

      return sale;
    });

    return res.status(201).json({
      ok: true,
      message: "Venta registrada exitosamente.",
      data: createdSale,
    });
  } catch (error) {
    if (error.message === "INVALID_ITEM") {
      return res.status(400).json({
        ok: false,
        message: "Producto o cantidad inválida en el carrito.",
      });
    }
    if (error.message === "PRODUCT_NOT_FOUND") {
      return res.status(404).json({
        ok: false,
        message: "Uno de los productos seleccionados no existe.",
      });
    }
    if (error.message === "INSUFFICIENT_STOCK") {
      return res.status(409).json({
        ok: false,
        message: "Stock insuficiente para completar la venta.",
      });
    }
    next(error);
  }
};