import { useState } from 'react';
import { NextPage } from 'next';
import photos from '../components/data/photos.json';
import crafts from '../components/data/crafts.json';

const Misc: NextPage<unknown> = () => {
    const [loading, setLoading] = useState(true);
    const [modalImage, setModalImage] = useState<string | null>(null);
    const [galleryImages, setGalleryImages] = useState<string[] | null>(null);
    const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);

    const openModal = (src: string) => {
        setModalImage(src);
    };

    const closeModal = () => {
        setModalImage(null);
        setGalleryImages(null);
        setCurrentImageIndex(0);
    };

    const openGallery = (images: string[], index: number) => {
        setGalleryImages(images);
        setCurrentImageIndex(index);
    };

    const nextImage = () => {
        if (galleryImages) {
            setCurrentImageIndex((currentImageIndex + 1) % galleryImages.length);
        }
    };

    const prevImage = () => {
        if (galleryImages) {
            setCurrentImageIndex((currentImageIndex - 1 + galleryImages.length) % galleryImages.length);
        }
    };

    return (
        <div className="min-h-screen px-4 py-8 relative">
            {/* Handicrafts Section */}
            <h1 className="text-xl text-left mb-4">手作 – Handicrafts</h1>
            <p className="text-base text-left mb-4">I like to make things :D</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {crafts.map((craft, index) => (
                    <div key={index} className="overflow-hidden rounded shadow-lg group">
                        <img
                            src={craft.src}
                            alt={craft.alt}
                            className="w-full h-auto object-cover transition-transform duration-300 hover:scale-105 cursor-pointer"
                            onClick={() => {
                                if (craft.url !== 'None') {
                                    window.location.href = craft.url;
                                } else if (craft['additional pics'] && craft['additional pics'] !== 'None') {
                                    openGallery([craft.src, ...craft['additional pics']], 0);
                                } else {
                                    openModal(craft.src);
                                }
                            }}
                            onLoad={() => setLoading(false)}
                        />
                        <p className="text-sm text-center text-gray-700 mt-2">{craft.description}</p>
                    </div>
                ))}
            </div>

            {/* Photography Section */}
            <br></br>
            <h1 className="text-xl text-left mb-4">攝影 – Photography</h1>
            <p className="text-base text-left mb-4">Lumix LX100 II</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {photos.map((photo, index) => (
                    <div key={index} className="overflow-hidden rounded shadow-lg group">
                        <img
                            src={photo.src}
                            alt={photo.alt}
                            className="w-full h-auto object-cover transition-transform duration-300 hover:scale-105 cursor-pointer"
                            onClick={() => openModal(photo.src)}
                            onLoad={() => setLoading(false)}
                        />
                    </div>
                ))}
            </div>

            {/* Modal */}
            {(modalImage || galleryImages) && (
                <div
                    className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50"
                    onClick={closeModal} // Close modal when background is clicked
                >
                    <div
                        className="relative p-4 bg-black rounded-md"
                        onClick={(e) => e.stopPropagation()} // Prevent background click from closing modal
                    >
                        {galleryImages ? (
                            <>
                                <img
                                    src={galleryImages[currentImageIndex]}
                                    alt="Gallery Image"
                                    className="max-w-[90vw] max-h-[90vh] object-contain"
                                />
                                {/* Navigation Arrows */}
                                <button
                                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white text-2xl"
                                    onClick={prevImage}
                                >
                                    &#8592;
                                </button>
                                <button
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white text-2xl"
                                    onClick={nextImage}
                                >
                                    &#8594;
                                </button>
                            </>
                        ) : (
                            <img
                                src={modalImage!}
                                alt="Full Screen"
                                className="max-w-[90vw] max-h-[90vh] object-contain"
                            />
                        )}
                        {/* Close Button */}
                        <button
                            className="absolute top-4 right-4 text-white text-2xl"
                            onClick={closeModal}
                        >
                            &#10005;
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Misc;
