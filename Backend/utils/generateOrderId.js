import fs from 'fs';
import path from 'path';

class OrderCounterManager {
    constructor() {
        this.counterFilePath = path.join(process.cwd(), 'data', 'orderCounter.json');
        this.ensureCounterFileExists();
        this.counter = this.loadCounter();
    }

    ensureCounterFileExists() {
        const dir = path.dirname(this.counterFilePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        if (!fs.existsSync(this.counterFilePath)) {
            fs.writeFileSync(this.counterFilePath, JSON.stringify({ counter: 1 }));
        }
    }

    loadCounter() {
        try {
            const data = fs.readFileSync(this.counterFilePath, 'utf8');
            const counterData = JSON.parse(data);
            return counterData.counter || 1;
        } catch (error) {
            console.error('Error loading order counter:', error);
            return 1;
        }
    }

    saveCounter() {
        try {
            fs.writeFileSync(this.counterFilePath, JSON.stringify({ counter: this.counter }));
        } catch (error) {
            console.error('Error saving order counter:', error);
        }
    }

    getNextCounter() {
        const currentCounter = this.counter;
        this.counter++;
        this.saveCounter();
        return currentCounter;
    }
}

// Create a singleton instance
const counterManager = new OrderCounterManager();

const generateOrderId = (orderData) => {
    // Check if orderData exists and has items
    if (!orderData || !orderData.items || !orderData.items.length) {
        // Fallback for when there are no items
        const now = new Date();
        const year = now.getFullYear().toString().slice(-2);
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');

        const dateTime = `${year}${month}${day}-${hours}${minutes}${seconds}`;
        const counter = counterManager.getNextCounter();

        // Use 'O' for Order when no item name is available
        return `O${dateTime}-XX-${counter}`;
    }

    // Get the first item in the order
    const firstItem = orderData.items[0];

    // Safely get first letter of the first item's name (uppercase)
    const firstLetter = firstItem.name ? firstItem.name.charAt(0).toUpperCase() : 'O';

    // Get current date and time
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2); // Last two digits of year
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    // Create date-time part
    const dateTime = `${year}${month}${day}-${hours}${minutes}${seconds}`;

    // Get the next counter value
    const counter = counterManager.getNextCounter();

    // Construct order ID
    return `${dateTime}${firstLetter}-${counter}`;
};
export default generateOrderId;