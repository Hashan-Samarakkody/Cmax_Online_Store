// Add product function
const addProduct = async (req, res) => {

    try {

        const { name, description, price, category, subCategory, sizes, bestseller } = req.body;
        
        const image1 = req.files.image1 && req.files.image1[0];
        const image2 = req.files.image2 && req.files.image2[0];
        const image3 = req.files.image3 && req.files.image3[0];
        const image4 = req.files.image4 && req.files.image4[0];

        const images = [image1, image2, image3, image4].filter((item) => item !== undefined);

        let imagesUrl 

        console.log(name, description, price, category, subCategory, sizes, bestseller)
        console.log(images)

        res.json({})
        
    } catch (error) {
        console.log(error)
        res.json({success: false, message: error.message})
    }
}

// Total product list function
const listProduct = async (req, res) => {
}

// Remove product function
const removeProduct = async (req, res) => {
}

// Get single product details function
const singleProduct = async (req, res) => {
}

export { addProduct, listProduct, removeProduct, singleProduct };