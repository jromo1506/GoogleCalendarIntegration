// This is your test secret API key.
const stripe = require('stripe')(process.env.STRIPE_ID);

exports.checkout = async (req, res) => {
    const { nombreServicio, precioCobrar } = req.body;
    try {
        const session = await stripe.checkout.sessions.create({
            ui_mode: 'embedded',
            line_items: [
              {
                price_data : {
                    currency: 'mxn',
                    product_data: {
                        name: nombreServicio,
                    },
                    unit_amount: precioCobrar * 100,
                },
                quantity: 1,
              },
            ],
            mode: 'payment',
            return_url: `${process.env.DOMAIN}/return?session_id={CHECKOUT_SESSION_ID}`,
          });
        
        res.send({clientSecret: session.client_secret});
    } catch (error) {
        console.error('Error al realizar pago stripe', error);
        throw error;
      }
  
};

exports.status = async (req, res) => {
  const session = await stripe.checkout.sessions.retrieve(req.query.session_id);

  res.send({
    status: session.status,
    customer_email: session.customer_details.email
  });
};
