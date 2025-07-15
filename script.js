// static/js/script.js
// This script handles all frontend interactions and communication with the Flask backend.

document.addEventListener('DOMContentLoaded', () => {
    // Get references to DOM elements
    const drinksContainer = document.getElementById('drinks-container');
    const addDrinkBtn = document.getElementById('add-drink-btn');
    const drinkModal = document.getElementById('drink-modal');
    const modalTitle = document.getElementById('modal-title');
    const drinkForm = document.getElementById('drink-form');
    const closeBtn = document.querySelector('.close-button');
    const messageBox = document.getElementById('message-box');
    const confirmDialog = document.getElementById('confirm-dialog');
    const confirmMessage = document.getElementById('confirm-message');
    const confirmYesBtn = document.getElementById('confirm-yes');
    const confirmNoBtn = document.getElementById('confirm-no');

    // New input fields
    const drinkBatchNoInput = document.getElementById('drink-batch-no');
    const drinkExpiryDateInput = document.getElementById('drink-expiry-date');
    const drinkQuantityInput = document.getElementById('drink-quantity');
    const drinkSubtypeInput = document.getElementById('drink-subtype');

    // Page sections and navigation links
    const pageSections = document.querySelectorAll('.page-section');
    const navLinks = document.querySelectorAll('.nav-link');


    let currentDrinkId = null; // To store the ID of the drink being edited
    let deleteCallback = null; // To store the callback function for confirmation dialog

    // --- Utility Functions ---

    /**
     * Displays a message box with a given message and type (success/error).
     * @param {string} message - The message to display.
     * @param {string} type - 'success' or 'error'.
     */
    function showMessage(message, type) {
        messageBox.textContent = message;
        messageBox.className = `message-box show ${type}`; // Add show and type classes
        setTimeout(() => {
            messageBox.classList.remove('show'); // Hide after 3 seconds
        }, 3000);
    }

    /**
     * Shows a custom confirmation dialog.
     * @param {string} message - The message to display in the dialog.
     * @param {function} onConfirm - Callback function if 'Yes' is clicked.
     */
    function showConfirmDialog(message, onConfirm) {
        confirmMessage.textContent = message;
        confirmDialog.classList.remove('hidden');
        deleteCallback = onConfirm; // Store the callback
    }

    /**
     * Hides the custom confirmation dialog.
     */
    function hideConfirmDialog() {
        confirmDialog.classList.add('hidden');
        deleteCallback = null; // Clear the callback
    }

    // --- Modal Handling ---

    /**
     * Opens the drink modal for adding or editing.
     * @param {object|null} drink - The drink object if editing, null if adding.
     */
    function openModal(drink = null) {
        drinkModal.classList.remove('hidden');
        if (drink) {
            modalTitle.textContent = 'Edit Drink';
            document.getElementById('drink-name').value = drink.name;
            document.getElementById('drink-description').value = drink.description;
            document.getElementById('drink-price').value = drink.price;
            // Populate new fields
            drinkBatchNoInput.value = drink.batch_no;
            drinkExpiryDateInput.value = drink.expiry_date;
            drinkQuantityInput.value = drink.quantity;
            drinkSubtypeInput.value = drink.drink_subtype;

            currentDrinkId = drink.id; // Set current drink ID for update
        } else {
            modalTitle.textContent = 'Add New Drink';
            drinkForm.reset(); // Clear form for new entry
            currentDrinkId = null; // No current drink ID for add
        }
    }

    /**
     * Closes the drink modal.
     */
    function closeModal() {
        drinkModal.classList.add('hidden');
        drinkForm.reset(); // Clear form
        currentDrinkId = null; // Reset ID
    }

    // Event listeners for modal close button and backdrop click
    closeBtn.addEventListener('click', closeModal);
    drinkModal.addEventListener('click', (e) => {
        if (e.target === drinkModal) { // Close only if clicking on the backdrop
            closeModal();
        }
    });

    // Event listeners for confirmation dialog buttons
    confirmYesBtn.addEventListener('click', () => {
        if (deleteCallback) {
            deleteCallback(); // Execute the stored callback
        }
        hideConfirmDialog();
    });
    confirmNoBtn.addEventListener('click', hideConfirmDialog);
    confirmDialog.addEventListener('click', (e) => {
        if (e.target === confirmDialog) { // Close only if clicking on the backdrop
            hideConfirmDialog();
        }
    });

    // --- Page Navigation Functions ---

    /**
     * Shows a specific page section and hides others.
     * @param {string} pageId - The ID of the page section to show (e.g., 'home-page', 'products-page').
     */
    function showPage(pageId) {
        pageSections.forEach(section => {
            section.classList.add('hidden'); // Hide all sections
        });
        document.getElementById(pageId).classList.remove('hidden'); // Show the selected section

        // Update active class on navigation links
        navLinks.forEach(link => {
            if (link.dataset.page === pageId) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        // If the products page is shown, fetch drinks
        if (pageId === 'products-page') {
            fetchDrinks();
        }
    }

    // Add event listeners to navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default link behavior
            const pageId = e.target.dataset.page;
            showPage(pageId);
        });
    });


    // --- API Interaction Functions ---

    const API_BASE_URL = 'http://127.0.0.1:5000'; // Replace with your backend URL if different

    /**
     * Fetches all drinks from the backend API.
     */
    async function fetchDrinks() {
        try {
            const response = await fetch(`${API_BASE_URL}/drinks`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const drinks = await response.json();
            renderDrinks(drinks); // Render fetched drinks
        } catch (error) {
            console.error('Error fetching drinks:', error);
            showMessage('Failed to load drinks.', 'error');
        }
    }

    /**
     * Adds a new drink to the backend.
     * @param {object} drinkData - The data for the new drink.
     */
    async function addDrink(drinkData) {
        try {
            const response = await fetch(`${API_BASE_URL}/drinks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(drinkData),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`HTTP error! status: ${response.status} - ${errorData.message}`);
            }
            const newDrink = await response.json();
            showMessage('Drink added successfully!', 'success');
            closeModal();
            fetchDrinks(); // Refresh the list
        } catch (error) {
            console.error('Error adding drink:', error);
            showMessage(`Failed to add drink: ${error.message}`, 'error');
        }
    }

    /**
     * Updates an existing drink on the backend.
     * @param {number} id - The ID of the drink to update.
     * @param {object} drinkData - The updated data for the drink.
     */
    async function updateDrink(id, drinkData) {
        try {
            const response = await fetch(`${API_BASE_URL}/drinks/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(drinkData),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`HTTP error! status: ${response.status} - ${errorData.message}`);
            }
            const updatedDrink = await response.json();
            showMessage('Drink updated successfully!', 'success');
            closeModal();
            fetchDrinks(); // Refresh the list
        } catch (error) {
            console.error('Error updating drink:', error);
            showMessage(`Failed to update drink: ${error.message}`, 'error');
        }
    }

    /**
     * Deletes a drink from the backend.
     * @param {number} id - The ID of the drink to delete.
     */
    async function deleteDrink(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/drinks/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`HTTP error! status: ${response.status} - ${errorData.message}`);
            }
            showMessage('Drink deleted successfully!', 'success');
            fetchDrinks(); // Refresh the list
        } catch (error) {
            console.error('Error deleting drink:', error);
            showMessage(`Failed to delete drink: ${error.message}`, 'error');
        }
    }

    // --- Rendering Functions ---

    /**
     * Renders the list of drinks into the DOM.
     * @param {Array<object>} drinks - An array of drink objects.
     */
    function renderDrinks(drinks) {
        drinksContainer.innerHTML = ''; // Clear existing drinks
        if (drinks.length === 0) {
            drinksContainer.innerHTML = '<p class="text-center text-gray-600 mt-8 col-span-full">No drinks available. Add some using the "Add New Drink" button above!</p>';
            return;
        }
        drinks.forEach(drink => {
            const drinkCard = document.createElement('div');
            drinkCard.className = 'bg-white p-6 rounded-xl shadow-md transform transition-transform duration-300 hover:scale-105 border border-gray-200';
            drinkCard.innerHTML = `
                <h3 class="text-xl font-semibold text-gray-800 mb-2">${drink.name}</h3>
                <p class="text-gray-600 text-sm mb-2">Subtype: <span class="font-medium">${drink.drink_subtype}</span></p>
                <p class="text-gray-600 mb-4">${drink.description || 'No description provided.'}</p>
                <div class="text-gray-700 text-sm mb-2 space-y-1">
                    <p>Batch No: <span class="font-medium">${drink.batch_no}</span></p>
                    <p>Expiry: <span class="font-medium">${drink.expiry_date}</span></p>
                    <p>Quantity: <span class="font-medium">${drink.quantity} units</span></p>
                </div>
                <p class="text-2xl font-bold text-green-600 mt-4 mb-4">$${drink.price.toFixed(2)}</p>
                <div class="flex justify-end space-x-3">
                    <button class="edit-btn bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200" data-id="${drink.id}">Edit</button>
                    <button class="delete-btn bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200" data-id="${drink.id}">Delete</button>
                </div>
            `;
            drinksContainer.appendChild(drinkCard);
        });

        // Add event listeners to newly created buttons
        document.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = parseInt(e.target.dataset.id);
                // Find the drink object from the fetched list
                const drinkToEdit = drinks.find(d => d.id === id);
                if (drinkToEdit) {
                    openModal(drinkToEdit);
                }
            });
        });

        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = parseInt(e.target.dataset.id);
                showConfirmDialog('Are you sure you want to delete this drink?', () => {
                    deleteDrink(id);
                });
            });
        });
    }

    // --- Event Listeners ---

    // Open modal for adding a new drink
    addDrinkBtn.addEventListener('click', () => openModal());

    // Handle form submission for adding/editing drinks
    drinkForm.addEventListener('submit', (e) => {
        e.preventDefault(); // Prevent default form submission
        const name = document.getElementById('drink-name').value.trim();
        const description = document.getElementById('drink-description').value.trim();
        const price = parseFloat(document.getElementById('drink-price').value);
        // Get values from new fields
        const batchNo = drinkBatchNoInput.value.trim();
        const expiryDate = drinkExpiryDateInput.value; // Date input value is already YYYY-MM-DD
        const quantity = parseInt(drinkQuantityInput.value);
        const drinkSubtype = drinkSubtypeInput.value.trim();


        if (!name || isNaN(price) || !batchNo || !expiryDate || isNaN(quantity) || !drinkSubtype) {
            showMessage('Please fill in all required fields: Name, Price, Batch No., Expiry Date, Quantity, and Drink Subtype.', 'error');
            return;
        }

        const drinkData = { name, description, price, batch_no: batchNo, expiry_date: expiryDate, quantity, drink_subtype: drinkSubtype };

        if (currentDrinkId) {
            updateDrink(currentDrinkId, drinkData); // Call update if editing
        } else {
            addDrink(drinkData); // Call add if creating new
        }
    });

    // Initial page load: show the Products page by default
    showPage('products-page');
});
