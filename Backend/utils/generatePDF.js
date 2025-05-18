import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import mongoose from 'mongoose';
import orderModel from '../models/orderModel.js';
import productModel from '../models/productModel.js';
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
            // Get user info - first try to find the user, then fall back to order.address
            const user = await userModel.findById(order.userId);

            // Use address.firstName and address.lastName if available, otherwise use user.name or default
            let userName;
            if (order.address && order.address.firstName) {
                userName = `${order.address.firstName}`.trim();
            } else if (user && user.name) {
                userName = user.name;
            } else {
                userName = 'Unknown User';
            }

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

                // Add a unique key for grouping
                const itemKey = `${item.name}|${size}|${color}`;

                if (!groupedItems[itemKey]) {
                    groupedItems[itemKey] = {
                        name: item.name,
                        size: size || '',
                        color: color || '',
                        quantity: 0
                    };
                }
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

            userOrderGroups[userName].push({
                orderId: order.orderId,
                orderTime: orderTime,
                items: Object.values(groupedItems)
            });
        }

        // Add PDF document
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
        // Updated column widths - adjusting Order ID column to be wider
        const columnWidths = [80, 90, 80, 110, 50, 50, 50]; // Made Order ID column wider

        const drawRow = (y, row, isHeader = false) => {
            const fontSize = isHeader ? 12 : 9;
            doc.fontSize(fontSize);

            let currentX = startX;

            // Draw each column with proper alignment
            for (let i = 0; i < row.length; i++) {
                const alignMode = i === 6 ? 'center' : 'left'; // Center-align quantity
                const textOpts = {
                    width: columnWidths[i],
                    align: alignMode
                };

                // Use smaller font for Order ID if not header
                if (i === 1 && !isHeader) {
                    doc.fontSize(9); // Smaller font for Order ID
                    doc.text(row[i] || '', currentX, y, textOpts);
                    doc.fontSize(fontSize); // Reset back
                } else {
                    doc.text(row[i] || '', currentX, y, textOpts);
                }

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
                    const orderIdToShow = itemIndex === 0 ? order.orderId : '';
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

        // Add PDF document in landscape mode (A5 size)
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

export const generateSalesReport = async (req, res) => {
    try {
        const { startDate } = req.query;
        const endDate = new Date(); // Use current date as end date

        if (!startDate) {
            return res.status(400).json({
                success: false,
                message: 'Start date is required'
            });
        }

        // Parse dates
        const startDateTime = new Date(startDate);

        // Validate date format
        if (isNaN(startDateTime.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid date format'
            });
        }

        // Fetch completed orders between start and end dates
        const completedOrders = await orderModel.find({
            status: 'Delivered',
            date: { $gte: startDateTime.getTime(), $lte: endDate.getTime() }
        });

        if (completedOrders.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No completed orders found for the specified date range'
            });
        }

        // Process sales data and organize hierarchically
        const salesData = await processSalesData(completedOrders);

        // Generate PDF report
        const pdfPath = await generatePDFReport(salesData, startDateTime, endDate);

        // Send PDF for download
        res.download(pdfPath, `sales_report_${formatDateForFilename(startDateTime)}_to_${formatDateForFilename(endDate)}.pdf`, (err) => {
            if (err) {
                console.error('Download error:', err);
                res.status(500).json({ success: false, message: 'Error downloading PDF' });
            }
            // Clean up the temporary file
            fs.unlinkSync(pdfPath);
        });

    } catch (error) {
        console.error('Sales Report Generation Error:', error);
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

        // Check if  need yet another page
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
        const parts = item.size.split('_');
        const validSizes = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'];
        const sizePart = parts.find(part => validSizes.includes(part));
        if (sizePart) return sizePart;
    } else {
        return item.size;
    }

    return null;
}

// Helper function to extract color
function getColor(item) {
    // First check dedicated color field
    if (item.color && item.color !== 'undefined_undefined' && item.color !== 'undefined') {
        return item.color;
    }

    // Then check if color is embedded in size (e.g., "XS_red")
    if (item.size && item.size.includes('_')) {
        const parts = item.size.split('_');
        // Valid sizes to filter out
        const validSizes = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'];
        // Find parts that aren't sizes and aren't "undefined"
        const colorParts = parts.filter(part =>
            !validSizes.includes(part) && part !== 'undefined');

        if (colorParts.length > 0) {
            return colorParts.join('_'); // Join if multiple color parts
        }
    }

    return null;
}

// Helper function to format date
function formatDate(date) {
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Helper function to format date for filename
function formatDateForFilename(date) {
    return date.toISOString().split('T')[0];
}

// Helper function to process sales data and organize hierarchically
async function processSalesData(orders) {
    // Add a hierarchical structure: Category -> Subcategory -> Item -> Variations
    const salesHierarchy = {};

    // Process each order's items
    for (const order of orders) {
        for (const orderItem of order.items) {
            try {
                // Skip items without productId
                if (!orderItem.productId) {
                    continue;
                }

                // Get product details to find category and subcategory
                let product;
                try {
                    // Try to find by _id first
                    product = await productModel.findOne({ _id: orderItem.productId });

                    // If not found, try by productId field
                    if (!product && typeof orderItem.productId === 'string') {
                        product = await productModel.findOne({ productId: orderItem.productId });
                    }
                } catch (err) {

                    if (err.name === 'CastError' && typeof orderItem.productId === 'string') {
                        // Try to find by productId field instead
                        product = await productModel.findOne({ productId: orderItem.productId });
                    } else {
                        // Log other errors but continue processing
                        console.error('Error finding product:', err.message);
                    }
                }

                if (!product) {

                    // Use default values for products that can't be found
                    const category = 'Uncategorized';
                    const subcategory = 'Unknown';
                    const itemName = orderItem.name || 'Unknown Product';
                    const color = getColor(orderItem) || '-';
                    const size = getSize(orderItem) || '-';

                    // Initialize hierarchy for missing products
                    if (!salesHierarchy[category]) {
                        salesHierarchy[category] = {};
                    }

                    if (!salesHierarchy[category][subcategory]) {
                        salesHierarchy[category][subcategory] = {};
                    }

                    if (!salesHierarchy[category][subcategory][itemName]) {
                        salesHierarchy[category][subcategory][itemName] = [];
                    }

                    // Check if this variation already exists
                    const existingVariation = salesHierarchy[category][subcategory][itemName].find(
                        v => v.color === color && v.size === size
                    );

                    if (existingVariation) {
                        // Update quantity if variation exists
                        existingVariation.quantity += orderItem.quantity || 1;
                    } else {
                        // Add new variation
                        salesHierarchy[category][subcategory][itemName].push({
                            color,
                            size,
                            quantity: orderItem.quantity || 1
                        });
                    }

                    continue;
                }

                // Get category and subcategory names with fallbacks
                const category = await getCategoryName(product.category) || 'Uncategorized';
                const subcategory = await getSubcategoryName(product.subcategory) || 'General';

                // Extract color and size from the item - make sure neither is undefined
                const color = getColor(orderItem) || '-';
                const size = getSize(orderItem) || '-';

                // Initialize hierarchy if needed
                if (!salesHierarchy[category]) {
                    salesHierarchy[category] = {};
                }

                if (!salesHierarchy[category][subcategory]) {
                    salesHierarchy[category][subcategory] = {};
                }

                if (!salesHierarchy[category][subcategory][orderItem.name || product.name || 'Unnamed Product']) {
                    salesHierarchy[category][subcategory][orderItem.name || product.name || 'Unnamed Product'] = [];
                }

                // Use either orderItem.name or product.name as fallback
                const itemName = orderItem.name || product.name || 'Unnamed Product';

                // Check if this variation already exists
                const existingVariation = salesHierarchy[category][subcategory][itemName].find(
                    v => v.color === color && v.size === size
                );

                if (existingVariation) {
                    // Update quantity if variation exists
                    existingVariation.quantity += orderItem.quantity || 1;
                } else {
                    // Add new variation
                    salesHierarchy[category][subcategory][itemName].push({
                        color,
                        size,
                        quantity: orderItem.quantity || 1
                    });
                }
            } catch (err) {
                // Log error but continue processing other items
                console.error('Error processing order item:', err);
                console.error('Problematic item:', orderItem);
            }
        }
    }

    // Convert hierarchical data to format needed for report
    const reportData = [];
    let grandTotal = 0;

    for (const [categoryName, subcategories] of Object.entries(salesHierarchy)) {
        let categoryTotal = 0;
        const categoryEntries = [];

        for (const [subcategoryName, items] of Object.entries(subcategories)) {
            let subcategoryTotal = 0;
            const subcategoryEntries = [];

            for (const [itemName, variations] of Object.entries(items)) {
                let itemTotal = 0;

                // Add each variation as a row
                variations.forEach((variation, index) => {
                    itemTotal += variation.quantity;

                    subcategoryEntries.push({
                        category: index === 0 ? categoryName : '',
                        subcategory: index === 0 ? subcategoryName : '',
                        itemName: index === 0 ? itemName : '',
                        color: variation.color,
                        size: variation.size,
                        quantity: variation.quantity,
                        total: index === variations.length - 1 ? `${itemTotal}` : ''
                    });
                });

                subcategoryTotal += itemTotal;
            }

            // Add subcategory total row
            subcategoryEntries.push({
                category: '',
                subcategory: '',
                itemName: `Subcategory: ${subcategoryName}`,
                color: '',
                size: '',
                quantity: '',
                total: `${subcategoryTotal}`
            });

            categoryTotal += subcategoryTotal;
            categoryEntries.push(...subcategoryEntries);
        }

        // Add category total row
        categoryEntries.push({
            category: '',
            subcategory: '',
            itemName: `Category: ${categoryName}`,
            color: '',
            size: '',
            quantity: '',
            total: `${categoryTotal}`
        });

        grandTotal += categoryTotal;
        reportData.push(...categoryEntries);
    }

    // Add grand total row
    reportData.push({
        category: '',
        subcategory: '',
        itemName: `Total Items Sold`,
        color: '',
        size: '',
        quantity: '',
        total: `${grandTotal}`
    });

    return reportData;
}

// Helper function to generate PDF report
async function generatePDFReport(reportData, startDate, endDate) {
    // Add PDF document
    const doc = new PDFDocument({ margin: 30, size: 'A4', autoFirstPage: true });
    const outputPath = path.join(process.cwd(), 'sales_report.pdf');
    const writeStream = fs.createWriteStream(outputPath);
    doc.pipe(writeStream);

    // Format dates for display
    const formattedStartDate = formatDate(startDate);
    const formattedEndDate = formatDate(endDate);

    // Get current date and time for the report generation timestamp
    const generationDateTime = new Date();
    const formattedGenerationDateTime = generationDateTime.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    });

    // Title and header
    doc.font('Helvetica-Bold').fontSize(20).text('Sold Items Report – Cmax Online Store', { align: 'center' });
    doc.fontSize(12).text(`From – (${formattedStartDate}) To – (${formattedEndDate})`, { align: 'center' });
    doc.fontSize(10).text(`Report Generated: ${formattedGenerationDateTime}`, { align: 'center' });
    doc.moveDown(1);

    // Define table layout
    const tableTop = doc.y;
    const tableWidth = doc.page.width - 60;
    const columns = [
        { header: 'Category', width: tableWidth * 0.15, align: 'left' },
        { header: 'Subcategory', width: tableWidth * 0.15, align: 'left' },
        { header: 'Item Name', width: tableWidth * 0.25, align: 'left' },
        { header: 'Color', width: tableWidth * 0.1, align: 'center' },
        { header: 'Size', width: tableWidth * 0.1, align: 'center' },
        { header: 'Quantity', width: tableWidth * 0.1, align: 'center' },
        { header: 'Total', width: tableWidth * 0.15, align: 'right' }
    ];

    // Draw table header
    let xPos = 30;
    doc.font('Helvetica-Bold').fontSize(10);
    columns.forEach(column => {
        doc.rect(xPos, tableTop, column.width, 20).stroke();
        doc.text(column.header, xPos + 5, tableTop + 5, {
            width: column.width - 10,
            align: column.align || 'left'
        });
        xPos += column.width;
    });

    // Draw table rows
    let yPos = tableTop + 20;
    doc.font('Helvetica').fontSize(9);

    // Track current category and subcategory for alternating row colors
    let currentCategory = '';
    let currentSubcategory = '';
    let rowColor = 1; // 0 = white, 1 = light gray

    reportData.forEach(row => {
        // Check if  need a new page
        if (yPos > doc.page.height - 70) {

            // Add new page
            doc.addPage();
            yPos = 50;

            // Redraw the header on new page
            xPos = 30;
            doc.font('Helvetica-Bold').fontSize(10);
            columns.forEach(column => {
                doc.rect(xPos, yPos, column.width, 20).stroke();
                doc.text(column.header, xPos + 5, yPos + 5, {
                    width: column.width - 10,
                    align: column.align || 'left'
                });
                xPos += column.width;
            });
            yPos += 20;
            doc.font('Helvetica').fontSize(9);
        }

        // Determine if this is a total row
        const isSubcategoryTotal = row.itemName.startsWith('Total in Subcategory');
        const isCategoryTotal = row.itemName.startsWith('Total in Category');
        const isGrandTotal = row.itemName === 'Total Items Sold';
        const isTotal = isSubcategoryTotal || isCategoryTotal || isGrandTotal;

        // Set row height based on content
        const rowHeight = 20;

        // Use appropriate font and background for different row types
        if (isGrandTotal) {
            doc.font('Helvetica-Bold');
            // Fill with a darker color for grand total
            doc.fillColor('#d0d0d0').rect(30, yPos, tableWidth, rowHeight).fill();
        } else if (isCategoryTotal) {
            doc.font('Helvetica-Bold');
            // Fill with a medium color for category totals
            doc.fillColor('#e0e0e0').rect(30, yPos, tableWidth, rowHeight).fill();
        } else if (isSubcategoryTotal) {
            doc.font('Helvetica-Bold');
            // Fill with a lighter color for subcategory totals
            doc.fillColor('#f0f0f0').rect(30, yPos, tableWidth, rowHeight).fill();
        } else {
            doc.font('Helvetica');
            // Alternate row colors for regular items
            if (row.category !== currentCategory || row.subcategory !== currentSubcategory) {
                if (row.category || row.subcategory) {
                    currentCategory = row.category;
                    currentSubcategory = row.subcategory;
                    rowColor = rowColor === 0 ? 1 : 0;
                }
            }

            if (rowColor === 1) {
                doc.fillColor('#f9f9f9').rect(30, yPos, tableWidth, rowHeight).fill();
            }
        }

        // Reset fill color for text
        doc.fillColor('black');

        // Draw row borders
        doc.rect(30, yPos, tableWidth, rowHeight).stroke();

        // Draw cell borders and content
        xPos = 30;

        // For total rows, adjust the display
        const rowData = [
            isTotal ? '' : row.category,
            isTotal ? '' : row.subcategory,
            row.itemName,
            isTotal ? '' : row.color,
            isTotal ? '' : row.size,
            isTotal ? '' : (row.quantity ? row.quantity.toString() : ''),
            row.total || ''
        ];

        // Draw each cell in the row
        rowData.forEach((cell, i) => {
            // Draw cell border
            doc.rect(xPos, yPos, columns[i].width, rowHeight).stroke();

            // Format the cell content
            let cellText = cell || '';

            // Draw the cell text
            doc.text(cellText, xPos + 5, yPos + 5, {
                width: columns[i].width - 10,
                align: columns[i].align || 'left'
            });

            xPos += columns[i].width;
        });

        yPos += rowHeight;
    });
    // Finalize the PDF
    doc.end();

    // Return a promise that resolves when the PDF is written
    return new Promise((resolve, reject) => {
        writeStream.on('finish', () => resolve(outputPath));
        writeStream.on('error', reject);
    });
}

// Helper function to get category name
async function getCategoryName(categoryId) {
    try {
        const category = await mongoose.model('Category').findById(categoryId);
        return category ? category.name : 'Unknown Category';
    } catch (error) {
        console.error('Error getting category name:', error);
        return 'Unknown Category';
    }
}

// Helper function to get subcategory name
async function getSubcategoryName(subcategoryId) {
    try {
        const subcategory = await mongoose.model('Subcategory').findById(subcategoryId);
        return subcategory ? subcategory.name : 'Unknown Subcategory';
    } catch (error) {
        console.error('Error getting subcategory name:', error);
        return 'Unknown Subcategory';
    }
}
