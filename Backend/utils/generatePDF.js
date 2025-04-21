import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import orderModel from '../models/orderModel.js';
import userModel from '../models/userModel.js';

export const generateOrderPDF = async (req, res) => {
    try {
        const placedOrders = await orderModel.find({
            status: { $in: ['Order Placed', 'Picking'] }
        });

        // Return error if no eligible orders found
        if (placedOrders.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No orders found with status "Order Placed" or "Picking"'
            });
        }

        const userOrderGroups = {};
        const validSizes = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'];

        // Process orders and group items by user and order
        for (const order of placedOrders) {
            const user = await userModel.findById(order.userId);
            const userName = user ? user.name : 'Unknown User';

            if (!userOrderGroups[userName]) {
                userOrderGroups[userName] = [];
            }

            // Group items within this specific order by name+size+color
            const groupedItems = {};

            order.items.forEach(item => {
                // Extract size and color
                let size = '';
                let color = '';

                if (item.size && item.size !== 'undefined' && item.size !== 'undefined_undefined') {
                    if (validSizes.includes(item.size)) {
                        size = item.size;
                    } else if (item.size.includes('_')) {
                        const parts = item.size.split('_');
                        const sizePart = parts.find(part => validSizes.includes(part));
                        if (sizePart) size = sizePart;

                        const colorPart = parts.find(part => !validSizes.includes(part) && part !== 'undefined');
                        if (colorPart) color = colorPart;
                    }
                }

                if ((!color || color === 'undefined') &&
                    item.color &&
                    item.color !== 'undefined' &&
                    item.color !== 'undefined_undefined') {
                    color = item.color;
                }

                // Create a unique key for grouping
                const itemKey = `${item.name}|${size}|${color}`;

                if (!groupedItems[itemKey]) {
                    groupedItems[itemKey] = {
                        name: item.name,
                        size: size || '',
                        color: color || '',
                        quantity: 0
                    };
                }

                // Add this item's quantity to the grouped total
                groupedItems[itemKey].quantity += item.quantity;
            });

            // Format order time in 12-hour format
            const orderDate = new Date(order.date);
            const orderTime = orderDate.toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: 'numeric',
                hour12: true
            });

            // Add this order's grouped items to the user's orders
            userOrderGroups[userName].push({
                orderId: order._id,
                orderTime: orderTime,
                items: Object.values(groupedItems)
            });
        }

        // Create PDF document
        const doc = new PDFDocument({ margin: 30, size: 'A4' });
        const outputPath = path.join(process.cwd(), 'placed_orders_report.pdf');
        const writeStream = fs.createWriteStream(outputPath);
        doc.pipe(writeStream);

        // Title
        doc.font('Helvetica-Bold').fontSize(20).text('Placed Orders Report', { align: 'center' });
        doc.fontSize(16).text(`Orders Placed On ${new Date().toLocaleDateString()}`, { align: 'center' });
        doc.moveDown(1.5);

        // Table Header
        const startX = 30;
        let startY = doc.y;
        // Updated column widths to include Order ID and Time
        const columnWidths = [80, 80, 80, 120, 50, 50, 50];

        const drawRow = (y, row, isHeader = false) => {
            const fontSize = isHeader ? 12 : 10;
            doc.fontSize(fontSize);

            let currentX = startX;

            // Draw each column with proper alignment
            for (let i = 0; i < row.length; i++) {
                const alignMode = i === 6 ? 'center' : 'left'; // Center-align quantity
                doc.text(row[i] || '', currentX, y, {
                    width: columnWidths[i],
                    align: alignMode
                });
                currentX += columnWidths[i];
            }

            // Draw separator line
            doc.moveTo(startX, y + 15)
                .lineTo(startX + columnWidths.reduce((a, b) => a + b, 0), y + 15)
                .stroke();
        };

        // Draw header row
        doc.font('Helvetica-Bold');
        drawRow(startY, ['Ordered by', 'Order ID', 'Order Time', 'Item', 'Size', 'Color', 'Qty'], true);
        startY += 20;
        doc.font('Helvetica');

        // Draw user orders
        Object.entries(userOrderGroups).forEach(([userName, orders]) => {
            orders.forEach((order, orderIndex) => {
                order.items.forEach((item, itemIndex) => {
                    // Only show username for first item of first order
                    const userNameToShow = orderIndex === 0 && itemIndex === 0 ? userName : '';

                    // Only show order ID and time for first item of each order
                    const orderIdToShow = itemIndex === 0 ? order.orderId.toString().slice(-6) : '';
                    const orderTimeToShow = itemIndex === 0 ? order.orderTime : '';

                    drawRow(startY, [
                        userNameToShow,
                        orderIdToShow,
                        orderTimeToShow,
                        item.name,
                        item.size,
                        item.color,
                        item.quantity.toString()
                    ]);
                    startY += 20;

                    // Add a new page if needed
                    if (startY > 750) {
                        addFooter(doc);
                        doc.addPage();
                        startY = 50;
                        // Redraw header on new page
                        doc.font('Helvetica-Bold');
                        drawRow(startY, ['Ordered by', 'Order ID', 'Order Time', 'Item', 'Size', 'Color', 'Qty'], true);
                        startY += 20;
                        doc.font('Helvetica');
                    }
                });
                // Small gap between orders from the same user
                if (orderIndex < orders.length - 1) startY += 5;
            });
            // Larger gap between different users
            startY += 10;
        });

        // Add footer and finalize PDF
        addFooter(doc);
        doc.end();

        await new Promise((resolve, reject) => {
            writeStream.on('finish', resolve);
            writeStream.on('error', reject);
        });

        res.download(outputPath, 'placed_orders_report.pdf', (err) => {
            if (err) {
                console.error('Download error:', err);
                res.status(500).json({ success: false, message: 'Error downloading PDF' });
            }
            fs.unlinkSync(outputPath);
        });

        // Helper function to add footer and page numbers
        function addFooter(doc) {
            const range = doc.bufferedPageRange();
            for (let i = 0; i < range.count; i++) {
                doc.switchToPage(i);
                doc.fontSize(10).text(`Page ${i + 1} of ${range.count}`, 50, 780, { align: 'center' });
                doc.text('C-max Online Store', 50, 795, { align: 'center' });
            }
        }

    } catch (error) {
        console.error('PDF Generation Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const generateOrderLabel = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { type = 'standard' } = req.query; // Get label type from query params, default to standard

        const order = await orderModel.findById(orderId);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Get customer information if needed
        const user = await userModel.findById(order.userId);

        // Create PDF document in landscape mode (A5 size)
        const doc = new PDFDocument({
            size: [595, 420], // A5 size in landscape mode
            margins: {
                top: 30,
                bottom: 30,
                left: 40,
                right: 40
            }
        });

        const outputPath = path.join(process.cwd(), `order_label_${orderId}.pdf`);
        const writeStream = fs.createWriteStream(outputPath);
        doc.pipe(writeStream);

        // Common variables
        const centerX = doc.page.width / 2;
        const titleY = 95;
        const taglineY = 115;
        const storeName = 'C-Max Online Store';
        const tagline = 'Your Favorite Products, Delivered with Care!';

        // Based on type parameter and number of items, choose the label format
        if (type === 'table' || (type === 'auto' && order.items.length > 1)) {
            createTableLabel(doc, order, centerX, titleY, taglineY, storeName, tagline);
        } else {
            createStandardLabel(doc, order, centerX, titleY, taglineY, storeName, tagline);
        }

        // Finalize the PDF
        doc.end();

        // Wait for PDF creation to complete
        await new Promise((resolve, reject) => {
            writeStream.on('finish', resolve);
            writeStream.on('error', reject);
        });

        // Send the PDF for download
        res.download(outputPath, `order_label_${orderId}.pdf`, (err) => {
            if (err) {
                console.error('Download error:', err);
                res.status(500).json({ success: false, message: 'Error downloading label' });
            }
            // Clean up the temporary file
            fs.unlinkSync(outputPath);
        });

    } catch (error) {
        console.error('Label Generation Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Helper function to create the standard label
function createStandardLabel(doc, order, centerX, titleY, taglineY, storeName, tagline) {
    // Add common header
    createHeader(doc, centerX, titleY, taglineY, storeName, tagline);

    // Content area - split into two columns
    const leftColumnX = 50;
    const rightColumnX = 320;
    const lineHeight = 25;
    let startY = 150;

    // Define footer position
    const footerY = 350;

    // Left Column - Customer Information
    doc.font('Helvetica-Bold').fontSize(12).text('Order Id:', leftColumnX, startY);
    doc.font('Helvetica').fontSize(12).text(order.orderId, leftColumnX + 110, startY);

    doc.font('Helvetica-Bold').fontSize(12).text('Ordered by:', leftColumnX, startY + lineHeight);
    doc.font('Helvetica').fontSize(12).text(`${order.address.firstName} ${order.address.lastName}`, leftColumnX + 110, startY + lineHeight);

    doc.font('Helvetica-Bold').fontSize(12).text('Address:', leftColumnX, startY + lineHeight * 2);

    // Address indented
    const addressX = leftColumnX + 20;
    doc.font('Helvetica').fontSize(12)
        .text(order.address.street + ",", addressX, startY + lineHeight * 3)
        .text(order.address.city + ",", addressX, startY + lineHeight * 4)
        .text(`${order.address.state}, ${order.address.postalCode}`, addressX, startY + lineHeight * 5);

    doc.font('Helvetica-Bold').fontSize(12).text('Contact Number:', leftColumnX, startY + lineHeight * 6);
    doc.font('Helvetica').fontSize(12).text(order.address.phoneNumber, leftColumnX + 140, startY + lineHeight * 6);

    // Right Column - Order Details
    let currentY = startY;

    // Get the first item for standard label
    const item = order.items[0];

    doc.font('Helvetica-Bold').fontSize(14).text('Product Details:', rightColumnX, currentY);
    currentY += lineHeight;

    doc.font('Helvetica-Bold').fontSize(12).text('Product Name:', rightColumnX, currentY);
    doc.font('Helvetica').fontSize(12).text(item.name, rightColumnX + 130, currentY);
    currentY += lineHeight;

    doc.font('Helvetica-Bold').fontSize(12).text('Quantity:', rightColumnX, currentY);
    doc.font('Helvetica').fontSize(12).text(item.quantity, rightColumnX + 130, currentY);
    currentY += lineHeight;

    // Handle size if available
    const size = getSize(item);
    if (size) {
        doc.font('Helvetica-Bold').fontSize(12).text('Size:', rightColumnX, currentY);
        doc.font('Helvetica').fontSize(12).text(size, rightColumnX + 130, currentY);
        currentY += lineHeight;
    }

    // Handle color if available
    const color = getColor(item);
    if (color) {
        doc.font('Helvetica-Bold').fontSize(12).text('Colour:', rightColumnX, currentY);
        doc.font('Helvetica').fontSize(12).text(color.charAt(0).toUpperCase() + color.slice(1), rightColumnX + 130, currentY);
        currentY += lineHeight;
    }

    // Order payment details
    currentY += lineHeight / 2;

    doc.font('Helvetica-Bold').fontSize(12).text('Payment Method:', rightColumnX, currentY);
    doc.font('Helvetica').fontSize(12).text(order.paymentMethod, rightColumnX + 130, currentY);
    currentY += lineHeight;

    doc.font('Helvetica-Bold').fontSize(12).text('Amount:', rightColumnX, currentY);
    let amount = order.amount || 0;
    doc.font('Helvetica').fontSize(12).text(`Rs.${amount}`, rightColumnX + 130, currentY);
    currentY += lineHeight;

    doc.font('Helvetica-Bold').fontSize(12).text('Paid:', rightColumnX, currentY);
    doc.font('Helvetica').fontSize(12).text(order.payment ? 'Yes' : 'No', rightColumnX + 130, currentY);

    // Add footer
    addFooter(doc, footerY);
}

// Helper function to create the table-format label
function createTableLabel(doc, order, centerX, titleY, taglineY, storeName, tagline) {
    // Add common header
    createHeader(doc, centerX, titleY, taglineY, storeName, tagline);

    // Customer information section
    const leftMargin = 50;
    const lineHeight = 20;
    let currentY = 150;

    // Define footer position
    const footerY = 350;

    // Track page numbers
    let currentPage = 1;

    // Order information
    doc.font('Helvetica-Bold').fontSize(12).text('Order Id:', leftMargin, currentY);
    doc.font('Helvetica').fontSize(12).text(order._id, leftMargin + 110, currentY);
    currentY += lineHeight;

    doc.font('Helvetica-Bold').fontSize(12).text('Ordered by:', leftMargin, currentY);
    doc.font('Helvetica').fontSize(12).text(`${order.address.firstName} ${order.address.lastName}`, leftMargin + 110, currentY);
    currentY += lineHeight;

    doc.font('Helvetica-Bold').fontSize(12).text('Contact:', leftMargin, currentY);
    doc.font('Helvetica').fontSize(12).text(order.address.phoneNumber, leftMargin + 110, currentY);
    currentY += lineHeight;

    doc.font('Helvetica-Bold').fontSize(12).text('Address:', leftMargin, currentY);
    doc.font('Helvetica').fontSize(12).text(
        `${order.address.street}, ${order.address.city}, ${order.address.state}, ${order.address.postalCode}`,
        leftMargin + 110,
        currentY,
        { width: 380 }
    );
    currentY += lineHeight * 1.5;

    // Payment information
    doc.font('Helvetica-Bold').fontSize(12).text('Payment Method:', leftMargin, currentY);
    doc.font('Helvetica').fontSize(12).text(order.paymentMethod, leftMargin + 110, currentY);
    currentY += lineHeight;

    doc.font('Helvetica-Bold').fontSize(12).text('Amount:', leftMargin, currentY);
    doc.font('Helvetica').fontSize(12).text(`Rs.${order.amount}`, leftMargin + 110, currentY);
    currentY += lineHeight;

    doc.font('Helvetica-Bold').fontSize(12).text('Payment Status:', leftMargin, currentY);
    doc.font('Helvetica').fontSize(12).text(order.payment ? 'Paid' : 'Pending', leftMargin + 110, currentY);

    // Add footer to first page
    addFooter(doc, footerY);

    // Always create a new page for the product table
    doc.addPage();
    currentPage++;

    // Add header to new page
    createHeader(doc, centerX, titleY, taglineY, storeName, tagline);
    doc.font('Helvetica').fontSize(10).text(`Page ${currentPage}`, 500, 10);

    // Reset Y position for new page
    currentY = 150;

    // Products Table
    doc.font('Helvetica-Bold').fontSize(14).text('Order Items:', leftMargin, currentY);
    currentY += lineHeight;

    // Table headers
    const tableTop = currentY;
    const colWidths = [210, 80, 80, 80];
    const colPositions = [leftMargin];

    // Calculate column positions
    for (let i = 0; i < colWidths.length - 1; i++) {
        colPositions.push(colPositions[i] + colWidths[i]);
    }

    // Draw table header
    doc.font('Helvetica-Bold').fontSize(12);
    doc.rect(leftMargin, tableTop, colWidths.reduce((sum, w) => sum + w, 0), lineHeight).stroke();
    doc.text('Product Name', colPositions[0] + 5, tableTop + 5);
    doc.text('Size', colPositions[1] + 5, tableTop + 5);
    doc.text('Color', colPositions[2] + 5, tableTop + 5);
    doc.text('Quantity', colPositions[3] + 5, tableTop + 5);

    currentY = tableTop + lineHeight;

    // Draw table rows
    doc.font('Helvetica').fontSize(12);
    for (const item of order.items) {
        const size = getSize(item) || '-';
        const color = getColor(item) || '-';

        // Draw row background and borders
        doc.rect(leftMargin, currentY, colWidths.reduce((sum, w) => sum + w, 0), lineHeight).stroke();

        // Write cell content
        doc.text(item.name, colPositions[0] + 5, currentY + 5, { width: colWidths[0] - 10 });
        doc.text(size, colPositions[1] + 5, currentY + 5);
        doc.text(color, colPositions[2] + 5, currentY + 5);
        doc.text(item.quantity.toString(), colPositions[3] + 5, currentY + 5);

        currentY += lineHeight;

        // Check if we need yet another page
        if (currentY > footerY - 30) {
            addFooter(doc, footerY);
            doc.addPage();
            currentPage++;

            // Add the header to the new page
            createHeader(doc, centerX, titleY, taglineY, storeName, tagline);
            doc.font('Helvetica').fontSize(10).text(`Page ${currentPage}`, 500, 10);

            currentY = 150;

            // Repeat table headers on new page
            doc.font('Helvetica-Bold').fontSize(14).text('Order Items (continued):', leftMargin, currentY);
            currentY += lineHeight;

            const newTableTop = currentY;

            // Draw table header on new page
            doc.font('Helvetica-Bold').fontSize(12);
            doc.rect(leftMargin, newTableTop, colWidths.reduce((sum, w) => sum + w, 0), lineHeight).stroke();
            doc.text('Product Name', colPositions[0] + 5, newTableTop + 5);
            doc.text('Size', colPositions[1] + 5, newTableTop + 5);
            doc.text('Color', colPositions[2] + 5, newTableTop + 5);
            doc.text('Quantity', colPositions[3] + 5, newTableTop + 5);

            currentY = newTableTop + lineHeight;
            doc.font('Helvetica').fontSize(12);
        }
    }

    // Add footer to the last page
    addFooter(doc, footerY);

    // Update page numbers
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
        doc.switchToPage(i + range.start);
        doc.font('Helvetica').fontSize(10).text(`Page ${i + range.start + 1} of ${currentPage}`, 500, 10);
    }
}

// Helper function to create header
function createHeader(doc, centerX, titleY, taglineY, storeName, tagline) {
    // Logo at the top, centered
    const logoPath = path.join(process.cwd(), 'assets', 'logo.png');
    if (fs.existsSync(logoPath)) {
        doc.image(logoPath, centerX - 50, 10, { width: 100 });
    } else {
        console.error('Logo file not found at:', logoPath);
    }

    // Store name (centered manually)
    doc.font('Helvetica-Bold').fontSize(20);
    const storeNameWidth = doc.widthOfString(storeName);
    doc.text(storeName, (doc.page.width - storeNameWidth) / 2, titleY);

    // Store tagline (centered manually)
    doc.font('Helvetica-Oblique').fontSize(8);
    const taglineWidth = doc.widthOfString(tagline);
    doc.text(tagline, (doc.page.width - taglineWidth) / 2, taglineY);

    // Draw a line under the header
    doc.moveTo(40, 130).lineTo(555, 130).stroke();
}

// Helper function to add footer
function addFooter(doc, y) {
    // Draw a line above the footer
    doc.moveTo(40, y).lineTo(555, y).stroke();

    // Contact information
    doc.font('Helvetica').fontSize(9).text(`TELE: ${process.env.STORE_PHONE || '(075-6424532)'}`, 50, y + 15);
    doc.text(`EMAIL: ${process.env.STORE_EMAIL || '(email)'}`, 160, y + 15);

    // Get the current year
    const currentYear = new Date().getFullYear();

    // Return policy
    doc.text(`Return Policy: 7 Days from the date of delivery - Cmax@${currentYear}`, 300, y + 15);
}

// Helper function to extract size
function getSize(item) {
    if (!item.size || item.size === 'undefined_undefined' || item.size === 'undefined') {
        return null;
    }

    if (item.size.includes('_')) {
        const [sizePart] = item.size.split('_');
        if (sizePart !== 'undefined') {
            return sizePart;
        }
    } else {
        return item.size;
    }

    return null;
}

// Helper function to extract color
function getColor(item) {
    if (item.color && item.color !== 'undefined_undefined' && item.color !== 'undefined') {
        return item.color;
    } else if (item.size && item.size.includes('_')) {
        const [, colorPart] = item.size.split('_');
        if (colorPart && colorPart !== 'undefined') {
            return colorPart;
        }
    }

    return null;
}