import * as cartService from './cartService.js';
import logger from '../../config/logger.js';

const resolveUserExternalId = (req) =>
  req.user?.externalId ||
  req.user?.externalid ||
  req.user?.userExternalId ||
  req.body?.userExternalId ||
  req.query?.userExternalId;

export const addItemToCart = async (req, res, next) => {
  try {
    const { itemId, quantity, restaurantPublicId, options = [], note = null } = req.body;
    const userExternalId = resolveUserExternalId(req);

    if (!userExternalId || !itemId || !quantity || !restaurantPublicId) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: userExternalId, itemId, quantity, restaurantPublicId',
        code: 'MISSING_FIELDS'
      });
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid quantity. Must be a positive integer',
        code: 'INVALID_QUANTITY'
      });
    }

    const result = await cartService.addItemToCart(
      userExternalId,
      restaurantPublicId,
      itemId,
      quantity,
      options,
      note
    );

    res.status(200).json({
      status: 'success',
      message: 'Item added to cart',
      cart: result
    });

  } catch (error) {
    logger.error(`Error adding item to cart: ${error.message}`);
    next(error);
  }
};

export const getCart = async (req, res, next) => {
  try {
    const userExternalId = resolveUserExternalId(req);

    if (!userExternalId) {
      return res.status(401).json({
        status: 'error',
        message: 'Missing authentication context',
        code: 'UNAUTHORIZED'
      });
    }

    const cart = await cartService.getCart(userExternalId);

    res.status(200).json({
      status: 'success',
      data: cart
    });

  } catch (error) {
    logger.error(`Error getting cart: ${error.message}`);
    next(error);
  }
};

export const updateItemQuantity = async (req, res, next) => {
  try {
    const { itemId, quantity, restaurantPublicId, options = [], note = null } = req.body;
    const userExternalId = resolveUserExternalId(req);

    if (!userExternalId || !itemId || quantity === undefined || !restaurantPublicId) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: userExternalId, itemId, quantity, restaurantPublicId',
        code: 'MISSING_FIELDS'
      });
    }

    if (!Number.isInteger(quantity) || quantity < 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid quantity. Must be a non-negative integer',
        code: 'INVALID_QUANTITY'
      });
    }

    const result = await cartService.updateItemQuantity(
      userExternalId,
      restaurantPublicId,
      itemId,
      quantity,
      options,
      note
    );

    res.status(200).json({
      status: 'success',
      message: 'Cart updated',
      cart: result
    });

  } catch (error) {
    logger.error(`Error updating cart: ${error.message}`);
    next(error);
  }
};

export const removeItemFromCart = async (req, res, next) => {
  try {
    const { itemId, restaurantPublicId, options = [], itemKey = null } = req.body;
    const userExternalId = resolveUserExternalId(req);

    if (!userExternalId || !itemId || !restaurantPublicId) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: userExternalId, itemId, restaurantPublicId',
        code: 'MISSING_FIELDS'
      });
    }

    const result = await cartService.removeItemFromCart(
      userExternalId,
      restaurantPublicId,
      itemId,
      options,
      itemKey
    );

    res.status(200).json({
      status: 'success',
      message: 'Item removed from cart',
      cart: result
    });

  } catch (error) {
    logger.error(`Error removing item from cart: ${error.message}`);
    next(error);
  }
};

export const clearCart = async (req, res, next) => {
  try {
    const userExternalId = resolveUserExternalId(req);

    if (!userExternalId) {
      return res.status(401).json({
        status: 'error',
        message: 'Missing authentication context',
        code: 'UNAUTHORIZED'
      });
    }

    await cartService.clearCart(userExternalId);

    res.status(200).json({
      status: 'success',
      message: 'Cart cleared'
    });

  } catch (error) {
    logger.error(`Error clearing cart: ${error.message}`);
    next(error);
  }
};

export const getCartByRestaurant = async (req, res, next) => {
  try {
    const { restaurantPublicId } = req.params;
    const userExternalId = resolveUserExternalId(req);

    if (!userExternalId || !restaurantPublicId) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required parameters: userExternalId, restaurantPublicId',
        code: 'MISSING_FIELDS'
      });
    }

    const cart = await cartService.getCartByRestaurant(userExternalId, restaurantPublicId);

    res.status(200).json({
      status: 'success',
      data: cart
    });
  } catch (error) {
    logger.error(`Error getting cart by restaurant: ${error.message}`);
    next(error);
  }
};
