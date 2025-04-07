import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import orderModel from '../models/orderModel.js';
import userModel from '../models/userModel.js';

export const generateOrderPDF = async (req, res) => {
    try {
        const placedOrders = await orderModel.find({ status: 'Order Placed' });
        const userOrderGroups = {};

        // Predefined sizes
        const validSizes = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'];

        // Helper function to extract size and color
        const extractSizeColor = (item) => {
            let size = '';
            let color = '';

            if (item.size && item.size !== 'undefined' && item.size !== 'undefined_undefined') {
                if (validSizes.includes(item.size)) {
                    size = item.size;
                } else if (item.size.includes('_')) {
                    const parts = item.size.split('_');
                    const potentialSize = parts.find(part => validSizes.includes(part));
                    if (potentialSize) {
                        size = potentialSize;
                    }
                    const colorPart = parts.find(part => !validSizes.includes(part) && part !== 'undefined');
                    if (colorPart) {
                        color = colorPart;
                    }
                }
            }

            if ((!color || color === 'undefined') &&
                item.color &&
                item.color !== 'undefined' &&
                item.color !== 'undefined_undefined') {
                color = item.color;
            }

            return {
                size: size || '',
                color: color || ''
            };
        };

        for (const order of placedOrders) {
            const user = await userModel.findById(order.userId);
            const userName = user ? user.name : 'Unknown User';

            if (!userOrderGroups[userName]) {
                userOrderGroups[userName] = [];
            }

            order.items.forEach(item => {
                const { size, color } = extractSizeColor(item);

                userOrderGroups[userName].push({
                    name: item.name,
                    size: size,
                    color: color,
                    quantity: item.quantity
                });
            });
        }

        const doc = new PDFDocument({ margin: 30, size: 'A4' });
        const outputPath = path.join(process.cwd(), 'placed_orders_report.pdf');
        const writeStream = fs.createWriteStream(outputPath);
        doc.pipe(writeStream);

        // Title
        doc.font('Helvetica-Bold').fontSize(20).text('Placed Orders Report', { align: 'center' });
        doc.fontSize(16).text(`Orders Placed On ${new Date().toLocaleDateString()}`, { align: 'center' });
        doc.moveDown(1.5);

        // Table Header
        const startX = 50;
        let startY = doc.y;
        const columnWidths = [100, 150, 70, 70, 70];

        const drawRow = (y, row, isHeader = false) => {
            const fontSize = isHeader ? 14 : 12;
            doc.fontSize(fontSize);
            doc.text(row[0], startX, y, { width: columnWidths[0], align: 'left' });
            doc.text(row[1], startX + columnWidths[0], y, { width: columnWidths[1], align: 'left' });

            if (row[2]) {
                doc.text(row[2], startX + columnWidths[0] + columnWidths[1], y, { width: columnWidths[2], align: 'center' });
            }

            if (row[3]) {
                doc.text(row[3], startX + columnWidths[0] + columnWidths[1] + columnWidths[2], y, { width: columnWidths[3], align: 'center' });
            }

            doc.text(row[4], startX + columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[3], y, { width: columnWidths[4], align: 'center' });

            doc.moveTo(startX, y + 15).lineTo(startX + columnWidths.reduce((a, b) => a + b, 0), y + 15).stroke();
        };

        // Draw header row
        doc.font('Helvetica-Bold');
        drawRow(startY, ['Ordered by', 'Item', 'Size', 'Color', 'Quantity'], true);
        startY += 20;
        doc.font('Helvetica');

        // Draw user orders
        Object.entries(userOrderGroups).forEach(([userName, items]) => {
            items.forEach((item, index) => {
                drawRow(startY, [
                    index === 0 ? userName : '',
                    item.name,
                    item.size || '',
                    item.color || '',
                    item.quantity.toString()
                ]);
                startY += 20;

                // Add a new page if the content exceeds the page height
                if (startY > 750) {
                    addFooter(doc);
                    doc.addPage();
                    startY = 50;
                    drawRow(startY, ['Ordered by', 'Item', 'Size', 'Color', 'Quantity'], true);
                    startY += 20;
                }
            });
            startY += 5; // Extra space between users
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

        // Header with logo and store name
        const centerX = doc.page.width / 2;

        // Logo at the top, centered
        const logoPath = path.join(process.cwd(), 'assets', 'logo.png');
        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, centerX - 50, 10, { width: 100 }); // logo at y = 10
        } else {
            console.error('Logo file not found at:', logoPath);
        }

        // Add vertical spacing between logo and title
        const titleY = 95; // push title lower to create gap
        const taglineY = 115;

        // Store name (centered manually)
        const storeName = 'C-Max Online Store';
        doc.font('Helvetica-Bold').fontSize(20);
        const storeNameWidth = doc.widthOfString(storeName);
        doc.text(storeName, (doc.page.width - storeNameWidth) / 2, titleY);

        // Store tagline (centered manually)
        const tagline = 'Your Favorite Products, Delivered with Care!';
        doc.font('Helvetica-Oblique').fontSize(8);
        const taglineWidth = doc.widthOfString(tagline);
        doc.text(tagline, (doc.page.width - taglineWidth) / 2, taglineY);

        // Draw a line under the header
        doc.moveTo(40, 130).lineTo(555, 130).stroke();

        // Content area - split into two columns
        const leftColumnX = 50;
        const rightColumnX = 320;
        const lineHeight = 25;
        let startY = 150;

        // Define footer position
        const footerY = 350;

        // Left Column - Customer Information
        doc.font('Helvetica-Bold').fontSize(12).text('Order Id:', leftColumnX, startY);
        doc.font('Helvetica').fontSize(12).text(order._id, leftColumnX + 110, startY);

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

        // Display title for multiple items
        if (order.items.length > 1) {
            doc.font('Helvetica-Bold').fontSize(14).text('Order Items:', rightColumnX, currentY);
            currentY += lineHeight;
        }

        // Track if we need additional pages
        let currentPage = 1;
        let totalPages = 1; // We'll calculate this later if needed

        // Helper function to add page headers if needed
        const addPageHeader = () => {
            // Logo at the top, centered
            if (fs.existsSync(logoPath)) {
                doc.image(logoPath, centerX - 50, 10, { width: 100 });
            }

            // Store name
            doc.font('Helvetica-Bold').fontSize(20);
            doc.text(storeName, (doc.page.width - storeNameWidth) / 2, titleY);

            // Store tagline
            doc.font('Helvetica-Oblique').fontSize(8);
            doc.text(tagline, (doc.page.width - taglineWidth) / 2, taglineY);

            // Line under header
            doc.moveTo(40, 130).lineTo(555, 130).stroke();

            // Page indicator
            doc.font('Helvetica').fontSize(10).text(`Page ${currentPage}`, 500, 10);

            return 150; // Return the starting Y position for content
        };

        // Helper function to add footer
        const addFooter = (y) => {
            // Draw a line above the footer
            doc.moveTo(40, y).lineTo(555, y).stroke();

            // Contact information
            doc.font('Helvetica').fontSize(9).text(`TELE: ${process.env.STORE_PHONE || '(075-6424532)'}`, 50, y + 15);
            doc.text(`EMAIL: ${process.env.STORE_EMAIL || '(email)'}`, 160, y + 15);

            // Get the current year
            const currentYear = new Date().getFullYear();

            // Return policy
            doc.text(`Return Policy: 7 Days from the date of delivery - Cmax@${currentYear}`, 300, y + 15);
        };

        // Iterate through all items in the order
        for (let i = 0; i < order.items.length; i++) {
            const item = order.items[i];

            // If we're running out of space, start a new page
            if (currentY > footerY - 80) {
                addFooter(footerY);
                doc.addPage();
                currentPage++;
                currentY = addPageHeader();

                // If it's a continuation, add a header
                doc.font('Helvetica-Bold').fontSize(14).text('Order Items (continued):', rightColumnX, currentY);
                currentY += lineHeight;
            }

            // Add item number if there are multiple items
            if (order.items.length > 1) {
                doc.font('Helvetica-Bold').fontSize(12).text(`Item ${i + 1}:`, rightColumnX, currentY);
                currentY += lineHeight;
            }

            doc.font('Helvetica-Bold').fontSize(12).text('Product Name:', rightColumnX, currentY);
            doc.font('Helvetica').fontSize(12).text(item.name, rightColumnX + 130, currentY);
            currentY += lineHeight;

            doc.font('Helvetica-Bold').fontSize(12).text('Quantity:', rightColumnX, currentY);
            doc.font('Helvetica').fontSize(12).text(item.quantity, rightColumnX + 130, currentY);
            currentY += lineHeight;

            // Handle size if available
            if (item.size && item.size !== 'undefined_undefined' && item.size !== 'undefined') {
                let sizeValue = item.size;
                if (item.size.includes('_')) {
                    const [sizePart] = item.size.split('_');
                    if (sizePart !== 'undefined') {
                        sizeValue = sizePart;
                        doc.font('Helvetica-Bold').fontSize(12).text('Size:', rightColumnX, currentY);
                        doc.font('Helvetica').fontSize(12).text(sizeValue, rightColumnX + 130, currentY);
                        currentY += lineHeight;
                    }
                } else {
                    doc.font('Helvetica-Bold').fontSize(12).text('Size:', rightColumnX, currentY);
                    doc.font('Helvetica').fontSize(12).text(sizeValue, rightColumnX + 130, currentY);
                    currentY += lineHeight;
                }
            }

            // Handle color if available
            if (item.color && item.color !== 'undefined_undefined' && item.color !== 'undefined') {
                doc.font('Helvetica-Bold').fontSize(12).text('Colour:', rightColumnX, currentY);
                doc.font('Helvetica').fontSize(12).text(item.color.charAt(0).toUpperCase() + item.color.slice(1), rightColumnX + 130, currentY);
                currentY += lineHeight;
            } else if (item.size && item.size.includes('_')) {
                const [, colorPart] = item.size.split('_');
                if (colorPart && colorPart !== 'undefined') {
                    doc.font('Helvetica-Bold').fontSize(12).text('Colour:', rightColumnX, currentY);
                    doc.font('Helvetica').fontSize(12).text(colorPart, rightColumnX + 130, currentY);
                    currentY += lineHeight;
                }
            }

            // Add a separator line between items (if not the last item)
            if (i < order.items.length - 1) {
                doc.moveTo(rightColumnX, currentY).lineTo(rightColumnX + 220, currentY).stroke();
                currentY += lineHeight / 2;
            }
        }

        // Order payment details (after listing all items)
        currentY += lineHeight / 2;

        // Check if we have space for payment details, otherwise add a new page
        if (currentY > footerY - 80) {
            addFooter(footerY);
            doc.addPage();
            currentPage++;
            currentY = addPageHeader();
        }

        doc.font('Helvetica-Bold').fontSize(12).text('Payment Method:', rightColumnX, currentY);
        doc.font('Helvetica').fontSize(12).text(order.paymentMethod, rightColumnX + 130, currentY);
        currentY += lineHeight;

        doc.font('Helvetica-Bold').fontSize(12).text('Amount:', rightColumnX, currentY);
        let amount = order.amount || 0;
        doc.font('Helvetica').fontSize(12).text(`Rs.${amount}`, rightColumnX + 130, currentY);
        currentY += lineHeight;

        doc.font('Helvetica-Bold').fontSize(12).text('Paid:', rightColumnX, currentY);
        doc.font('Helvetica').fontSize(12).text(order.payment ? 'Yes' : 'No', rightColumnX + 130, currentY);

        // Add footer to the last page
        addFooter(footerY);

        // Update page numbers on all pages if multiple pages
        if (currentPage > 1) {
            totalPages = currentPage;

            // Use bufferedPageRange to get the pages that are currently accessible
            const range = doc.bufferedPageRange();
            for (let i = 0; i < range.count; i++) {
                doc.switchToPage(i + range.start);
                doc.font('Helvetica').fontSize(10).text(`Page ${i + range.start + 1} of ${totalPages}`, 500, 10);
            }
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