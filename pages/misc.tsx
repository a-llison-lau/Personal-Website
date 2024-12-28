import { useState } from 'react';
import { NextPage } from 'next';
import photos from '../components/data/photos.json';

const Misc: NextPage<unknown> = () => {
    const [loading, setLoading] = useState(true);
    const [modalImage, setModalImage] = useState<string | null>(null);

    const openModal = (src: string) => {
        setModalImage(src);
    };

    const closeModal = () => {
        setModalImage(null);
    };

    return (
        <div className="min-h-screen px-4 py-8 relative">
            <h1>撮影 – Photograhy</h1>
            <p className="text-base text-left mb-4">Lumix LX100 II :D</p>
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
                    className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50"
                    onClick={closeModal} // Close modal when background is clicked
                >
                    <div 
                        className="relative"
                        onClick={(e) => e.stopPropagation()} // Prevent background click from closing modal
                    >
                        <img 
                            src={modalImage} 
                            alt="Full Screen" 
                            className="max-w-full max-h-full object-contain"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Misc;
