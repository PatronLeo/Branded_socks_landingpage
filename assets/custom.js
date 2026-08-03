async function updateQuantity(itemKey, itemQty, change, max) {
  if((itemQty + change) < max) {
    let updates = {};
    updates[itemKey] = itemQty + change;

    fetch(window.Shopify.routes.root + 'cart/update.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ updates })
    })
    .then(response => {
      return response.json();
    })
    .then(responseBody => {
      document.documentElement.dispatchEvent(new CustomEvent('cart:refresh', {
        bubbles: true
      }));
      if (window.location.pathname === '/cart') {
          window.location.reload();
      }
    })
    .catch((error) => {
      console.error('Error:', error);
    });
  }
}

window.updateQuantity = updateQuantity;

async function mengenrabatt(formData) {
  const entries = Object.fromEntries(formData.entries());
  const id = entries['product-id'] || formData.get('product-id');
  let product = await findProductById(id);

  let variant = Object.fromEntries(formData.entries());
  let quantity;

  quantity = 1; 
  for (let i = 1; i <= 3; i++) {
    const optionKey = `option${i}`;
    if (!variant[optionKey]) continue;
    
    if (variant[optionKey].includes('3 Paar')) {
      quantity = 3;
      variant[optionKey] = '1 Paar';
      break;
    } else if (variant[optionKey].includes('6 Paar')) {
      quantity = 6;
      variant[optionKey] = '1 Paar';
      break;
    }
  }

  let foundVariantId = null;
  for (const productVariant of product.variants) {
    let optionMatch = true;
    
    if (variant.option1 && productVariant.option1.toString() !== variant.option1.toString()) optionMatch = false;
    if (variant.option2 && productVariant.option2.toString() !== variant.option2.toString()) optionMatch = false;
    if (variant.option3 && productVariant.option3.toString() !== variant.option3.toString()) optionMatch = false;
    
    if (optionMatch) {
      foundVariantId = productVariant.id;
      break;
    }
  }

  if (foundVariantId) {
    variant.id = foundVariantId;
  } else {
    console.error('No matching variant found');
  }

  return { 
    id: variant.id,
    quantity: quantity
  };
}

async function findProductById(productId) {
  let page = 1;
  const limit = 250;
  
  async function fetchPage() {
    try {
      const response = await fetch(`/products.json?limit=${limit}&page=${page}`);
      const data = await response.json();
      
      if (data.products.length === 0) {
        return null;
      }
      
      const product = data.products.find(p => p.id == productId || p.id.toString() === productId.toString());
      
      if (product) {
        return product;
      } else {
        page++;
        return fetchPage();
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }
  
  return await fetchPage();
}

window.mengenrabatt = mengenrabatt;