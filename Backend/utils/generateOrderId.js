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
    // Get the first item in the order
    const firstItem = orderData.items[0];

    // Get first letter of the first item's name (uppercase)
    const firstLetter = firstItem.name.charAt(0).toUpperCase();

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

    const categoryPrefix = firstItem.category && firstItem.category.name
        ? firstItem.category.name.slice(0, 2).toUpperCase()
        : 'XX'; // Default if category is not available

    // Get the next counter value
    const counter = counterManager.getNextCounter();

    // Construct order ID
    return `${firstLetter}${dateTime}-${categoryPrefix}-${counter}`;
};

export default generateOrderId;