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