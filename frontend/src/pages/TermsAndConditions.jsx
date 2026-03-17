import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, FileText, Truck, CreditCard, RefreshCcw, Lock, Scale, Mail, ChevronRight } from 'lucide-react';

const sectionVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: i * 0.06 },
  }),
};

const LAST_UPDATED = '16 de marzo de 2026';

const sections = [
  {
    icon: FileText,
    title: '1. Información del Proveedor',
    content: (
      <>
        <p>De conformidad con el artículo 76 Bis de la <strong className="text-white">Ley Federal de Protección al Consumidor (LFPC)</strong> y la <strong className="text-white">NOM-151-SCFI-2002</strong>, se proporciona la siguiente información:</p>
        <ul className="list-disc list-inside space-y-1 mt-3 text-text-secondary">
          <li><strong className="text-white">Nombre comercial:</strong> Prop's Room</li>
          <li><strong className="text-white">Domicilio:</strong> Ciudad de México, México</li>
          <li><strong className="text-white">Contacto:</strong> contacto@propsroom.com</li>
        </ul>
        <p className="mt-3">Al acceder y utilizar el sitio web <strong className="text-white">propsroom.com</strong> (en adelante "el Sitio"), usted acepta cumplir y estar sujeto a los presentes Términos y Condiciones.</p>
      </>
    ),
  },
  {
    icon: ShieldCheck,
    title: '2. Condiciones Generales de Uso',
    content: (
      <>
        <p>El uso de este Sitio implica la aceptación plena de los presentes Términos y Condiciones. El Usuario declara ser mayor de 18 años o contar con la autorización de su padre, madre o tutor para realizar compras.</p>
        <p className="mt-3">Prop's Room se reserva el derecho de modificar estos Términos en cualquier momento, notificando los cambios a través del Sitio. La versión vigente será siempre la publicada en esta página.</p>
      </>
    ),
  },
  {
    icon: CreditCard,
    title: '3. Precios, Pagos e Impuestos',
    content: (
      <>
        <p>De acuerdo con el artículo 7 de la LFPC, todos los precios publicados en el Sitio están expresados en <strong className="text-white">Pesos Mexicanos (MXN)</strong> e incluyen el <strong className="text-white">Impuesto al Valor Agregado (IVA) del 16%</strong>, salvo que se indique lo contrario.</p>
        <ul className="list-disc list-inside space-y-1 mt-3 text-text-secondary">
          <li>Aceptamos pagos con tarjeta de crédito y débito a través de <strong className="text-white">Stripe</strong>, una plataforma de pagos certificada con estándar PCI-DSS.</li>
          <li>Prop's Room se reserva el derecho de cancelar pedidos cuando existan indicios de actividad fraudulenta.</li>
          <li>El precio vigente al momento de la compra es el que se aplicará al pedido, aún si el precio cambia posteriormente.</li>
        </ul>
      </>
    ),
  },
  {
    icon: Truck,
    title: '4. Envíos y Entrega',
    content: (
      <>
        <p>Las entregas se realizan en todo el territorio de los <strong className="text-white">Estados Unidos Mexicanos</strong> a través de paqueterías autorizadas (Estafeta, DHL, UPS, entre otras).</p>
        <ul className="list-disc list-inside space-y-1 mt-3 text-text-secondary">
          <li>Los tiempos de entrega estimados se muestran al momento de seleccionar el método de envío y son aproximados.</li>
          <li>Prop's Room no se hace responsable por retrasos causados por la paquetería, condiciones climáticas o causas de fuerza mayor.</li>
          <li>El comprador es responsable de proporcionar una dirección de entrega completa y correcta.</li>
          <li>Se proporcionará un número de guía de rastreo una vez que el pedido sea despachado.</li>
        </ul>
      </>
    ),
  },
  {
    icon: RefreshCcw,
    title: '5. Devoluciones, Cambios y Derecho de Desistimiento',
    content: (
      <>
        <p>De acuerdo con el artículo 56 de la LFPC, el consumidor tiene derecho a <strong className="text-white">devolver el producto dentro de los 5 días hábiles</strong> posteriores a su recepción sin necesidad de justificación, siempre que:</p>
        <ul className="list-disc list-inside space-y-1 mt-3 text-text-secondary">
          <li>El producto se encuentre en su empaque original, sin uso y con todas sus etiquetas.</li>
          <li>Se presente el comprobante de compra o número de pedido.</li>
          <li>El producto no sea de la categoría de artículos personalizados o en oferta especial no reembolsable (lo cual se indicará claramente al momento de la compra).</li>
        </ul>
        <p className="mt-3">Para solicitar una devolución o cambio, el consumidor deberá contactar a <strong className="text-white">contacto@propsroom.com</strong> dentro del plazo mencionado. El reembolso se realizará por el mismo medio de pago utilizado en un plazo no mayor a <strong className="text-white">15 días hábiles</strong> después de recibir el producto devuelto.</p>
      </>
    ),
  },
  {
    icon: Lock,
    title: '6. Privacidad y Protección de Datos Personales',
    content: (
      <>
        <p>Prop's Room cumple con la <strong className="text-white">Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP)</strong> y su Reglamento. Los datos personales recabados serán utilizados exclusivamente para:</p>
        <ul className="list-disc list-inside space-y-1 mt-3 text-text-secondary">
          <li>Procesar y enviar pedidos.</li>
          <li>Enviar comunicaciones relacionadas con su compra.</li>
          <li>Mejorar la experiencia de usuario en el Sitio.</li>
          <li>Cumplir con obligaciones legales.</li>
        </ul>
        <p className="mt-3">Prop's Room <strong className="text-white">no venderá, alquilará ni compartirá</strong> sus datos personales con terceros no relacionados con la prestación del servicio. El usuario puede ejercer sus derechos <strong className="text-white">ARCO</strong> (Acceso, Rectificación, Cancelación y Oposición) enviando una solicitud a <strong className="text-white">contacto@propsroom.com</strong>.</p>
        <p className="mt-3">La información de pago es procesada directamente por Stripe y <strong className="text-white">Prop's Room no almacena datos de tarjetas</strong> de crédito o débito en sus servidores.</p>
      </>
    ),
  },
  {
    icon: Scale,
    title: '7. Propiedad Intelectual',
    content: (
      <>
        <p>Todo el contenido del Sitio, incluyendo pero no limitado a: logotipos, diseños, fotografías, textos, gráficos, iconos, nombres comerciales y código fuente, son propiedad exclusiva de <strong className="text-white">Prop's Room</strong> y están protegidos por la <strong className="text-white">Ley Federal del Derecho de Autor</strong> y la <strong className="text-white">Ley de la Propiedad Industrial</strong>.</p>
        <p className="mt-3">Queda estrictamente prohibida la reproducción, distribución, modificación o uso no autorizado de cualquier elemento del Sitio sin el consentimiento escrito de Prop's Room.</p>
      </>
    ),
  },
  {
    icon: FileText,
    title: '8. Disponibilidad de Productos',
    content: (
      <>
        <p>La disponibilidad de los productos está sujeta a existencias. Prop's Room se reserva el derecho de:</p>
        <ul className="list-disc list-inside space-y-1 mt-3 text-text-secondary">
          <li>Limitar la cantidad de unidades por pedido.</li>
          <li>Cancelar pedidos de productos agotados, notificando al consumidor y procesando el reembolso correspondiente.</li>
          <li>Modificar o descontinuar productos sin previo aviso.</li>
        </ul>
        <p className="mt-3">Si un producto se agota después de haberse confirmado la compra, Prop's Room notificará al cliente y ofrecerá un reembolso completo o la opción de seleccionar un producto alternativo.</p>
      </>
    ),
  },
  {
    icon: ShieldCheck,
    title: '9. Garantías',
    content: (
      <>
        <p>De conformidad con la LFPC, Prop's Room garantiza que los productos ofrecidos corresponden a la descripción, imágenes y especificaciones publicadas en el Sitio. En caso de que el producto recibido presente defectos de fabricación o no corresponda con lo adquirido, el consumidor podrá:</p>
        <ul className="list-disc list-inside space-y-1 mt-3 text-text-secondary">
          <li>Solicitar la <strong className="text-white">reposición del producto</strong> sin costo adicional.</li>
          <li>Solicitar el <strong className="text-white">reembolso total</strong> del precio pagado.</li>
          <li>Solicitar una <strong className="text-white">bonificación</strong> equivalente.</li>
        </ul>
      </>
    ),
  },
  {
    icon: Scale,
    title: '10. Legislación Aplicable y Jurisdicción',
    content: (
      <>
        <p>Los presentes Términos y Condiciones se rigen por las leyes vigentes en los <strong className="text-white">Estados Unidos Mexicanos</strong>, particularmente:</p>
        <ul className="list-disc list-inside space-y-1 mt-3 text-text-secondary">
          <li>Ley Federal de Protección al Consumidor (LFPC).</li>
          <li>Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP).</li>
          <li>Código de Comercio.</li>
          <li>NOM-151-SCFI-2002 (Prácticas comerciales – requisitos para comercio electrónico).</li>
        </ul>
        <p className="mt-3">Para cualquier controversia derivada de estos Términos, las partes se someten a la jurisdicción de los tribunales competentes de la <strong className="text-white">Ciudad de México</strong>, así como a los mecanismos de solución de controversias de la <strong className="text-white">Procuraduría Federal del Consumidor (PROFECO)</strong>.</p>
      </>
    ),
  },
  {
    icon: Mail,
    title: '11. Contacto y Atención al Cliente',
    content: (
      <>
        <p>Para cualquier duda, aclaración, queja o sugerencia, el consumidor puede comunicarse con Prop's Room a través de:</p>
        <ul className="list-disc list-inside space-y-1 mt-3 text-text-secondary">
          <li><strong className="text-white">Correo electrónico:</strong> contacto@propsroom.com</li>
          <li><strong className="text-white">Redes sociales:</strong> @propsroom3d (Instagram, Facebook, TikTok)</li>
        </ul>
        <p className="mt-3">Nos comprometemos a responder a todas las solicitudes en un plazo no mayor a <strong className="text-white">3 días hábiles</strong>.</p>
      </>
    ),
  },
];

const TermsAndConditions = () => {
  return (
    <div className="w-full flex-1">
      <section className="relative py-16 lg:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/30">
              <Scale className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-display tracking-wide text-white mb-4">
              TÉRMINOS Y <span className="text-primary">CONDICIONES</span>
            </h1>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto leading-relaxed">
              Información legal conforme a la Ley Federal de Protección al Consumidor y normatividad mexicana vigente.
            </p>
            <p className="text-text-muted text-sm mt-4">Última actualización: {LAST_UPDATED}</p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="flex items-center gap-2 text-sm">
          <Link to="/" className="text-primary font-medium hover:text-white transition-colors">Inicio</Link>
          <ChevronRight className="w-3.5 h-3.5 text-text-muted" />
          <span className="text-white font-medium">Términos y Condiciones</span>
        </div>
      </div>

      <section className="relative pb-16 lg:pb-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6">
            {sections.map((section, i) => (
              <motion.article
                key={i}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.15 }}
                variants={sectionVariants}
                className="relative bg-surface border border-white/5 rounded-2xl p-6 md:p-8 hover:border-primary/30 transition-all duration-200 group overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

                <div className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center shrink-0">
                      <section.icon className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-lg md:text-xl font-bold text-white">{section.title}</h2>
                  </div>
                  <div className="text-text-secondary text-sm md:text-[15px] leading-relaxed pl-[52px]">
                    {section.content}
                  </div>
                </div>
              </motion.article>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mt-12 bg-surface-elevated/50 border border-primary/20 rounded-2xl p-6 md:p-8 text-center"
          >
            <ShieldCheck className="w-8 h-8 text-primary mx-auto mb-3" />
            <h3 className="text-white font-bold text-lg mb-2">Compra Protegida</h3>
            <p className="text-text-secondary text-sm max-w-2xl mx-auto leading-relaxed">
              Como consumidor, tienes derecho a presentar quejas o reclamaciones ante la{' '}
              <strong className="text-white">Procuraduría Federal del Consumidor (PROFECO)</strong>. Para más información visita{' '}
              <a
                href="https://www.gob.mx/profeco"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-white underline underline-offset-2 transition-colors"
              >
                www.gob.mx/profeco
              </a>{' '}
              o llama al teléfono del consumidor <strong className="text-white">55 5568 8722</strong>.
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default TermsAndConditions;
