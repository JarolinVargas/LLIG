class InvoiceGenerator {
    constructor(invoiceEl) {
        this.clientLogoEl = invoiceEl.querySelector('#heading-client-logo');
        this.importFileBtn = invoiceEl.querySelector('.import-file-btn');
        this.itemsListEl = invoiceEl.querySelector('.invoice-items > ul');
        this.itemsCountEl = invoiceEl.querySelector('#items-count');
        this.totalPriceEl = invoiceEl.querySelector('#total-price');
        this.totalTaxesEl = invoiceEl.querySelector('#total-taxes');
        this.discountEl = invoiceEl.querySelector('#total-discount');
        this.addItemsBtn = invoiceEl.querySelector('#add-items');
        this.removeItemsBtn = invoiceEl.querySelector('#remove-items');
        // Event listeners
        invoiceEl.querySelector('#import-client-logo').addEventListener('change', this.importFileInputChange);
        this.addItemsBtn.addEventListener('click', this.addItem);
        this.removeItemsBtn.addEventListener('click', this.toggleRemoveItems);
        this.discountEl.addEventListener('input', this.updateTotal);
        // States
        this.removeItemsOn = false;
        this.itemsArr = [];
        this.taxPercentage = 4;
        // List item HTML
        this.itemEditablesInitText = ['item name', 'item price', 'item description...']; // Initial text displayed in items editables
        this.listItemStr = `
            <li>
                <div class="item-label">
                <span class="item-name" contenteditable="true">${this.itemEditablesInitText[0]}</span>
                <span class="item-price currency-pseudo" contenteditable="true">${this.itemEditablesInitText[1]}</span>
                </div>
                <div class="item-content">
                <div class="item-details">
                    <div class="aligner columns-2 aligner-lrmargins-off aligner-responsive-off">
                    <div class="aligner-col col-1">
                        <h5>QUANTITY</h5>
                        <div class="quantity-control-btn">
                        <i class="quantity-add fa fa-plus-circle"></i>
                        <span class="item-quantity">1</span>
                        <i class="quantity-sub fa fa-minus-circle"></i>
                        </div>
                    </div>
                    <div class="aligner-col col-2">
                        <h5>TOTAL</h5>
                        <span class="item-price-total">$0.00</span>                      
                    </div>                     
                    </div>
                </div>
                <div class="item-details">
                    <h5>DESCRIPTION</h5>
                    <p contenteditable="true">${this.itemEditablesInitText[2]}</p>
                </div>
                </div>
            </li>`;
    }


    // IMPORT CLIENT LOGO IMAGE
    importFileInputChange = () => {
        const reader = new FileReader();
        const file = event.target.files[0];
        reader.onloadend = () => {
            this.clientLogoEl.src = event.target.result;
            this.clientLogoEl.style.display = 'block';
            this.importFileBtn.style.display = 'none';
        }
        if( file && file.type.match('image.*') ) {
            reader.readAsDataURL(file);
        }
    }


    // TOTAL
    updateTotal = () => {
        let itemsSum = 0;
        let discount = this.discountEl.value;
        const itemsTotal = this.itemsArr.map(item => {
            return item.price * item.quantity;
        });
        // Add totals of each item
        for( let i = 0; i < itemsTotal.length; i++ ) {
            itemsSum += itemsTotal[i];
        }
        itemsSum = itemsSum - discount; // Subtract discount from sum
        this.totalPriceEl.textContent = `$${itemsSum.toFixed(2)}`; // Update total
        this.totalTaxesEl.textContent = `$${(itemsSum / 100 * this.taxPercentage).toFixed(2)}`; // Update tax
    }


    // ITEMS FUNCTIONALITY
    // Add item
    addItem = () => {
        const itemId = new Date().getTime(); // Create unique id used to identify item in itemsArr
        const listItemHTML = new DOMParser().parseFromString(this.listItemStr, 'text/html').querySelector('li'); // Parse list item HTML string as DOM and get li in the body
        const listItemMod = this.prepareItemHTML(listItemHTML, itemId);
        this.itemsListEl.appendChild(listItemMod);
        // Add item info to itemsArr state
        this.itemsArr.push({
            id: itemId,
            quantity: 1,
            name: null,
            price: null,
            description: null
        });
        this.itemsCount();
        window.scrollTo(0, document.body.scrollHeight); // Scroll to bottom
        if( this.removeItemsOn ) this.toggleRemoveItems(); // If remove items is enabled, disable
    }

    // Count and update number of items
    itemsCount = () => {
        this.itemsCountEl.textContent = this.itemsArr.length;
    }

    // Prepare item before adding it to the list
    prepareItemHTML = (itemHTML, itemId) => {
        itemHTML.setAttribute('data-item-id', itemId);
        // Contenteditable focus event
        const editables = itemHTML.querySelectorAll('[contenteditable="true"]');
        for( let i = 0; i < editables.length; i++ ) {
            editables[i].addEventListener('focus', () => {
                if( editables[i].textContent === this.itemEditablesInitText[i] ) { // Compare initial text with current text on focus, and clear text if it matches,
                    editables[i].textContent = '';
                }
            });
            editables[i].addEventListener('focusout', () => {
                if( editables[i].textContent === '' ) { // If text content is empty after focusout, add initial text
                    editables[i].textContent = this.itemEditablesInitText[i];
                    editables[i].classList.remove('editable-icon-off');
                } else {
                    editables[i].classList.add('editable-icon-off'); // When text is edited/does not match initial text, add class that removes the font icon
                }
            });
        }
        // Quantity buttons event
        itemHTML.querySelector('.quantity-control-btn').addEventListener('click', () => {
            const clickedEl = event.srcElement;
            const [clickedAdd, clickedSub] = [clickedEl.classList.contains('quantity-add'), clickedEl.classList.contains('quantity-sub')];
            if( !clickedAdd && !clickedSub ) {
                return false; // Return false if neither add or sub buttons were clicked
            } else {
                const thisItemId = clickedEl.closest('[data-item-id]').getAttribute('data-item-id');
                const itemInItemsArr = this.itemsArr.find(x => x.id == thisItemId); // Find item in itemsArr with matching 'thisItemId' id
                let quantity = itemInItemsArr.quantity;
                if( clickedAdd ) {
                    quantity++;
                } else if( clickedSub && quantity >= 2 ) {
                    quantity--;
                }
                this.updateItemQuantity(quantity, thisItemId);
            }
        });
        // Item price
        itemHTML.querySelector('.item-price').addEventListener('keydown', (event) => {
            // Prevent input if point key is clicked, and there already is a point
            // Prevent input if key pressed is not a number, point, left & right arrows, or backspace
            const kc = event.keyCode;
            if( event.keyCode === 190 && event.target.textContent.includes('.') ) {
                event.preventDefault();
            } else if( !isFinite(event.key) && kc !== 190 && kc !== 8 && kc !== 37 && kc !== 39 ) {
                event.preventDefault();
            }
        });
        itemHTML.querySelector('.item-price').addEventListener('input', () => {
            const thisPrice = event.target.textContent;
            this.itemsArr.find(x => x.id == itemId).price = thisPrice; // Update item price in state
            this.updateItemTotal(itemId);
        })
        // Double click event
        itemHTML.addEventListener('click', () => {
            if( this.removeItemsOn ) {
                this.removeItem(itemId);
            }
        });
        return itemHTML;
    }

    // Update item quantity in DOM and itemsArr state
    updateItemQuantity = (quantity, itemId) => {
        this.itemsArr.find(x => x.id == itemId).quantity = quantity; // Update quantity in state
        this.itemsListEl.querySelector(`li[data-item-id="${itemId}"] .item-quantity`).textContent = quantity;
        this.updateItemTotal(itemId);
    }

    // Update item total
    updateItemTotal = (itemId) => {
        const itemInItemsArr = this.itemsArr.find(x => x.id == itemId);
        const total = itemInItemsArr.price * itemInItemsArr.quantity;
        this.itemsListEl.querySelector(`li[data-item-id="${itemId}"] .item-price-total`).textContent = `$${total.toFixed(2)}`;
        this.updateTotal();
    }

    // Remove item in DOM and itemsArr state
    removeItem = (itemId) => {
        const itemIndex = this.itemsArr.indexOf( this.itemsArr.find(x => x.id == itemId) ); // Get index of item to remove
        itemIndex !== -1 ? this.itemsArr.splice(itemIndex, 1) : null; // Remove from state
        this.itemsListEl.querySelector(`li[data-item-id="${itemId}"]`).remove(); // Remove from DOM
        this.itemsCount();
        this.updateTotal();
    }

    // Toggle remove items
    toggleRemoveItems = () => {
        !this.removeItemsOn ? this.removeItemsOn = true : this.removeItemsOn = false; // Toggle removeItemsOn depending on its current state
        if( this.removeItemsOn ) {
            invoiceEl.classList.add('removing-items');
        } else {
            invoiceEl.classList.remove('removing-items');
        }
    }
}

const invoiceEl = document.querySelector('#invoice');
const IG = new InvoiceGenerator(invoiceEl);