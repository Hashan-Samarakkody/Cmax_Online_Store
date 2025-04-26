import multer from 'multer';

// Multer configuration
const storage = multer.diskStorage({
    filename: function (req, file, callback) {
        callback(null, file.originalname);
    }
});

const upload = multer({ storage });

// Special handler for return media with size and count validation
const returnMediaUpload = (req, res, next) => {
    const uploadMedia = upload.array('media', 6);

    uploadMedia(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            // Multer error
            return res.status(400).json({
                success: false,
                message: `Upload error: ${err.message}`
            });
        } else if (err) {
            // Unknown error
            return res.status(400).json({
                success: false,
                message: err.message
            });
        }

        // Count images and videos and validate sizes
        let imageCount = 0;
        let videoCount = 0;

        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                if (file.mimetype.startsWith('image/')) {
                    // Check image size (5MB)
                    if (file.size > 5 * 1024 * 1024) {
                        return res.status(400).json({
                            success: false,
                            message: 'Each image must be less than 5MB'
                        });
                    }
                    imageCount++;
                } else if (file.mimetype.startsWith('video/')) {
                    // Check video size (20MB)
                    if (file.size > 20 * 1024 * 1024) {
                        return res.status(400).json({
                            success: false,
                            message: 'Each video must be less than 20MB'
                        });
                    }
                    videoCount++;
                } else {
                    // Not an allowed file type
                    return res.status(400).json({
                        success: false,
                        message: 'Only image and video files are allowed'
                    });
                }
            }

            // Validate counts
            if (imageCount > 4) {
                return res.status(400).json({
                    success: false,
                    message: 'Maximum 4 images are allowed'
                });
            }

            if (videoCount > 2) {
                return res.status(400).json({
                    success: false,
                    message: 'Maximum 2 videos are allowed'
                });
            }
        }

        next();
    });
};

export default upload;
export { returnMediaUpload };