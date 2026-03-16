import { Link } from 'react-router-dom';
import { useNewArrivals } from '../hooks/useQueries';

const Home = () => {
  const { data: arrivalsData, isLoading: loadingArrivals } = useNewArrivals(3);
  const newArrivals = arrivalsData?.content || arrivalsData || [];

  return (
    <div className="font-sans w-full overflow-x-hidden bg-white">
      <main>
        {/* Hero Section */}
        <section className="relative bg-white pt-16 pb-24 lg:pt-32 lg:pb-40 overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="z-10">
              <h1 className="text-5xl lg:text-7xl font-bold leading-tight mb-6 text-header">
                Imprimiendo <span className="text-brand">algo extraordinario</span>
              </h1>
              <p className="text-lg text-gray-600 mb-10 max-w-lg leading-relaxed">
                Impresiones 3D profesionales y acabados artesanales para cosplayers que exigen el más alto nivel de precisión.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/catalogo"
                  className="bg-brand hover:bg-brand-dark text-white px-10 py-4 rounded-[8px] text-lg font-bold transition-all shadow-lg hover:translate-y-[-2px]"
                >
                  Ver Galería
                </Link>
                <Link
                  to="/contacto"
                  className="border-2 border-header text-header hover:bg-header hover:text-white px-10 py-4 rounded-[8px] text-lg font-bold transition-all"
                >
                  Cotización Personalizada
                </Link>
              </div>
            </div>
            <div className="relative group">
              <img
                alt="Cyber Helmet Prop"
                className="w-full h-auto object-cover rounded-[8px] shadow-2xl transition-transform duration-500 group-hover:scale-[1.02]"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDSjkSR6Z5mhKpGrGJjM95Di-oHdLrFS_PwKarbKE9R8RKQ8B5pUTh3mjYlHhxDy_hRqeTTN3TbXuGvCHn-UGRBC2pH-IMStj-1cY2TH1kkYL_DBqAu0TSLQtF_-3DBQK5PtdhbVkTZ-jLXuyxtEFv01sPdhBuuYzzkhL7BlfVYCJ_qHgK0onXn-qlMRpb3KxurcQ3KRAX5g5W6WpmZjLrzHIJGJnNG0Tf-5IHjks-7qcFBea7vLTcjHrP2pjJhxOkfwpPjACbkB7r_"
              />
              <div className="absolute -bottom-6 -left-6 bg-white p-6 shadow-xl rounded-[8px] border border-silver hidden md:block">
                <p className="text-brand font-bold text-sm uppercase">Next-Gen Detail</p>
                <p className="text-header font-medium">8K Resolution 3D Printing</p>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-6">
          <div className="h-px bg-silver"></div>
        </div>

        {/* Featured Props - New Arrivals */}
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4 uppercase tracking-wider text-header">New Arrivals</h2>
              <div className="w-16 h-1 bg-brand mx-auto"></div>
            </div>
            
            {loadingArrivals ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="cursor-pointer">
                    <div className="relative overflow-hidden rounded-[8px] mb-4 aspect-square bg-gray-100">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-200 to-transparent animate-pulse" />
                    </div>
                    <h3 className="text-xl font-bold mb-1 text-header">Loading...</h3>
                    <p className="text-gray-500 text-sm mb-4">Loading</p>
                    <span className="text-brand font-bold">$0.00</span>
                  </div>
                ))}
              </div>
            ) : newArrivals.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {newArrivals.map((product) => (
                  <Link key={product.id} to={`/producto/${product.slug}`} className="group cursor-pointer block">
                    <div className="relative overflow-hidden rounded-[8px] mb-4 aspect-square bg-gray-100">
                      <img
                        alt={product.name}
                        className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                        src={product.mainImageUrl || product.images?.[0]?.url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDTV0C2A9kZxNCY_ecO7ZTw7KvjkNkhPKh78DyzHc8VMFIASrb4pRdOKVi92ufNTCEI9SFewNOwVAE43M_nSooyGbxb_gqr1AzM-4mUJpeV1glvZqZeq6DTJoLbGl5yYAJDww_o3yx8ah5go5-GXnE_kdT6JmseNzoVWDo0gw1SrvvyyXS9HX0QZmXphwwyTTtRey12Hffxx6rVRqM-Xc7sYeQTknrD83jq-Gscn6c_25ZJT90zWZY0HLn3ZyYbEVM9nKALdCqhi1oO'}
                      />
                    </div>
                    <h3 className="text-xl font-bold mb-1 text-header">{product.name}</h3>
                    <p className="text-gray-500 text-sm mb-4">{product.categoryName || 'Prop\'s Room'}</p>
                    <span className="text-brand font-bold">
                      ${product.salePrice?.toFixed(2) || product.basePrice?.toFixed(2)}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Placeholder Products from Template */}
                <div className="group cursor-pointer">
                  <div className="relative overflow-hidden rounded-[8px] mb-4 aspect-square bg-gray-100">
                    <img
                      alt="Blade Replica"
                      className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuAKfem5yLlZRFjD03uwlGU_Efc9i8xFhb_sHuhuwpSvl52X5qlg0n3XOlGmk-VgRDyfi43klZLyxbRKPesRw-7mtdC5Vv6-dz6aRRplAZ7NbuLw50s5Vx2YIF9k1fACs2NjQYRlEPtJ78m6bOZ2IIgoMjl2NBkJgYLk9KBATByicfzM5sK-g0ZDc4yYVR8G5dXkw5tLc1kOY3yVyIE90KtZbLiqLkMzuFzo2-NRYpx4DIU9_q8XJeJlpdkY1HW8tUbJSZjH3N3It1ep"
                    />
                  </div>
                  <h3 className="text-xl font-bold mb-1 text-header">Neon Katana</h3>
                  <p className="text-gray-500 text-sm mb-4">Cyberpunk Series | LED Integrated</p>
                  <span className="text-brand font-bold">$349.00</span>
                </div>
                <div className="group cursor-pointer">
                  <div className="relative overflow-hidden rounded-[8px] mb-4 aspect-square bg-gray-100">
                    <img
                      alt="Armor Plate"
                      className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuA4jf4YxNbcjb2slLo9HS9Ro6nu4jJW8m_VNd8nUxn4BmSJa9Xt1b4QbPc-xo0luz6sC7kAl3QH5ozYsmbOUcebzvvEOzKqb-fMmyHQmAr7naxRYBSI8X_kUu_eWwIRzhbvCeARwsKxqbCcwJCDri4O6vyGlo0x7xCpcQAlzBb5j2hNo0zeJu0bvFwPpqNY2DQY9ZQKU4bR0-4E0frZAYmDIgNCs1zgUiy7_k8GrDRZHiQJQxzryqu99GRFlBW6KXrbaHekvmdwC7DX"
                    />
                  </div>
                  <h3 className="text-xl font-bold mb-1 text-header">Mandalorian Chest Plate</h3>
                  <p className="text-gray-500 text-sm mb-4">Beskar Finish | Bespoke Sizing</p>
                  <span className="text-brand font-bold">$189.00</span>
                </div>
                <div className="group cursor-pointer">
                  <div className="relative overflow-hidden rounded-[8px] mb-4 aspect-square bg-gray-100">
                    <img
                      alt="Sci-Fi Prop"
                      className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuAzhpVNyyM4SW_mYL5cZ4yxXE--Z2iKFisMmAqdO4Fn3Tc9y2JFtULZTPATD3HugKrRHeDXkMMiP889ZbxDOXP38LNy_B6L5QZRx9Q-_GZHWGeuUi2Vv-Zbpb8v_hqhMnVw9BoOwZplT7UHNQJsU59iMQdT16coVmjKdeE18Mb35Mfd0V1vMxerQGi7CY76zjP9htZ07bFtzB7uk-yfX9GGAq4ry0wxy5ZPWD77WJv7ZCYhy_UiJ9_5Jjzr1otVNd9TEXWvgxOENf8s"
                    />
                  </div>
                  <h3 className="text-xl font-bold mb-1 text-header">Fusion Cell Core</h3>
                  <p className="text-gray-500 text-sm mb-4">Wasteland Series | Hand-Weathered</p>
                  <span className="text-brand font-bold">$95.00</span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Our Process */}
        <section className="py-24 bg-header text-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-4xl font-bold mb-8">Precision in Every Polygon</h2>
                <p className="text-gray-300 mb-8 leading-relaxed">
                  We don't just print; we engineer. Every piece undergoes a rigorous 4-stage process to ensure it doesn't just look like the character's gear—it feels like it.
                </p>
                <ul className="space-y-6">
                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full border border-brand text-brand flex items-center justify-center font-bold mr-4">
                      1
                    </span>
                    <div>
                      <h4 className="font-bold text-lg">3D Modeling & Scaling</h4>
                      <p className="text-gray-400 text-sm">Perfectly scaled to your height and proportions using custom scan data.</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full border border-brand text-brand flex items-center justify-center font-bold mr-4">
                      2
                    </span>
                    <div>
                      <h4 className="font-bold text-lg">Ultra-Res Printing</h4>
                      <p className="text-gray-400 text-sm">Industrial SLA and FDM printing for glass-smooth surfaces and structural integrity.</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full border border-brand text-brand flex items-center justify-center font-bold mr-4">
                      3
                    </span>
                    <div>
                      <h4 className="font-bold text-lg">Artisanal Hand-Finishing</h4>
                      <p className="text-gray-400 text-sm">Hours of manual sanding, priming, and base coating to eliminate layer lines.</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full border border-brand text-brand flex items-center justify-center font-bold mr-4">
                      4
                    </span>
                    <div>
                      <h4 className="font-bold text-lg">Master Weathering</h4>
                      <p className="text-gray-400 text-sm">Multi-layer paint techniques to simulate rust, wear, and battlefield scars.</p>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="bg-gray-800 p-2 rounded-[8px] shadow-2xl">
                <img
                  alt="Production Process"
                  className="rounded-[8px] grayscale hover:grayscale-0 transition-all duration-700"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuChpSwXc7htj1-2GzSgpX9Bo1ssIX8wsb4qu_Df7gIA9SmcJucoVD7RAF6UodRUJvj94zqiAl6B54HTNSRNrhgeqUXT9S7Sr7DNuHcaOnqUHw1D6GwsPqb1z-ioxlX14Sirb9HE40W9giJAIgJIQTpn1zH7zLUHP_pjPgIchPe2_y0_kQ1YAwFcNs_zim8giM75pLnVCRpuayVSzLWcfOSgXw3liFvtnyYziMnYCop_FP5U09D3XfwrYsB36gJqSPZ-_bvTTluDWxT2"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 text-center bg-white">
          <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-4xl font-bold mb-6 text-header">Ready to Elevate Your Build?</h2>
            <p className="text-gray-500 mb-10 text-lg">
              Join the thousands of professional cosplayers who trust Prop's Room for their competition-winning props.
            </p>
            <Link
              to="/catalogo"
              className="bg-brand hover:bg-brand-dark text-white px-12 py-5 rounded-[8px] text-xl font-bold transition-transform hover:scale-105 shadow-xl inline-block"
            >
              Get Started Today
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Home;
