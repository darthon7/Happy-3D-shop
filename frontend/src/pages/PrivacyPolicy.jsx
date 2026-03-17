import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Eye, Database, UserCheck, Share2, Cookie, KeyRound, Bell, Mail, ChevronRight } from 'lucide-react';

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
    icon: Eye,
    title: '1. Identidad del Responsable',
    content: (
      <>
        <p>En cumplimiento con la <strong className="text-white">Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP)</strong> y su Reglamento, informamos que el responsable del tratamiento de sus datos personales es:</p>
        <ul className="list-disc list-inside space-y-1 mt-3 text-text-secondary">
          <li><strong className="text-white">Nombre comercial:</strong> Prop's Room</li>
          <li><strong className="text-white">Domicilio:</strong> Ciudad de México, México</li>
          <li><strong className="text-white">Correo electrónico:</strong> contacto@propsroom.com</li>
        </ul>
      </>
    ),
  },
  {
    icon: Database,
    title: '2. Datos Personales que Recabamos',
    content: (
      <>
        <p>Prop's Room recaba los siguientes datos personales, de manera directa, cuando usted los proporciona voluntariamente a través de nuestro Sitio:</p>
        <div className="mt-3 space-y-3">
          <div>
            <p className="text-white font-medium text-sm mb-1">Datos de identificación:</p>
            <ul className="list-disc list-inside space-y-1 text-text-secondary">
              <li>Nombre completo</li>
              <li>Correo electrónico</li>
              <li>Número de teléfono</li>
            </ul>
          </div>
          <div>
            <p className="text-white font-medium text-sm mb-1">Datos de envío:</p>
            <ul className="list-disc list-inside space-y-1 text-text-secondary">
              <li>Dirección postal (calle, colonia, ciudad, estado, código postal)</li>
            </ul>
          </div>
          <div>
            <p className="text-white font-medium text-sm mb-1">Datos de navegación (recopilados automáticamente):</p>
            <ul className="list-disc list-inside space-y-1 text-text-secondary">
              <li>Dirección IP</li>
              <li>Tipo de navegador y dispositivo</li>
              <li>Páginas visitadas y tiempo de permanencia</li>
              <li>Cookies y tecnologías similares</li>
            </ul>
          </div>
        </div>
        <p className="mt-3"><strong className="text-white">Prop's Room no recaba datos personales sensibles</strong> (origen étnico, estado de salud, orientación sexual, creencias religiosas, datos biométricos, etc.).</p>
        <p className="mt-2"><strong className="text-white">Datos financieros:</strong> La información de pago (números de tarjeta, CVV, fecha de expiración) es procesada directamente por <strong className="text-white">Stripe, Inc.</strong> y nunca es almacenada en los servidores de Prop's Room.</p>
      </>
    ),
  },
  {
    icon: Shield,
    title: '3. Finalidades del Tratamiento',
    content: (
      <>
        <p className="text-white font-medium text-sm mb-2">Finalidades primarias (necesarias):</p>
        <ul className="list-disc list-inside space-y-1 text-text-secondary">
          <li>Procesar y gestionar su compra y pedido.</li>
          <li>Enviar los productos adquiridos a la dirección proporcionada.</li>
          <li>Generar y enviar comprobantes de compra electrónicos.</li>
          <li>Gestionar devoluciones, cambios y reembolsos.</li>
          <li>Atender solicitudes de servicio al cliente.</li>
          <li>Crear y gestionar su cuenta de usuario.</li>
          <li>Dar cumplimiento a obligaciones legales y fiscales.</li>
        </ul>
        <p className="text-white font-medium text-sm mt-4 mb-2">Finalidades secundarias (no necesarias):</p>
        <ul className="list-disc list-inside space-y-1 text-text-secondary">
          <li>Enviar comunicaciones promocionales y de marketing sobre nuevos productos y colecciones.</li>
          <li>Realizar análisis estadísticos y de comportamiento de compra para mejorar nuestros servicios.</li>
          <li>Enviar encuestas de satisfacción.</li>
        </ul>
        <p className="mt-3">Si usted no desea que sus datos personales sean tratados para finalidades secundarias, puede manifestar su negativa enviando un correo a <strong className="text-white">contacto@propsroom.com</strong> con el asunto "Negativa finalidades secundarias".</p>
      </>
    ),
  },
  {
    icon: Share2,
    title: '4. Transferencias de Datos',
    content: (
      <>
        <p>Prop's Room podrá transferir sus datos personales a los siguientes terceros, sin requerir su consentimiento, de acuerdo con el artículo 37 de la LFPDPPP:</p>
        <ul className="list-disc list-inside space-y-1 mt-3 text-text-secondary">
          <li><strong className="text-white">Stripe, Inc.</strong> — Procesamiento de pagos con tarjeta.</li>
          <li><strong className="text-white">Empresas de paquetería</strong> (Estafeta, DHL, UPS u otros) — Entrega de productos adquiridos.</li>
          <li><strong className="text-white">Plataformas de alojamiento</strong> (servidores en la nube) — Almacenamiento seguro de información.</li>
          <li><strong className="text-white">Autoridades competentes</strong> — Cuando sea requerido por ley, orden judicial o procedimiento legal.</li>
        </ul>
        <p className="mt-3">Prop's Room <strong className="text-white">no vende, alquila ni comercializa</strong> datos personales a terceros con fines de marketing o publicidad.</p>
      </>
    ),
  },
  {
    icon: UserCheck,
    title: '5. Derechos ARCO',
    content: (
      <>
        <p>Usted tiene derecho a <strong className="text-white">Acceder, Rectificar, Cancelar u Oponerse</strong> al tratamiento de sus datos personales (derechos ARCO), conforme a los artículos 28 al 35 de la LFPDPPP.</p>
        <p className="mt-3">Para ejercer cualquiera de estos derechos, deberá enviar una solicitud al correo electrónico <strong className="text-white">contacto@propsroom.com</strong> que contenga:</p>
        <ul className="list-disc list-inside space-y-1 mt-3 text-text-secondary">
          <li>Nombre completo del titular.</li>
          <li>Descripción clara del derecho que desea ejercer.</li>
          <li>Copia de identificación oficial vigente.</li>
          <li>Correo electrónico o dirección para recibir la respuesta.</li>
        </ul>
        <p className="mt-3">Prop's Room responderá a su solicitud en un plazo máximo de <strong className="text-white">20 días hábiles</strong> contados a partir de la recepción de la solicitud completa. La resolución se hará efectiva dentro de los <strong className="text-white">15 días hábiles</strong> siguientes a la respuesta.</p>
      </>
    ),
  },
  {
    icon: KeyRound,
    title: '6. Revocación del Consentimiento',
    content: (
      <>
        <p>Usted puede revocar el consentimiento otorgado para el tratamiento de sus datos personales en cualquier momento, enviando una solicitud a <strong className="text-white">contacto@propsroom.com</strong> con el asunto "Revocación de consentimiento".</p>
        <p className="mt-3">Tenga en cuenta que la revocación del consentimiento para finalidades primarias podría impedir que completemos servicios activos (como pedidos en proceso de entrega).</p>
      </>
    ),
  },
  {
    icon: Cookie,
    title: '7. Uso de Cookies y Tecnologías de Rastreo',
    content: (
      <>
        <p>El Sitio utiliza <strong className="text-white">cookies</strong> y tecnologías similares para:</p>
        <ul className="list-disc list-inside space-y-1 mt-3 text-text-secondary">
          <li><strong className="text-white">Cookies esenciales:</strong> Necesarias para el funcionamiento del sitio (sesión de usuario, carrito de compras).</li>
          <li><strong className="text-white">Cookies de rendimiento:</strong> Permiten analizar el uso del Sitio para mejorar la experiencia.</li>
          <li><strong className="text-white">Cookies de funcionalidad:</strong> Recuerdan preferencias del usuario como idioma o región.</li>
        </ul>
        <p className="mt-3">Usted puede deshabilitar las cookies en la configuración de su navegador. Sin embargo, esto podría afectar la funcionalidad del Sitio.</p>
      </>
    ),
  },
  {
    icon: Shield,
    title: '8. Medidas de Seguridad',
    content: (
      <>
        <p>Prop's Room implementa medidas de seguridad administrativas, técnicas y físicas para proteger sus datos personales contra daño, pérdida, alteración, destrucción o uso, acceso o tratamiento no autorizado, incluyendo:</p>
        <ul className="list-disc list-inside space-y-1 mt-3 text-text-secondary">
          <li>Cifrado de datos en tránsito mediante protocolo <strong className="text-white">HTTPS/TLS</strong>.</li>
          <li>Procesamiento de pagos a través de <strong className="text-white">Stripe</strong> (certificado PCI-DSS Nivel 1).</li>
          <li>Almacenamiento seguro de contraseñas con algoritmos de hash.</li>
          <li>Control de acceso restringido a datos personales.</li>
          <li>Monitoreo continuo de actividad sospechosa.</li>
        </ul>
      </>
    ),
  },
  {
    icon: Bell,
    title: '9. Cambios al Aviso de Privacidad',
    content: (
      <>
        <p>Prop's Room se reserva el derecho de modificar el presente Aviso de Privacidad en cualquier momento. Las modificaciones se harán disponibles a través de:</p>
        <ul className="list-disc list-inside space-y-1 mt-3 text-text-secondary">
          <li>Publicación de la versión actualizada en esta misma página.</li>
          <li>Notificación por correo electrónico a los usuarios registrados cuando los cambios sean significativos.</li>
        </ul>
        <p className="mt-3">Le recomendamos revisar periódicamente esta página para estar informado sobre cómo protegemos su información.</p>
      </>
    ),
  },
  {
    icon: Mail,
    title: '10. Contacto para Datos Personales',
    content: (
      <>
        <p>Si tiene dudas sobre el tratamiento de sus datos personales o desea ejercer sus derechos, puede contactarnos en:</p>
        <ul className="list-disc list-inside space-y-1 mt-3 text-text-secondary">
          <li><strong className="text-white">Correo electrónico:</strong> contacto@propsroom.com</li>
          <li><strong className="text-white">Asunto sugerido:</strong> "Datos personales — [su solicitud]"</li>
        </ul>
        <p className="mt-3">Si considera que su derecho a la protección de datos personales ha sido vulnerado, puede presentar una denuncia ante el <strong className="text-white">Instituto Nacional de Transparencia, Acceso a la Información y Protección de Datos Personales (INAI)</strong>: <a href="https://home.inai.org.mx" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-white underline underline-offset-2 transition-colors">home.inai.org.mx</a></p>
      </>
    ),
  },
];

const PrivacyPolicy = () => {
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
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-display tracking-wide text-white mb-4">
              AVISO DE <span className="text-primary">PRIVACIDAD</span>
            </h1>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto leading-relaxed">
              Aviso de Privacidad Integral conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP).
            </p>
            <p className="text-text-muted text-sm mt-4">Última actualización: {LAST_UPDATED}</p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="flex items-center gap-2 text-sm">
          <Link to="/" className="text-primary font-medium hover:text-white transition-colors">Inicio</Link>
          <ChevronRight className="w-3.5 h-3.5 text-text-muted" />
          <span className="text-white font-medium">Aviso de Privacidad</span>
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
            <Shield className="w-8 h-8 text-primary mx-auto mb-3" />
            <h3 className="text-white font-bold text-lg mb-2">Tus Datos Están Protegidos</h3>
            <p className="text-text-secondary text-sm max-w-2xl mx-auto leading-relaxed">
              Este Aviso de Privacidad cumple con la <strong className="text-white">LFPDPPP</strong> y los{' '}
              <strong className="text-white">Lineamientos del Aviso de Privacidad</strong> publicados en el Diario Oficial de la Federación. Si consideras que
              tus derechos han sido vulnerados, puedes acudir al{' '}
              <a
                href="https://home.inai.org.mx"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-white underline underline-offset-2 transition-colors"
              >
                INAI
              </a>{' '}
              o comunicarte al <strong className="text-white">800 835 4324</strong>.
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default PrivacyPolicy;
