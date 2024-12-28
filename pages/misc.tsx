import { useState } from 'react';
import { NextPage } from 'next';
import photos from '../components/data/photos.json';
import crafts from '../components/data/crafts.json';

const Misc: NextPage<unknown> = () => {
    const [loading, setLoading] = useState(true);
    const [modalImage, setModalImage] = useState<string | null>(null);

    const openModal = (src: string) => {
        setModalImage(src);
    };

    const closeModal = () => {
        setModalImage(null);
    };

    const openGallery = (images: string[]) => {
        // Logic to handle the gallery view can go here
        console.log("Opening gallery with images:", images);
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
