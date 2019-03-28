class InvoiceGenerator {
    constructor(invoiceEl) {
        this.clientName = invoiceEl.querySelector('#client-name');
        this.clientAddress = invoiceEl.querySelector('#client-address');
        this.clientInvoiceNum = invoiceEl.querySelector('#client-invoice-num');
        this.dateIssued = invoiceEl.querySelector('#date-issued');
        this.clientLogo = invoiceEl.querySelector('#heading-client-logo');
        this.itemsCount = invoiceEl.querySelector('#items-count');
        this.addItemsBtn = invoiceEl.querySelector('#add-items');
        this.removeItemsBtn = invoiceEl.querySelector('#remove-items');
        this.invoiceItemsUL = invoiceEl.querySelector('.invoice-items > ul');
        this.totalPrice = invoiceEl.querySelector('#total-price');
        this.totalTaxes = invoiceEl.querySelector('#total-taxes');
        this.totalDiscount = invoiceEl.querySelector('#total-discount');

        this.itemsArr; // Store items as array
        this.removeItems = false;
        this.taxPercentage = 4; // Tax percentage of total price

        // Event listeners
        this.addItemsBtn.addEventListener('click', this.addItem);
        this.removeItemsBtn.addEventListener('click', this.removeItem);
        this.invoiceItemsUL.addEventListener('click', this.updateItemQuantity);

        this.getInvoiceJSON();
    }

    // Request invoice JSON file
    getInvoiceJSON = () => {
        const xhr = new XMLHttpRequest();
        xhr.responseType = 'json';
        xhr.open('GET', '../data/invoice.json');
        xhr.onload = () => {
            if( xhr.readyState === 4 && xhr.status === 200 ) {
              this.useInvoiceJSON(xhr.response);
            } else {
                alert('Failed to load invoice.json');
            }
        };
        xhr.send();
    }

    useInvoiceJSON = (json) => {
        this.itemsArr = json.items;
        this.setClientDetails(json.clientDetails);
        this.updateClientItems(json.items);
    }

    // Set client details in heading
    setClientDetails = (details) => {
        this.clientName.textContent = details.client;
        this.clientAddress.textContent = details.address;
        this.clientInvoiceNum.textContent = details.invoice;
        this.dateIssued.textContent = details.dateIssued;
        this.clientLogo.setAttribute('src', `data/${details.logo}`);
    }

    // Update client items
    updateClientItems = () => {
        const items = this.itemsArr;
        let itemsHTML = ``;
        // Loop through each item and generate HTML with items
        for( let i = 0; i < items.length; i++ ) {
            const itm = items[i];
            const itmTotal = itm.price * itm.quantity; // Total price plus quantity
            itemsHTML += `
            <li data-item-index="${i}">
                <div class="item-label">
                    <span class="item-name">${itm.name} - <strong>$${itm.price}</strong></span>
                    <span class="item-price">$${itmTotal}</span>
                </div>
                <div class="item-content">
                    <div class="item-details">
                        <h5>QUANTITY</h5>
                        <div class="quantity-control-btn">
                        <i class="fa fa-plus-circle" data-item-index="${i}"></i>
                        <span class="item-quantity">${itm.quantity}</span>
                        <i class="fa fa-minus-circle" data-item-index="${i}"></i>
                        </div>
                    </div>
                    <div class="item-details">
                        <h5>DESCRIPTION</h5>
                        <p>${itm.description}</p>
                    </div>
                </div>
            </li>`;
        }
        // Insert items HTML blocks to items list
        this.invoiceItemsUL.innerHTML = itemsHTML;
        this.itemsCount.textContent = items.length;
        this.updateTotal(items);
    }

    // Add item (not actually useful)
    addItem = () => {
        this.itemsArr.push(this.itemsArr[0]);
        this.updateClientItems();
        window.scrollTo(0, document.body.scrollHeight); // Scroll to bottom
        if( this.removeItems ) {
            this.removeItem(); // Disable remove item
        }
    }

    // Toggle remove item
    removeItem = () => {
        this.removeItems = this.removeItems === false ? true : false;
        const itemsEl = document.querySelectorAll('.invoice-items > ul > li[data-item-index]');
        if( this.removeItems === true ) {
            alert('Double click the red items you want to remove.');
            // Add events listeners to items
            for( let i = 0; i < itemsEl.length; i++ ) {
                itemsEl[i].addEventListener('dblclick', this.removeThisItem);
            }
            // Add class to list
            invoiceEl.classList.add('removing-items');
        } else {
            for( let i = 0; i < itemsEl.length; i++ ) {
                itemsEl[i].removeEventListener('dblclick', this.removeThisItem);
            }
            invoiceEl.classList.remove('removing-items');
            //this.updateClientItems();
        }
    }

    // Remove specific items
    removeThisItem = (event) => {
        const itemsEl = document.querySelectorAll('.invoice-items > ul > li[data-item-index]');
        if( itemsEl.length > 1 ) {
            const itemIndex = Number(event.currentTarget.getAttribute('data-item-index'));
            this.itemsArr.splice(itemIndex, 1);
            event.currentTarget.remove();
            this.updateTotal(this.itemsArr);
            this.itemsCount.textContent = this.itemsArr.length;
        } else {
            alert('Cannot remove the last item.');
        }
    }

    // Update item quantity
    updateItemQuantity = (event) => {
        const clickedElement = event.srcElement;
        if( !clickedElement.hasAttribute('data-item-index') ) {
            return false;
        }
        const itemIndex = Number(clickedElement.getAttribute('data-item-index')); // Get item in itemsArr by index
        const thisItemEl = this.invoiceItemsUL.querySelector(`li[data-item-index="${itemIndex}"]`);
        const thisItemElQuantity = thisItemEl.querySelector('.item-quantity');
        const thisItemElTotal = thisItemEl.querySelector('.item-price');
        const thisItemPrice = Number(thisItemEl.querySelector('.item-name strong').textContent.replace(/\D/g, '')); // Get item price and convert to number
        if( clickedElement.classList.contains('fa-plus-circle') ) {
            this.itemsArr[itemIndex].quantity++; // Update quantity in itemsArr
            thisItemElQuantity.textContent = Number(thisItemElQuantity.textContent) + 1;
            thisItemElTotal.textContent = `$${Number(thisItemElTotal.textContent.replace(/\D/g, '')) + thisItemPrice}`;
            this.updateTotal(this.itemsArr);
        } else if( clickedElement.classList.contains('fa-minus-circle') && this.itemsArr[itemIndex].quantity > 1 ) {
            this.itemsArr[itemIndex].quantity--; // Update quantity in itemsArr
            thisItemElQuantity.textContent = Number(thisItemElQuantity.textContent) - 1;
            thisItemElTotal.textContent = `$${Number(thisItemElTotal.textContent.replace(/\D/g, '')) - thisItemPrice}`;
            this.updateTotal(this.itemsArr);
        } else {
            return false;
        }
    }

    /*  
        Update total
        Add all items prices including quantity
        Taxes is based on total
    */
    updateTotal = (items) => {
        let [total, taxes, discount] = [0, 0, 0];
        // total
        for( let i = 0; i < items.length; i++ ) {
            total += (items[i].price * items[i].quantity);
        }
        // taxes is 2% of total
        taxes = (total / 100 * this.taxPercentage);
        // discount
        this.totalPrice.textContent = `$${total}`;
        this.totalTaxes.textContent = `$${taxes}`;
        this.totalDiscount.textContent = `$${discount}`;
    }
}

const invoiceEl = document.querySelector('#invoice');
const IG = new InvoiceGenerator(invoiceEl);