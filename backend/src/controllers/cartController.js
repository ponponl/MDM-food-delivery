import * as cartService from '../services/cartService.js';
import logger from '../config/logger.js';

export const addItemToCart = async (req, res, next) => {
  try {
    const { userExternalId, itemId, quantity } = req.body;

    if (!userExternalId || !itemId || !quantity) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: userExternalId, itemId, quantity',
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

    const result = await cartService.addItemToCart(userExternalId, itemId, quantity);

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
    const { userExternalId } = req.query;

    if (!userExternalId) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required parameter: userExternalId',
        code: 'MISSING_PARAMETER'
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
    const { userExternalId, itemId, quantity } = req.body;

    if (!userExternalId || !itemId || quantity === undefined) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: userExternalId, itemId, quantity',
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

    const result = await cartService.updateItemQuantity(userExternalId, itemId, quantity);

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
    const { userExternalId, itemId } = req.body;

    if (!userExternalId || !itemId) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: userExternalId, itemId',
        code: 'MISSING_FIELDS'
      });
    }

    await cartService.removeItemFromCart(userExternalId, itemId);

    res.status(200).json({
      status: 'success',
      message: 'Item removed from cart'
    });

  } catch (error) {
    logger.error(`Error removing item from cart: ${error.message}`);
    next(error);
  }
};

export const clearCart = async (req, res, next) => {
  try {
    const { userExternalId } = req.query;

    if (!userExternalId) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required parameter: userExternalId',
        code: 'MISSING_PARAMETER'
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
