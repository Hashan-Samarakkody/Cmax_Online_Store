import imageCompression from 'browser-image-compression';

export const processImage = async (file) => {
    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
        throw new Error(`Invalid file type. Only PNG, JPEG, and JPG files are allowed.`);
    }

    // Add an image element to get dimensions
    const img = new Image();
    const imgUrl = URL.createObjectURL(file);

    try {
        // Wait for image to load
        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = imgUrl;
        });

        // Add canvas with 700x700 dimensions
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 700;
        canvas.height = 700;

        // For transparent background (for PNGs)
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Calculate aspect ratio to maintain proportions
        const scale = Math.max(700 / img.width, 700 / img.height);
        const x = (700 - img.width * scale) / 2;
        const y = (700 - img.height * scale) / 2;

        // Draw image on canvas, centered and scaled
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

        // Convert canvas to blob
        const blob = await new Promise(resolve => {
            // Use PNG for all images to ensure transparency support
            canvas.toBlob(resolve, 'image/png', 1.0);
        });

        // Add new file with original name but PNG extension
        const fileName = file.name.split('.').slice(0, -1).join('.') + '.png';
        const processedFile = new File([blob], fileName, { type: 'image/png' });

        return processedFile;
    } catch (error) {
        console.error('Error processing image:', error);
        throw new Error('Failed to process image');
    } finally {
        // Clean up object URL
        URL.revokeObjectURL(imgUrl);
    }
};