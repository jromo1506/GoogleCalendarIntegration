// Esta es tu clave secreta de API de Stripe.
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); 

exports.checkout = async (req, res) => {
    const { pacienteId } = req.body; 
    try {
        // Buscar el paciente por su ID
        const paciente = await Paciente.findById(pacienteId);
        if (!paciente) {
            return res.status(404).send({ message: 'Paciente no encontrado' });
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card', 'oxxo'],  // Métodos de pago disponibles
            line_items: [
                {
                    price_data: {
                        currency: 'mxn',
                        product_data: {
                            name: `Pago de consulta de ${paciente.nombre}`,  // Usando el nombre del paciente
                        },
                        unit_amount: 50000,  // Monto en centavos 
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${process.env.DOMAIN}/pago-exitoso?session_id={CHECKOUT_SESSION_ID}&pacienteId=${pacienteId}`,
            cancel_url: `${process.env.DOMAIN}/pago-cancelado?pacienteId=${pacienteId}`,
            expires_at: Math.floor(new Date().setHours(22, 0, 0, 0) / 1000),  // Expira a las 10 PM del mismo día
            metadata: {
                pacienteId: paciente._id.toString(),
                telefonoWhatsapp: paciente.telefonoWhatsapp.toString(),
            },
        });

        // Enviar la URL de la sesión al cliente
        res.send({ sessionUrl: session.url });
    } catch (error) {
        console.error('Error al realizar el pago con Stripe', error);
        res.status(500).send({ message: 'Error al realizar el pago', error: error.message });
    }
};

exports.status = async (req, res) => {
    try {
        const session = await stripe.checkout.sessions.retrieve(req.query.session_id);

        res.send({
            status: session.status,
            customer_email: session.customer_details.email,
        });
    } catch (error) {
        console.error('Error al verificar el estado del pago', error);
        res.status(500).send({ message: 'Error al obtener el estado del pago', error: error.message });
    }
};
