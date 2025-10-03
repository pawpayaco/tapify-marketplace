import Image from 'next/image';

export default function ImageModalGallery({ images, className = "" }) {
  return (
    <div className={`grid grid-cols-3 gap-4 ${className}`}>
      {images.map((image, index) => (
        <div
          key={index}
          className="relative aspect-square rounded-2xl overflow-hidden shadow-lg border border-white/20"
        >
          <Image
            src={image.src}
            alt={image.alt}
            fill
            className="object-cover"
          />
        </div>
      ))}
    </div>
  );
}
