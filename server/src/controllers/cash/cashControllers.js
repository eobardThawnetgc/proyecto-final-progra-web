import prisma from '../../../config/prisma.js';
import { Prisma } from '../../../prisma/generated/client.ts';
import { closeCashSchema, openCashSchema } from '../../utils/validators/cashValidator.js';

const methods = ['CASH', 'CARD', 'DIGITAL', 'BITCOIN', 'CHIVO_WALLET'];
const zero = () => new Prisma.Decimal(0);
const sessionRelations = {
    employee: { select: { id: true, name: true } },
    branch: { select: { id: true, name: true } },
};

const validationError = (res, parsed) => res.status(400).json({
    message: parsed.error.issues[0].message,
    errors: parsed.error.flatten(),
});

const paymentTotals = (payments) => {
    const totals = Object.fromEntries(methods.map((method) => [method, zero()]));
    for (const payment of payments) {
        totals[payment.method] = totals[payment.method].plus(payment.amount);
    }
    return totals;
};

const expectedTotals = (session, payments) => {
    const totals = paymentTotals(payments);
    totals.CASH = totals.CASH.plus(session.openingAmount);
    return totals;
};

const getPayments = async (client, sessionIds) => {
    if (!sessionIds.length) return new Map();

    const payments = await client.payment.findMany({
        where: { sale: { cashSessionId: { in: sessionIds } } },
        select: {
            method: true,
            amount: true,
            sale: { select: { cashSessionId: true } },
        },
    });
    const bySession = new Map(sessionIds.map((id) => [id, []]));
    for (const payment of payments) {
        const sessionId = payment.sale.cashSessionId;
        if (sessionId !== null) bySession.get(sessionId)?.push(payment);
    }
    return bySession;
};

const serializeSession = (session, payments = []) => {
    const expected = expectedTotals(session, payments);
    const counted = {
        CASH: session.closingAmount,
        CARD: session.closingCardAmount,
        DIGITAL: session.closingDigitalAmount,
        BITCOIN: session.closingBitcoinAmount,
        CHIVO_WALLET: session.closingChivoWalletAmount,
    };

    return {
        id: session.id,
        status: session.status,
        openedAt: session.openedAt,
        closedAt: session.closedAt,
        openingAmount: session.openingAmount.toFixed(2),
        employee: session.employee,
        branch: session.branch,
        reconciliation: Object.fromEntries(methods.map((method) => {
            const amount = counted[method];
            return [method, {
                expected: expected[method].toFixed(2),
                counted: amount === null ? null : amount.toFixed(2),
                difference: amount === null ? null : amount.minus(expected[method]).toFixed(2),
            }];
        })),
    };
};

// GET /api/cash/current
export const getCurrentSession = async (req, res, next) => {
    try {
        const session = await prisma.cashSession.findFirst({
            where: {
                employeeId: req.employee.id,
                branchId: req.employee.branchId,
                status: 'OPEN',
            },
            include: sessionRelations,
        });
        if (!session) return res.json({ session: null });

        const payments = await getPayments(prisma, [session.id]);
        return res.json({ session: serializeSession(session, payments.get(session.id)) });
    } catch (error) {
        next(error);
    }
};

// GET /api/cash/sessions
export const getSessions = async (req, res, next) => {
    try {
        const sessions = await prisma.cashSession.findMany({
            where: { employeeId: req.employee.id, branchId: req.employee.branchId },
            include: sessionRelations,
            orderBy: [{ openedAt: 'desc' }, { id: 'desc' }],
            take: 20,
        });
        const payments = await getPayments(prisma, sessions.map((session) => session.id));
        return res.json({
            sessions: sessions.map((session) => serializeSession(session, payments.get(session.id))),
        });
    } catch (error) {
        next(error);
    }
};

// POST /api/cash/sessions { openingAmount }
export const openSession = async (req, res, next) => {
    const parsed = openCashSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed);

    try {
        const result = await prisma.$transaction(async (tx) => {
            // Serializa aperturas concurrentes del mismo empleado.
            await tx.$queryRaw`SELECT id FROM "Employee" WHERE id = ${req.employee.id} FOR UPDATE`;
            const active = await tx.cashSession.findFirst({
                where: { employeeId: req.employee.id, branchId: req.employee.branchId, status: 'OPEN' },
                select: { id: true },
            });
            if (active) return { status: 409, message: 'Ya tienes un turno de caja abierto' };

            const session = await tx.cashSession.create({
                data: {
                    employeeId: req.employee.id,
                    branchId: req.employee.branchId,
                    openingAmount: new Prisma.Decimal(parsed.data.openingAmount),
                },
                include: sessionRelations,
            });
            return { status: 201, session };
        });

        if (result.message) return res.status(result.status).json({ message: result.message });
        return res.status(result.status).json({
            message: 'Turno de caja abierto correctamente',
            session: serializeSession(result.session),
        });
    } catch (error) {
        next(error);
    }
};

// POST /api/cash/sessions/:id/close
export const closeSession = async (req, res, next) => {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id <= 0) return res.status(400).json({ message: 'Turno inválido' });

    const parsed = closeCashSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed);

    try {
        const result = await prisma.$transaction(async (tx) => {
            // Bloquea el turno mientras se calculan pagos y se registra el cierre.
            await tx.$queryRaw`SELECT id FROM "CashSession" WHERE id = ${id} FOR UPDATE`;
            const session = await tx.cashSession.findFirst({
                where: { id, employeeId: req.employee.id, branchId: req.employee.branchId },
            });
            if (!session) return { status: 404, message: 'Turno de caja no encontrado' };
            if (session.status !== 'OPEN') return { status: 409, message: 'Este turno ya está cerrado' };

            const paymentsBySession = await getPayments(tx, [id]);
            const payments = paymentsBySession.get(id) ?? [];
            const updatedCount = await tx.cashSession.updateMany({
                where: { id, employeeId: req.employee.id, branchId: req.employee.branchId, status: 'OPEN' },
                data: {
                    closingAmount: new Prisma.Decimal(parsed.data.cash),
                    closingCardAmount: new Prisma.Decimal(parsed.data.card),
                    closingDigitalAmount: new Prisma.Decimal(parsed.data.digital),
                    closingBitcoinAmount: new Prisma.Decimal(parsed.data.bitcoin),
                    closingChivoWalletAmount: new Prisma.Decimal(parsed.data.chivoWallet),
                    closedAt: new Date(),
                    status: 'CLOSED',
                },
            });
            if (updatedCount.count !== 1) return { status: 409, message: 'El turno cambió. Actualiza la caja e inténtalo de nuevo' };

            const closed = await tx.cashSession.findUnique({ where: { id }, include: sessionRelations });
            return { status: 200, session: serializeSession(closed, payments) };
        });

        if (result.message) return res.status(result.status).json({ message: result.message });
        return res.status(result.status).json({
            message: 'Turno cerrado y cuadre guardado correctamente',
            session: result.session,
        });
    } catch (error) {
        next(error);
    }
};
