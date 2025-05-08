import Image from "next/image";
import { useState, useEffect, useRef } from "react";

const ProfileImage = (): JSX.Element => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isSpinning, setIsSpinning] = useState(true);
  const images = ["/images/me_1.jpg", "/images/me_2.jpg"];
  const spinTimerRef = useRef<NodeJS.Timeout | null>(null);
  const slowdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Spinning animation on page load
  useEffect(() => {
    if (!isSpinning) return;

    let spinCount = 0;
    const maxSpins = 12;

    spinTimerRef.current = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
      spinCount++;

      // Stop after max spins and pick final image
      if (spinCount >= maxSpins) {
        if (spinTimerRef.current) {
          clearInterval(spinTimerRef.current);
        }

        // Set final image with 75% chance of being me_1.jpg
        const randomValue = Math.random();
        let finalIndex;

        if (randomValue < 0.75) {
          finalIndex = 0; // 75% chance for me_1.jpg
        } else if (randomValue < 0.875) {
          finalIndex = 1; // 12.5% chance for me_2.jpg
        } else {
          finalIndex = 2; // 12.5% chance for me_3.jpg
        }

        setCurrentImageIndex(finalIndex);
        setIsSpinning(false);
      }

      // Gradually slow down the spin after majority of spins
      if (spinCount === Math.floor(maxSpins * 0.7)) {
        // Slow down at 70% of the way through
        if (spinTimerRef.current) {
          clearInterval(spinTimerRef.current);
        }

        // Continue with slower intervals
        spinTimerRef.current = setInterval(() => {
          setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
          spinCount++;

          // Stop after max spins and pick final image
          if (spinCount >= maxSpins) {
            if (spinTimerRef.current) {
              clearInterval(spinTimerRef.current);
            }

            // Set final image with 75% chance of being me_1.jpg
            const randomValue = Math.random();
            let finalIndex;

            if (randomValue < 0.75) {
              finalIndex = 0; // 75% chance for me_1.jpg
            } else if (randomValue < 0.875) {
              finalIndex = 1; // 12.5% chance for me_2.jpg
            } else {
              finalIndex = 2; // 12.5% chance for me_3.jpg
            }

            setCurrentImageIndex(finalIndex);
            setIsSpinning(false);
          }
        }, 200); // Slower interval for final portion of spins, but not too slow
      }
    }, 65);

    return () => {
      if (spinTimerRef.current) clearInterval(spinTimerRef.current);
      if (slowdownTimerRef.current) clearTimeout(slowdownTimerRef.current);
    };
  }, []);

  const cycleImage = () => {
    if (!isSpinning) {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }
  };

  return (
    <div onClick={cycleImage} className="cursor-pointer hover:opacity-90">
      <Image
        className="rounded-full select-none transition-all"
        src={images[currentImageIndex]}
        draggable={false}
        alt="My profile image"
        width={260}
        height={260}
      />
    </div>
  );
};

export default ProfileImage;
