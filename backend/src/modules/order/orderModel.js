export const mapOrderDetailRow = (row) => {
    if (!row) return null;

    return {
        orderExternalId: row.externalid,
        restaurantId: row.restaurantid,
        status: row.status,
        totalPrice: parseFloat(row.totalprice),
        totalItems: row.total_items ?? null,
        deliveryAddress: row.deliveryaddress,
        items: row.items,
        payment: {
            method: row.paymentmethod,
            status: row.paymentstatus,
            paidAt: row.paymentpaidat
        },
        user: {
            externalId: row.userexternalid,
            name: row.username,
            phone: row.userphone
        },
        createdAt: row.created_at
    };
};

export const mapOrderSummaryRow = (row) => ({
    orderExternalId: row.externalid,
    restaurantId: row.restaurantid,
    status: row.status,
    totalPrice: parseFloat(row.totalprice),
    totalItems: row.total_items ?? null,
    createdAt: row.created_at
});

export const buildOrdersPagination = (rows, limit, offset) => {
    const totalCount = rows.length > 0 ? parseInt(rows[0].total_count) : 0;

    return {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
    };
};
