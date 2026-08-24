const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function createSession(data, user) {
  const {
    sessionNumber,
    storeId,
    countDate,
    notes,
    lines
  } = data;

  const createdById = user.id;

  const stockTakingLines = lines.map((line) => ({
    itemId: line.itemId,
    systemQuantity: line.systemQuantity,
    physicalQuantity: line.physicalQuantity,
    variance: line.physicalQuantity - line.systemQuantity,
    notes: line.notes
  }));

  return prisma.stockTakingSession.create({
    data: {
      sessionNumber,
      storeId,
      countDate: new Date(countDate),
      notes,
      createdById,
      lines: {
        create: stockTakingLines
      }
    },
    include: {
      lines: true
    }
  });
}

async function getSessions() {
  return prisma.stockTakingSession.findMany({
    include: {
      lines: true
    },
    orderBy: {
      createdAt: "desc"
    }
  });
}

async function getSessionById(id) {
  const session = await prisma.stockTakingSession.findUnique({
    where: {
      id
    },
    include: {
      lines: true
    }
  });

  if (!session) {
    const error = new Error("Stock-taking session not found");
    error.statusCode = 404;
    throw error;
  }

  return session;
}

async function submitSession(id, user) {
  const session = await getSessionById(id);

  if (session.createdById !== user.id && user.role !== "ADMIN") {
    const error = new Error("Permission denied");
    error.statusCode = 403;
    throw error;
  }

  if (session.status !== "OPEN") {
    const error = new Error(
      "Only an OPEN session can be submitted"
    );
    error.statusCode = 400;
    throw error;
  }

  return prisma.stockTakingSession.update({
    where: {
      id
    },
    data: {
      status: "SUBMITTED"
    },
    include: {
      lines: true
    }
  });
}

async function reconcileSession(id, user) {
  const session = await getSessionById(id);

  if (user.role !== "ADMIN" && user.role !== "STOCK_MANAGER") {
    const error = new Error("Permission denied");
    error.statusCode = 403;
    throw error;
  }

  if (session.status !== "SUBMITTED") {
    const error = new Error(
      "Only a SUBMITTED session can be reconciled"
    );
    error.statusCode = 400;
    throw error;
  }

  return prisma.stockTakingSession.update({
    where: {
      id
    },
    data: {
      status: "RECONCILED"
    },
    include: {
      lines: true
    }
  });
}

module.exports = {
  createSession,
  getSessions,
  getSessionById,
  submitSession,
  reconcileSession
};