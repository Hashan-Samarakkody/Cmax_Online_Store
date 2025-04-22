import { v4 as uuidv4 } from 'uuid';
import base62 from 'base62';

// Function to generate a compact order ID with Base62 encoding
const generateOrderId = async (data = {}) => {
    // Generate a UUID
    const uuid = uuidv4();

    // Convert UUID to a Buffer (removing the dashes)
    const buffer = Buffer.from(uuid.replace(/-/g, ''), 'hex');

    // Split the buffer into two parts
    const firstPart = buffer.readUIntBE(0, 6);
    const secondPart = buffer.readUIntBE(6, 6);

    // Combine the parts for encoding
    const combined = firstPart.toString() + secondPart.toString();

    // Encode to Base62
    const base62Encoded = base62.encode(combined);

    // Ensure the order ID is 12 characters long by trimming
    const orderId = base62Encoded.substring(0, 12).padStart(12, '0');

    return orderId.toLocaleUpperCase();
};

export default generateOrderId;