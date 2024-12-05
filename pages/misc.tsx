import { useState } from 'react';
import { NextPage } from 'next';
import photos from '../components/data/photos.json';

const Misc: NextPage<unknown> = () => {
    const [loading, setLoading] = useState(true);

    return (
        <div className="min-h-screen px-4 py-8">
            <p className="text-base text-left mb-4">Also, I take pictures :D</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {photos.map((photo, index) => (
                    <div key={index} className="overflow-hidden rounded shadow-lg group">
                        <img 
                            src={photo.src} 
                            alt={photo.alt} 
                            className="w-full h-auto object-cover transition-transform duration-300 hover:scale-105" 
                            onLoad={() => setLoading(false)}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Misc;
