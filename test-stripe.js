require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const readline = require('readline');

function esperarEnter(mensaje) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise(resolve => rl.question(mensaje, () => {
    rl.close();
    resolve();
  }));
}

async function testPaymentLink() {
  try {
    console.log('⚙️ Iniciando test de Stripe Payment Link...');

    // 1. Crear producto
    const producto = await stripe.products.create({
      name: 'Consulta de prueba',
    });
    console.log('✅ Producto creado:', producto.id);

    // 2. Crear precio
    const precio = await stripe.prices.create({
      unit_amount: 5000,
      currency: 'usd',
      product: producto.id,
    });
    console.log('✅ Precio creado:', precio.id);

    // 3. Crear Payment Link
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price: precio.id,
          quantity: 1,
        },
      ],
    });
    console.log('✅ Payment Link generado:', paymentLink.url);

    // 4. Esperar a que el usuario lo pague
    await esperarEnter('\n👉 Abre y paga el link, luego presiona ENTER aquí para continuar...');

    // 5. Archivar el producto (ya que no se puede eliminar)
    await stripe.products.update(producto.id, { active: false });
    console.log('📦 Producto archivado correctamente (no eliminado).');

    console.log('\n🎉 Test de Stripe completado exitosamente.');
  } catch (error) {
    console.error('❌ Error en test de Stripe:', {
      message: error.message,
      type: error.type,
      code: error.code
    });
  }
}

testPaymentLink();
