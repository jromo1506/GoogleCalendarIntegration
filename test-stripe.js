require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function testPaymentLink() {
  try {
    console.log('⚙️ Iniciando test de Stripe Payment Link...');

    // Configurar hora de expiración (10 PM hoy)
    const now = new Date();
    const expireAt = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      13,  // 10 PM
      31,   // 0 minutos
      0    // 0 segundos
    );

    // 1. Crear producto
    const producto = await stripe.products.create({
      name: 'Consulta de prueba',
    });
    console.log('✅ Producto creado:', producto.id);

    // 2. Crear precio
    const precio = await stripe.prices.create({
      unit_amount: 5000, // $50.00 USD
      currency: 'usd',
      product: producto.id,
    });
    console.log('✅ Precio creado:', precio.id);

    // 3. Crear Payment Link
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [{
        price: precio.id,
        quantity: 1,
      }],
      after_completion: {
        type: 'redirect',
        redirect: {
          url: 'https://example.com/success',
        },
      },
      customer_creation: 'always'
    });
    
    const paymentLinkUrl = paymentLink.url;
    console.log('\n✅ Payment Link creado:');
    console.log(paymentLinkUrl);
    console.log('\n⚠️ Este link NO tiene expiración automática en Stripe');
    console.log('⏳ Para expirar manualmente hoy a las 22:00, debes desactivarlo luego');
    console.log('\n🔍 Abre este enlace en tu navegador y completa el pago...');
    console.log('⏳ Monitoreando el pago... (Ctrl+C para cancelar)');

    // 4. Monitorear el pago
    let paymentCompleted = false;
    let linkShown = false;
    let attempts = 0;
    const maxAttempts = 6; // 1 minuto (6 intentos x 10 segundos)
    
    while (!paymentCompleted && attempts < maxAttempts) {
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 10000)); // Espera 10 segundos

      try {
        // Buscar sesiones de checkout recientes
        const sessions = await stripe.checkout.sessions.list({
          limit: 1,
          created: { gt: Math.floor(Date.now() / 1000) - 600 } // últimos 10 minutos
        });

        if (sessions.data.length > 0) {
          const session = sessions.data[0];
          
          if (session.payment_status === 'paid') {
            paymentCompleted = true;
            
            console.log('\n🎉 Pago detectado!');
            console.log('📋 Detalles del pago:');
            console.log('- ID de sesión:', session.id);
            
            // Mostrar el link SOLO si no se ha mostrado antes
            if (!linkShown) {
              console.log('- Link de pago utilizado:', paymentLinkUrl);
              linkShown = true;
            }
            
            console.log('- Estado del pago:', session.payment_status);
            console.log('- Monto:', `$${(session.amount_total / 100).toFixed(2)} ${session.currency}`);
            
            // Obtener email del cliente
            let customerEmail = session.customer_email;
            const customerId = session.customer;
            
            if (!customerEmail && customerId) {
              const customer = await stripe.customers.retrieve(customerId);
              customerEmail = customer.email;
            }
            
            if (customerEmail) {
              console.log('📧 Email del cliente:', customerEmail);
            } else {
              console.log('⚠️ No se pudo obtener el email del cliente');
            }
            
            // Obtener más detalles del pago
            if (session.payment_intent) {
              const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);
              console.log('💳 Método de pago:', paymentIntent.payment_method_types.join(', '));
              console.log('📅 Fecha de pago:', new Date(paymentIntent.created * 1000).toLocaleString());
            }

            if (session.url) {
              console.log('🔗 Link de Checkout Session:', session.url);
            }

            // Desactivar el payment link después de pago exitoso
            await stripe.paymentLinks.update(paymentLink.id, { active: false });
            console.log('🔒 Payment Link desactivado después de pago exitoso');
          } else {
            console.log(`⏳ Intentos: ${attempts}/${maxAttempts} - Esperando pago...`);
          }
        }
      } catch (error) {
        console.log('⚠️ Error al verificar pago:', error.message);
      }
    }

    if (!paymentCompleted) {
      console.log('\n⌛ Tiempo de espera agotado. No se detectó ningún pago.');
      // Mostrar el link SOLO si no se ha mostrado antes
      if (!linkShown) {
        console.log('🔗 Link de pago generado:', paymentLinkUrl);
        linkShown = true;
      }

      // Verificar si ya pasó la hora de expiración (10 PM)
      if (new Date() >= expireAt) {
        await stripe.paymentLinks.update(paymentLink.id, { active: false });
        console.log('🕙 Hora de expiración alcanzada (22:00). Payment Link desactivado.');
      } else {
        console.log(`⏳ El link seguirá activo hasta las 22:00 (${expireAt.toLocaleTimeString()})`);
      }
    }

    // 5. Archivar el producto
    await stripe.products.update(producto.id, { active: false });
    console.log('\n📦 Producto archivado correctamente.');

  } catch (error) {
    console.error('❌ Error en test de Stripe:', {
      message: error.message,
      type: error.type,
      code: error.code
    });
  } finally {
    process.exit();
  }
}

testPaymentLink();