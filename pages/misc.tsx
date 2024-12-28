import { useState } from 'react';
import { NextPage } from 'next';
import photos from '../components/data/photos.json';
import crafts from '../components/data/crafts.json';

const Misc: NextPage<unknown> = () => {
    const [loading, setLoading] = useState(true);
    const [modalImage, setModalImage] = useState<string | null>(null);
    const [galleryImages, setGalleryImages] = useState<string[]>([]); // Add state for gallery images
    const [isGalleryOpen, setIsGalleryOpen] = useState(false); // State to track gallery modal visibility
    const [currentImageIndex, setCurrentImageIndex] = useState(0); // To track the current image in the gallery


    const openModal = (src: string) => {
        setModalImage(src);
    };

    const closeModal = () => {
        setModalImage(null);
        setIsGalleryOpen(false);
    };

    const openGallery = (images: string[]) => {
        setGalleryImages(images); // Set the images for the gallery
        setCurrentImageIndex(0); // Start at the first image in the gallery
        setIsGalleryOpen(true); // Open the gallery modal
    };

    const navigateGallery = (direction: 'next' | 'prev') => {
        setCurrentImageIndex((prevIndex) => {
            if (direction === 'next') {
                return (prevIndex + 1) % galleryImages.length; // Loop back to the first image
            } else {
                return (prevIndex - 1 + galleryImages.length) % galleryImages.length; // Loop back to the last image
            }
        });
    };

    return (
        <div className="min-h-screen px-4 py-8 relative">
            <h1 className="text-xl text-left mb-4">手作 –– Handicrafts</h1>
            <p className="text-base text-left mb-4">I like to make things :D</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {crafts.map((craft, index) => (
                    <div key={index} className="overflow-hidden rounded shadow-lg group">
                        <div className="w-full h-48 relative"> {/* Fixed height for consistent size */}
                            <img
                                src={craft.src}
                                alt={craft.alt}
                                className="w-full h-full object-cover transition-transform duration-300 hover:scale-105 cursor-pointer"
                                onClick={() => {
                                    if (craft.pdf && craft.pdf !== "None") {
                                        window.open(craft.pdf, '_blank'); // Open PDF in a new tab
                                    } else if (craft.url && craft.url !== "None") {
                                        window.open(craft.url, '_blank'); // Open URL in a new tab
                                    } else if (craft['additional pics'] && craft['additional pics'].length > 0) {
                                        openGallery(craft['additional pics']);
                                    } else {
                                        openModal(craft.src);
                                    }
                                }}
                                onLoad={() => setLoading(false)}
                                loading="lazy"
                            />
                        </div>
                        <p className="mt-2 text-center text-sm text-gray-700">{craft.description}</p>
                    </div>
                ))}
            </div>

            <h1 className="text-xl text-left mb-4">攝影 –– Photography</h1>
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
            {/* Gallery Modal */}
            {isGalleryOpen && (
                <div
                    className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4"
                    onClick={closeModal}
                >
                    <div
                        className="relative w-full max-w-3xl h-auto bg-white p-4 rounded-lg shadow-lg"
                        onClick={(e) => e.stopPropagation()} // Prevent modal closing when clicking inside
                    >
                        <button
                            className="absolute top-4 right-4 text-white bg-gray-900 p-2 rounded-full hover:bg-gray-700 transition duration-300"
                            onClick={closeModal}
                        >
                            X
                        </button>
                        <div className="flex justify-center mb-4">
                            <button
                                className="text-white p-2 bg-gray-900 rounded-full hover:bg-gray-700"
                                onClick={() => navigateGallery('prev')}
                            >
                                Prev
                            </button>
                            <img
                                src={galleryImages[currentImageIndex]}
                                alt={`Gallery Image ${currentImageIndex + 1}`}
                                className="max-w-full max-h-screen object-contain"
                            />
                            <button
                                className="text-white p-2 bg-gray-900 rounded-full hover:bg-gray-700"
                                onClick={() => navigateGallery('next')}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal */}
            {modalImage && (
                <div
                    className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4" // Add padding here
                    onClick={closeModal} // Close modal when background is clicked
                >
                    <div
                        className="relative w-full max-w-3xl h-auto bg-white p-4 rounded-lg shadow-lg"
                        onClick={(e) => e.stopPropagation()} // Prevent background click from closing modal
                    >
                        <button
                            className="absolute top-4 right-4 text-white bg-gray-900 p-2 rounded-full hover:bg-gray-700 transition duration-300"
                            onClick={closeModal}
                        >
                            X
                        </button>
                        <img
                            src={modalImage}
                            alt="Full Screen"
                            className="max-w-full max-h-screen object-contain" // Ensure image is responsive and doesn't overflow
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Misc;
