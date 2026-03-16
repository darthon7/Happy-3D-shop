import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { galleryApi } from '../api';

import Lightbox from 'yet-another-react-lightbox';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails';
import Fullscreen from 'yet-another-react-lightbox/plugins/fullscreen';
import Counter from 'yet-another-react-lightbox/plugins/counter';
import Captions from 'yet-another-react-lightbox/plugins/captions';
import Download from 'yet-another-react-lightbox/plugins/download';

import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/thumbnails.css';
import 'yet-another-react-lightbox/plugins/captions.css';
import 'yet-another-react-lightbox/plugins/counter.css';

const Gallery = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const response = await galleryApi.getAll();
      setImages(response.data || []);
    } catch (error) {
      console.error('Error fetching gallery:', error);
    } finally {
      setLoading(false);
    }
  };

  const openLightbox = (i) => {
    setIndex(i);
    setOpen(true);
  };

  const slides = images.map((image) => ({
    src: image.url,
    alt: image.altText || image.title || '',
    width: image.width || 1920,
    height: image.height || 1080,
    title: image.title || '',
    description: image.description || '',
    download: image.url,
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-gray-200 border-t-brand rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="py-12 px-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-12 h-12 bg-brand rounded-[8px] flex items-center justify-center text-white font-bold text-xl">PR</div>
        </div>
        <h1 className="text-3xl font-bold text-header mb-2">Galería</h1>
        <p className="text-gray-500 text-lg">Explora nuestros trabajos y proyectos</p>
      </div>

      {/* Masonry Gallery Grid */}
      {images.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg">No hay imágenes aún</p>
          <Link to="/catalogo" className="text-brand hover:text-brand-dark mt-4 inline-block">
            Ver catálogo
          </Link>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4 pb-12">
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4">
            {images.map((image, i) => (
              <div
                key={image.id}
                className="break-inside-avoid mb-4 cursor-pointer group"
                onClick={() => openLightbox(i)}
              >
                <div className="relative overflow-hidden rounded-[8px]">
                  <img
                    src={image.url}
                    alt={image.altText || image.title || ''}
                    className="w-full transition-all duration-500 group-hover:scale-[1.02]"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox */}
      <Lightbox
        open={open}
        close={() => setOpen(false)}
        index={index}
        slides={slides}
        plugins={[Zoom, Thumbnails, Fullscreen, Counter, Captions, Download]}
        closeOnBackdropClick={true}
        animation={{
          fade: 450,
          swipe: 500,
        }}
        zoom={{
          maxZoomPixelRatio: 3,
          scrollToZoom: true,
        }}
        thumbnails={{
          width: 120,
          height: 80,
          gap: 10,
          showToggle: true,
          imageFit: 'cover',
        }}
        counter={{
          style: {
            background: 'rgba(0, 0, 0, 0.75)',
            borderRadius: '20px',
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: '500',
            color: '#ffffff',
          }
        }}
        styles={{
          container: { 
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
          },
        }}
      />
    </div>
  );
};

export default Gallery;
