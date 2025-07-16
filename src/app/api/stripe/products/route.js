import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Function to get Stripe instance
const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
  });
};

// Create a new product
export async function POST(request) {
  try {
    const { 
      name, 
      description, 
      images = [], 
      metadata = {},
      prices = [] 
    } = await request.json();

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Product name is required' },
        { status: 400 }
      );
    }

    // Create product
    const stripe = getStripe();
    const product = await stripe.products.create({
      name,
      description,
      images,
      metadata: {
        ...metadata,
        created_at: new Date().toISOString(),
      },
    });

    // Create prices if provided
    const createdPrices = [];
    for (const priceData of prices) {
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: priceData.unit_amount,
        currency: priceData.currency || 'usd',
        recurring: priceData.recurring || null,
        metadata: priceData.metadata || {},
      });
      createdPrices.push(price);
    }

    return NextResponse.json({
      success: true,
      product: {
        id: product.id,
        name: product.name,
        description: product.description,
        images: product.images,
        metadata: product.metadata,
        created: product.created,
        prices: createdPrices,
      }
    });

  } catch (error) {
    console.error('Error creating product:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to create product',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// Get products
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('product_id');
    const active = searchParams.get('active');
    const limit = searchParams.get('limit') || 10;

    const stripe = getStripe();
    
    if (productId) {
      // Get specific product
      const product = await stripe.products.retrieve(productId);
      
      // Get prices for this product
      const prices = await stripe.prices.list({
        product: productId,
        active: true,
      });

      return NextResponse.json({
        success: true,
        product: {
          id: product.id,
          name: product.name,
          description: product.description,
          images: product.images,
          metadata: product.metadata,
          active: product.active,
          created: product.created,
          prices: prices.data,
        }
      });
    } else {
      // Get all products
      const listParams = {
        limit: parseInt(limit),
        expand: ['data.default_price'],
      };

      if (active !== null) {
        listParams.active = active === 'true';
      }

      const products = await stripe.products.list(listParams);

      // Get prices for each product
      const productsWithPrices = await Promise.all(
        products.data.map(async (product) => {
          const prices = await stripe.prices.list({
            product: product.id,
            active: true,
          });
          
          return {
            id: product.id,
            name: product.name,
            description: product.description,
            images: product.images,
            metadata: product.metadata,
            active: product.active,
            created: product.created,
            prices: prices.data,
          };
        })
      );

      return NextResponse.json({
        success: true,
        products: productsWithPrices,
        has_more: products.has_more,
      });
    }

  } catch (error) {
    console.error('Error retrieving products:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to retrieve products',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// Update product
export async function PUT(request) {
  try {
    const { 
      productId, 
      name, 
      description, 
      images, 
      metadata = {},
      active 
    } = await request.json();

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const updateData = {
      metadata: {
        ...metadata,
        updated_at: new Date().toISOString(),
      },
    };

    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (images) updateData.images = images;
    if (active !== undefined) updateData.active = active;

    const stripe = getStripe();
    const product = await stripe.products.update(productId, updateData);

    return NextResponse.json({
      success: true,
      product: {
        id: product.id,
        name: product.name,
        description: product.description,
        images: product.images,
        metadata: product.metadata,
        active: product.active,
        created: product.created,
      }
    });

  } catch (error) {
    console.error('Error updating product:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to update product',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// Delete product
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('product_id');

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const stripe = getStripe();
    const deletedProduct = await stripe.products.del(productId);

    return NextResponse.json({
      success: true,
      deleted: deletedProduct.deleted,
      productId: deletedProduct.id,
    });

  } catch (error) {
    console.error('Error deleting product:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to delete product',
        details: error.message 
      },
      { status: 500 }
    );
  }
}