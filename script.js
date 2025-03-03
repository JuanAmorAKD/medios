document.addEventListener('DOMContentLoaded', function() {
    const urlInput = document.getElementById('urlInput');
    const addButton = document.getElementById('addButton');
    const exportButton = document.getElementById('exportButton');
    const copyButton = document.getElementById('copyButton');
    const exportResult = document.getElementById('exportResult');
    const exportedHtml = document.getElementById('exportedHtml');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const addCategoryBtn = document.getElementById('addCategoryBtn');
    const newCategoryName = document.getElementById('newCategoryName');
    const categoriesList = document.getElementById('categoriesList');
    const clippingArea = document.querySelector('.clipping-area');
    const manualNoteBtn = document.getElementById('manualNoteBtn');
    const manualNoteForm = document.getElementById('manualNoteForm');
    const submitManualNoteBtn = document.getElementById('submitManualNoteBtn');
    const cancelManualNoteBtn = document.getElementById('cancelManualNoteBtn');
    const viewToggleBtn = document.getElementById('viewToggleBtn');
    const exportJsonBtn = document.getElementById('exportJsonBtn');
    const exportXmlBtn = document.getElementById('exportXmlBtn');
    const importFileInput = document.getElementById('importFileInput');
    const importBtn = document.getElementById('importBtn');

    let isListView = false;
    let showDescriptions = true;
    let showImages = true;
    
    let categories = {
        defensoria: {
            name: 'Defensoría',
            items: []
        },
        otras_defensorias: {
            name: 'Otras Defensorías',
            items: []
        },
        gcaba: {
            name: 'GCABA',
            items: []
        },
        legislatura: {
            name: 'LEGISLATURA',
            items: []
        },
        nacionales: {
            name: 'NACIONALES',
            items: []
        }
    };
    
    let currentCategory = 'defensoria';

    // Añadir nuevos enlaces
    addButton.addEventListener('click', async function() {
        const urls = urlInput.value.trim().split('\n').filter(url => url.trim() !== '');
        
        if (urls.length > 0) {
            loadingOverlay.style.display = 'flex';
            
            for (const url of urls) {
                if (isValidURL(url)) {
                    try {
                        const metadata = await fetchMetadata(url);
                        addClippingItem(metadata, currentCategory);
                    } catch (error) {
                        console.error('Error fetching metadata:', error);
                        // Crear un elemento con información básica si falla la obtención de metadatos
                        addClippingItem({
                            title: 'No se pudo obtener el título',
                            description: 'No se pudo obtener la descripción',
                            image: '',
                            url: url,
                            favicon: getFaviconFromUrl(url)
                        }, currentCategory);
                    }
                }
            }
            
            urlInput.value = '';
            loadingOverlay.style.display = 'none';
        }
    });

    // Mostrar formulario para crear nota manual
    manualNoteBtn.addEventListener('click', function() {
        manualNoteForm.style.display = 'block';
    });

    // Cancelar creación de nota manual
    cancelManualNoteBtn.addEventListener('click', function() {
        manualNoteForm.style.display = 'none';
        manualNoteForm.reset();
    });

    // Crear nota manual
    submitManualNoteBtn.addEventListener('click', function() {
        const title = document.getElementById('manualNoteTitle').value.trim();
        const description = document.getElementById('manualNoteDescription').value.trim();
        const imageUrl = document.getElementById('manualNoteImage').value.trim();
        const url = document.getElementById('manualNoteUrl').value.trim();
        
        if (title && description) {
            const metadata = {
                title: title,
                description: description,
                image: imageUrl,
                url: url || '#'  // Si no se proporciona URL, usar # como placeholder
            };
            
            addClippingItem(metadata, currentCategory);
            manualNoteForm.style.display = 'none';
            manualNoteForm.reset();
        } else {
            alert('Por favor, complete al menos el título y la descripción');
        }
    });

    // Exportar HTML
    exportButton.addEventListener('click', function() {
        refreshExportHTML();
    });

    // Refrescar el HTML exportado
    function refreshExportHTML() {
        const html = generateExportableHTML();
        exportedHtml.value = html;
        exportResult.style.display = 'block';
        // Ocultar aviso de actualización al refrescar
        const updateNotice = document.getElementById('updateNotice');
        if (updateNotice) updateNotice.style.display = 'none';
    }

    // Make generateExportableHTML accessible globally
    window.generateExportableHTML = generateExportableHTML;
    window.refreshExportHTML = refreshExportHTML;

    // Copiar al portapapeles
    copyButton.addEventListener('click', function() {
        exportedHtml.select();
        document.execCommand('copy');
        alert('HTML copiado al portapapeles');
    });

    // Crear nueva categoría
    addCategoryBtn.addEventListener('click', function() {
        const categoryName = newCategoryName.value.trim();
        if (categoryName) {
            const categoryId = 'category_' + Date.now();
            addCategory(categoryId, categoryName);
            newCategoryName.value = '';
        }
    });

    // Cambiar entre categorías
    categoriesList.addEventListener('click', function(e) {
        if (e.target.tagName === 'LI') {
            const categoryId = e.target.dataset.id;
            setActiveCategory(categoryId);
        }
    });

    // Eliminar categoría
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('delete-category-btn') || 
            e.target.closest('.delete-category-btn')) {
            const categorySection = e.target.closest('.category-section');
            const categoryId = categorySection.id;
            
            if (categoryId !== 'defensoria') {
                deleteCategory(categoryId);
            }
        }
    });

    // Función para añadir un nuevo elemento de clipping
    function addClippingItem(metadata, categoryId) {
        const container = document.querySelector(`#${categoryId} .items-container`);
        
        // Crear el elemento HTML
        const itemElement = document.createElement('div');
        itemElement.className = 'clipping-item';
        itemElement.innerHTML = `
            <div class="item-image">
                ${metadata.image ? `<img src="${metadata.image}" alt="${metadata.title || 'Imagen de noticia'}">` : 
                '<div style="height: 150px; background-color: #f8f9fa; display: flex; align-items: center; justify-content: center; color: #aaa;">Sin imagen</div>'}
            </div>
            <div class="item-content">
                ${metadata.favicon ? `
                <div class="item-source">
                    <img src="${metadata.favicon}" alt="favicon" class="item-favicon">
                    <a href="${metadata.url}" target="_blank" class="external-link">Ver nota en la web <i class="fas fa-external-link-alt"></i></a>
                    <label class="favicon-toggle">
                        <input type="checkbox" class="show-favicon-checkbox" checked>
                        <span>Mostrar favicon</span>
                    </label>
                </div>` : `
                <div class="item-source">
                    <a href="${metadata.url}" target="_blank" class="external-link">Ver nota en la web <i class="fas fa-external-link-alt"></i></a>
                </div>`}
                <div class="item-title">
                    <div contenteditable="true">${metadata.title || 'Sin título'}</div>
                </div>
                <div class="item-description">
                    <div contenteditable="true">${metadata.description || 'Sin descripción'}</div>
                </div>
                <div class="item-actions">
                    <button class="edit-btn"><i class="fas fa-edit"></i> Editar</button>
                    <button class="move-category-btn"><i class="fas fa-exchange-alt"></i> Mover</button>
                    <button class="delete-btn"><i class="fas fa-trash"></i> Eliminar</button>
                </div>
                <div class="edit-controls">
                    <input type="text" class="edit-image-url" placeholder="URL de la imagen (dejar vacío para mantener actual)">
                    <div class="edit-controls-buttons">
                        <button class="confirm-edit-btn btn btn-primary">Guardar cambios</button>
                        <button class="cancel-edit-btn btn">Cancelar</button>
                    </div>
                </div>
                <div class="category-selector" style="display: none;">
                    <select class="category-select">
                        ${generateCategoryOptions(categoryId)}
                    </select>
                    <button class="confirm-move-btn">Confirmar</button>
                    <button class="cancel-move-btn">Cancelar</button>
                </div>
            </div>
        `;
        
        // Guardar el elemento en la estructura de datos
        const itemData = {
            id: metadata.id || Date.now().toString(),  // Usar el ID existente si está disponible
            title: metadata.title || 'Sin título',
            description: metadata.description || 'Sin descripción',
            image: metadata.image || '',
            url: metadata.url,
            favicon: metadata.favicon || '',
            showFavicon: true // Por defecto mostrar favicon
        };
        
        // Comprobar si este elemento ya existe en alguna categoría
        const isExistingItem = Object.values(categories).some(category => 
            category.items.some(item => item.id === itemData.id)
        );
        
        // Solo agregar a la estructura de datos si no es un elemento existente
        if (!isExistingItem) {
            categories[categoryId].items.push(itemData);
        }
        
        // Agregar evento para eliminar elemento
        itemElement.querySelector('.delete-btn').addEventListener('click', function() {
            container.removeChild(itemElement);
            // Eliminar el elemento de la estructura de datos
            const index = categories[categoryId].items.findIndex(item => item.id === itemData.id);
            if (index !== -1) {
                categories[categoryId].items.splice(index, 1);
            }
        });
        
        // Agregar evento para mostrar selector de categorías
        itemElement.querySelector('.move-category-btn').addEventListener('click', function() {
            const categorySelector = itemElement.querySelector('.category-selector');
            categorySelector.style.display = 'block';
            categorySelector.querySelector('.category-select').innerHTML = generateCategoryOptions(categoryId);
        });
        
        // Mover a otra categoría
        itemElement.querySelector('.confirm-move-btn').addEventListener('click', function() {
            const newCategoryId = itemElement.querySelector('.category-select').value;
            if (newCategoryId !== categoryId) {
                // Eliminar el elemento visualmente antes de moverlo
                container.removeChild(itemElement);
                moveItemToCategory(itemData, categoryId, newCategoryId);
            }
            itemElement.querySelector('.category-selector').style.display = 'none';
        });
        
        // Cancelar mover
        itemElement.querySelector('.cancel-move-btn').addEventListener('click', function() {
            itemElement.querySelector('.category-selector').style.display = 'none';
        });
        
        // Actualizar datos al editar contenido
        const titleElement = itemElement.querySelector('.item-title [contenteditable]');
        titleElement.addEventListener('input', function() {
            // Buscar el elemento en todas las categorías para asegurar que se actualiza correctamente
            Object.values(categories).forEach(category => {
                const item = category.items.find(item => item.id === itemData.id);
                if (item) {
                    item.title = this.textContent;
                }
            });
            
            // Notificar cambio para actualizar el HTML exportado
            if (exportResult.style.display === 'block') {
                const updateNotice = document.getElementById('updateNotice');
                if (updateNotice) updateNotice.style.display = 'block';
            }
        });
        
        // Añadir indicador visual de edición para el título
        titleElement.addEventListener('focus', function() {
            this.dataset.before = this.textContent;
            this.classList.add('editing');
        });
        
        titleElement.addEventListener('blur', function() {
            this.classList.remove('editing');
            // Mostrar indicador de guardado si hubo cambios
            if (this.dataset.before !== this.textContent) {
                showSavedIndicator(this);
            }
        });
        
        const descriptionElement = itemElement.querySelector('.item-description [contenteditable]');
        descriptionElement.addEventListener('input', function() {
            // Buscar el elemento en todas las categorías para asegurar que se actualiza correctamente
            Object.values(categories).forEach(category => {
                const item = category.items.find(item => item.id === itemData.id);
                if (item) {
                    item.description = this.textContent;
                }
            });
            
            // Notificar cambio para actualizar el HTML exportado
            if (exportResult.style.display === 'block') {
                const updateNotice = document.getElementById('updateNotice');
                if (updateNotice) updateNotice.style.display = 'block';
            }
        });
        
        // Añadir indicador visual de edición para la descripción
        descriptionElement.addEventListener('focus', function() {
            this.dataset.before = this.textContent;
            this.classList.add('editing');
        });
        
        descriptionElement.addEventListener('blur', function() {
            this.classList.remove('editing');
            // Mostrar indicador de guardado si hubo cambios
            if (this.dataset.before !== this.textContent) {
                showSavedIndicator(this);
            }
        });
        
        // Editar elemento (mostrar controles)
        itemElement.querySelector('.edit-btn').addEventListener('click', function() {
            const editControls = itemElement.querySelector('.edit-controls');
            editControls.style.display = 'block';
        });
        
        // Confirmar edición
        itemElement.querySelector('.confirm-edit-btn').addEventListener('click', function() {
            const newImageUrl = itemElement.querySelector('.edit-image-url').value.trim();
            
            if (newImageUrl && isValidURL(newImageUrl)) {
                // Actualizar imagen en el DOM
                const imgContainer = itemElement.querySelector('.item-image');
                imgContainer.innerHTML = `<img src="${newImageUrl}" alt="${itemData.title}">`;
                
                // Actualizar en los datos
                Object.values(categories).forEach(category => {
                    const item = category.items.find(item => item.id === itemData.id);
                    if (item) {
                        item.image = newImageUrl;
                    }
                });
                
                // Notificar cambio para actualizar el HTML exportado
                if (exportResult.style.display === 'block') {
                    const updateNotice = document.getElementById('updateNotice');
                    if (updateNotice) updateNotice.style.display = 'block';
                }
            }
            
            // Ocultar controles de edición
            itemElement.querySelector('.edit-controls').style.display = 'none';
            itemElement.querySelector('.edit-image-url').value = '';
        });
        
        // Cancelar edición
        itemElement.querySelector('.cancel-edit-btn').addEventListener('click', function() {
            itemElement.querySelector('.edit-controls').style.display = 'none';
            itemElement.querySelector('.edit-image-url').value = '';
        });
        
        // Evento para mostrar/ocultar favicon
        const showFaviconCheckbox = itemElement.querySelector('.show-favicon-checkbox');
        if (showFaviconCheckbox) {
            showFaviconCheckbox.addEventListener('change', function() {
                const faviconImg = itemElement.querySelector('.item-favicon');
                if (faviconImg) {
                    if (this.checked) {
                        faviconImg.style.display = 'inline-block';
                    } else {
                        faviconImg.style.display = 'none';
                    }
                    
                    // Actualizar el estado en la estructura de datos
                    Object.values(categories).forEach(category => {
                        const item = category.items.find(item => item.id === itemData.id);
                        if (item) {
                            item.showFavicon = this.checked;
                        }
                    });
                    
                    // Notificar cambio para actualizar el HTML exportado
                    if (exportResult.style.display === 'block') {
                        const updateNotice = document.getElementById('updateNotice');
                        if (updateNotice) updateNotice.style.display = 'block';
                    }
                }
            });
        }
        
        container.appendChild(itemElement);
    }
    
    // Función para añadir una nueva categoría
    function addCategory(categoryId, categoryName) {
        // Crear estructura de datos si no existe
        if (!categories[categoryId]) {
            categories[categoryId] = {
                name: categoryName,
                items: []
            };
        }
        
        // Añadir a la lista de categorías si no existe
        if (!document.querySelector(`.categories-list li[data-id="${categoryId}"]`)) {
            const categoryLi = document.createElement('li');
            categoryLi.dataset.id = categoryId;
            categoryLi.innerHTML = `
                <span class="category-name">${categoryName}</span>
                <div class="category-reorder-controls">
                    <button class="move-up-btn" title="Mover arriba"><i class="fas fa-chevron-up"></i></button>
                    <button class="move-down-btn" title="Mover abajo"><i class="fas fa-chevron-down"></i></button>
                </div>
            `;
            categoriesList.appendChild(categoryLi);
            
            // Añadir eventos de reordenamiento
            updateCategoryOrderButtons();
            
            // Añadir evento para mover hacia arriba
            categoryLi.querySelector('.move-up-btn').addEventListener('click', function(e) {
                e.stopPropagation();
                moveCategoryUp(categoryId);
            });
            
            // Añadir evento para mover hacia abajo
            categoryLi.querySelector('.move-down-btn').addEventListener('click', function(e) {
                e.stopPropagation();
                moveCategoryDown(categoryId);
            });
        }
        
        // Crear sección para categoría si no existe
        if (!document.getElementById(categoryId)) {
            const categorySection = document.createElement('div');
            categorySection.id = categoryId;
            categorySection.className = 'category-section';
            categorySection.innerHTML = `
                <div class="category-header">
                    <h2 contenteditable="true">${categoryName}</h2>
                    <div class="category-actions">
                        <button class="delete-category-btn"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
                <div class="category-controls">
                    <textarea class="category-url-input" placeholder="Ingrese uno o varios URLs (uno por línea)"></textarea>
                    <button class="category-add-btn btn btn-primary">Agregar Links</button>
                </div>
                <div class="items-container"></div>
            `;
            
            // Actualizar nombre de categoría al editar
            categorySection.querySelector('h2').addEventListener('input', function() {
                categories[categoryId].name = this.textContent;
                const categoryNameElement = document.querySelector(`.categories-list li[data-id="${categoryId}"] .category-name`);
                if (categoryNameElement) {
                    categoryNameElement.textContent = this.textContent;
                }
            });
            
            // Agregar evento para añadir enlaces directamente a esta categoría
            categorySection.querySelector('.category-add-btn').addEventListener('click', async function() {
                const urlInput = categorySection.querySelector('.category-url-input');
                const urls = urlInput.value.trim().split('\n').filter(url => url.trim() !== '');
                
                if (urls.length > 0) {
                    loadingOverlay.style.display = 'flex';
                    
                    for (const url of urls) {
                        if (isValidURL(url)) {
                            try {
                                const metadata = await fetchMetadata(url);
                                addClippingItem(metadata, categoryId);
                            } catch (error) {
                                console.error('Error fetching metadata:', error);
                                addClippingItem({
                                    title: 'No se pudo obtener el título',
                                    description: 'No se pudo obtener la descripción',
                                    image: '',
                                    url: url,
                                    favicon: getFaviconFromUrl(url)
                                }, categoryId);
                            }
                        }
                    }
                    
                    urlInput.value = '';
                    loadingOverlay.style.display = 'none';
                }
            });
            
            clippingArea.appendChild(categorySection);
        }
    }
    
    // Función para establecer la categoría activa
    function setActiveCategory(categoryId) {
        currentCategory = categoryId;
        
        // Actualizar lista de categorías
        document.querySelectorAll('.categories-list li').forEach(li => {
            li.classList.remove('active');
        });
        document.querySelector(`.categories-list li[data-id="${categoryId}"]`).classList.add('active');
        
        // Actualizar visualización de secciones
        document.querySelectorAll('.category-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(categoryId).classList.add('active');
    }
    
    // Función para eliminar una categoría
    function deleteCategory(categoryId) {
        if (confirm('¿Estás seguro de que deseas eliminar esta categoría y todas sus noticias?')) {
            // Eliminar estructura de datos
            delete categories[categoryId];
            
            // Eliminar del DOM
            document.querySelector(`.categories-list li[data-id="${categoryId}"]`).remove();
            document.getElementById(categoryId).remove();
            
            // Actualizar botones de orden
            updateCategoryOrderButtons();
            
            // Establecer categoría por defecto como activa
            setActiveCategory('defensoria');
        }
    }
    
    // Función para mover una categoría hacia arriba
    function moveCategoryUp(categoryId) {
        const categoryLi = document.querySelector(`.categories-list li[data-id="${categoryId}"]`);
        const previousLi = categoryLi.previousElementSibling;
        
        if (previousLi) {
            // Mover en la lista visual
            categoriesList.insertBefore(categoryLi, previousLi);
            
            // Mover sección en el DOM
            const categorySection = document.getElementById(categoryId);
            const previousSection = document.getElementById(previousLi.dataset.id);
            clippingArea.insertBefore(categorySection, previousSection);
            
            // Actualizar botones de ordenamiento
            updateCategoryOrderButtons();
        }
    }
    
    // Función para mover una categoría hacia abajo
    function moveCategoryDown(categoryId) {
        const categoryLi = document.querySelector(`.categories-list li[data-id="${categoryId}"]`);
        const nextLi = categoryLi.nextElementSibling;
        
        if (nextLi) {
            // Mover en la lista visual
            if (nextLi.nextElementSibling) {
                categoriesList.insertBefore(categoryLi, nextLi.nextElementSibling);
            } else {
                categoriesList.appendChild(categoryLi);
            }
            
            // Mover sección en el DOM
            const categorySection = document.getElementById(categoryId);
            const nextSection = document.getElementById(nextLi.dataset.id);
            if (nextSection.nextElementSibling) {
                clippingArea.insertBefore(categorySection, nextSection.nextElementSibling);
            } else {
                clippingArea.appendChild(categorySection);
            }
            
            // Actualizar botones de ordenamiento
            updateCategoryOrderButtons();
        }
    }
    
    // Función para actualizar el estado de los botones de orden
    function updateCategoryOrderButtons() {
        const categoryItems = categoriesList.querySelectorAll('li');
        
        categoryItems.forEach((item, index) => {
            const upBtn = item.querySelector('.move-up-btn');
            const downBtn = item.querySelector('.move-down-btn');
            
            // Deshabilitar/habilitar botón subir
            if (index === 0 || item.dataset.id === 'defensoria') {
                upBtn.disabled = true;
                upBtn.style.visibility = 'hidden';
            } else {
                upBtn.disabled = false;
                upBtn.style.visibility = 'visible';
            }
            
            // Deshabilitar/habilitar botón bajar
            if (index === categoryItems.length - 1) {
                downBtn.disabled = true;
                downBtn.style.visibility = 'hidden';
            } else {
                downBtn.disabled = false;
                downBtn.style.visibility = 'visible';
            }
            
            // Categoría por defecto no se mueve
            if (item.dataset.id === 'defensoria') {
                downBtn.disabled = true;
                downBtn.style.visibility = 'hidden';
            }
        });
    }
    
    // Función para mover un elemento a otra categoría
    function moveItemToCategory(itemData, fromCategoryId, toCategoryId) {
        // Eliminar de la categoría original
        const index = categories[fromCategoryId].items.findIndex(item => item.id === itemData.id);
        if (index !== -1) {
            categories[fromCategoryId].items.splice(index, 1);
        }
        
        // Añadir a la nueva categoría
        const movedItem = {...itemData};  // Crear una copia para evitar referencias cruzadas
        categories[toCategoryId].items.push(movedItem);
        
        // Recrear visualmente
        const itemMetadata = {
            title: itemData.title,
            description: itemData.description,
            image: itemData.image,
            url: itemData.url,
            id: itemData.id,  // Mantener el mismo ID para conservar la identidad del elemento
            favicon: itemData.favicon
        };
        
        addClippingItem(itemMetadata, toCategoryId);
    }
    
    // Generar opciones para selector de categorías
    function generateCategoryOptions(currentCategoryId) {
        let options = '';
        for (const categoryId in categories) {
            if (categoryId !== currentCategoryId) {
                options += `<option value="${categoryId}">${categories[categoryId].name}</option>`;
            }
        }
        return options;
    }
    
    // Función para generar el HTML exportable
    function generateExportableHTML() {
        let html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Clipping de Noticias</title>
    <style>
        body { font-family: arial, sans-serif; line-height: 1.6; color: #333; max-width: 700px; margin: auto auto; padding: 20px; width: 50%; }
        h1, h2 { color: #2c3e50; }
        h1 { border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 25px; }
        .category { margin: 30px auto; }
        .category-title { border-bottom: 2px solid #3498db; padding-bottom: 5px; margin-bottom: 20px; }
        .item { margin: 20px 0; padding-bottom: 20px; border-bottom: 1px solid #eee; display: flex; }
        .item-image-container{ margin-right: 15px; width: 150px; }
        .item-content { flex: 1; }
        .item-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; color: #333; }
        .item-description { margin-bottom: 10px; color: #555; }
        .item-image { max-width: 150px; height: auto; border: none; }
        .item-source { display: flex; align-items: center; margin-bottom: 8px; }
        .item-favicon { width: 16px; height: 16px; margin-right: 8px; }
        .item-source a { color: #666; font-size: 14px; text-decoration: none; margin-left: 5px; }
        .item-source a:hover { text-decoration: underline; }
        
        @media (max-width: 600px) {
            body { padding: 15px; width: 95%; }
            .item { flex-direction: column; }
            .item-image-container { margin-right: 0; margin-bottom: 15px; width: 100%; }
            .item-image { max-width: 100%; }
            h1 { font-size: 24px; }
            .category-title { font-size: 20px; }
            .item-title { font-size: 16px; }
        }
    
    </style>
</head>
<body>
<table role="presentation" width="80%" align="center" cellpadding="0" cellspacing="0" border="0"">
    <tr>
        <td align="left" style="padding: 20px; color: white;">
    <h1>Clipping de Noticias</h1>
`;

        // Agregar categorías en el orden que aparecen en la interfaz
        const categoryElements = document.querySelectorAll('.categories-list li');
        
        categoryElements.forEach(categoryElement => {
            const categoryId = categoryElement.dataset.id;
            const category = categories[categoryId];
            
            // Solo agregar categorías con elementos
            if (category && category.items.length > 0) {
                html += `
        <div class="category">
            <h2 class="category-title">${category.name}</h2>`;
                
                // Agregar cada elemento
                category.items.forEach(item => {
                    html += `
            <div class="item">`;
                    
                    if (item.image) {
                        html += `
                <div class="item-image-container">
                    <a href="${item.url}" target="_blank"><img class="item-image" src="${item.image}" alt="${item.title || 'Imagen de noticia'}"></a>
                </div>`;
                    }
                    
                    html += `
                <div class="item-content">`;
                    
                    if (item.favicon && item.showFavicon !== false) {
                        html += `
                    <div class="item-source">
                        <img src="${item.favicon}" alt="favicon" class="item-favicon">
                        <a href="${item.url}" target="_blank">Ver nota en la web</a>
                    </div>`;
                    } else {
                        html += `
                    <div class="item-source">
                        <a href="${item.url}" target="_blank">Ver nota en la web</a>
                    </div>`;
                    }
                    
                    html += `
                    <div class="item-title">${item.title}</div>
                    <div class="item-description">${item.description}</div>
                </div>
            </div>`;
                });
                
                html += `
        </div>`;
            }
        });
        
        html += `
  </td>
    </tr>
</table>
</body>
</html>`;
        
        return html;
    }
    
    // Función para verificar si una URL es válida
    function isValidURL(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }
    
    // Función para obtener metadatos de una URL
    async function fetchMetadata(url) {
        try {
            // Extraer el favicon de la URL
            const favicon = getFaviconFromUrl(url);
            
            // Manejar sitios específicos que requieren tratamiento especial
            if (url.includes('cnnespanol.cnn.com')) {
                const cnnData = await fetchCNNMetadata(url);
                cnnData.favicon = favicon;
                return cnnData;
            }
            
            // Proceso estándar para otros sitios
            const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
            const response = await fetch(proxyUrl);
            const data = await response.json();
            
            if (data.contents) {
                // Crear un DOM temporal para analizar el HTML
                const parser = new DOMParser();
                const doc = parser.parseFromString(data.contents, 'text/html');
                
                // Extraer metadatos
                const title = doc.querySelector('meta[property="og:title"]')?.content || 
                             doc.querySelector('meta[name="twitter:title"]')?.content || 
                             doc.querySelector('title')?.textContent || '';
                
                const description = doc.querySelector('meta[property="og:description"]')?.content || 
                                   doc.querySelector('meta[name="twitter:description"]')?.content || 
                                   doc.querySelector('meta[name="description"]')?.content || '';
                
                const image = doc.querySelector('meta[property="og:image"]')?.content || 
                             doc.querySelector('meta[name="twitter:image"]')?.content || '';
                
                return {
                    title,
                    description,
                    image,
                    url,
                    favicon
                };
            }
            
            throw new Error('No se pudo obtener el contenido de la URL');
        } catch (error) {
            console.error('Error fetching metadata:', error);
            return {
                title: 'No se pudo obtener el título',
                description: 'No se pudo obtener la descripción',
                image: '',
                url,
                favicon: getFaviconFromUrl(url)
            };
        }
    }

    // Función para extraer el favicon de una URL
    function getFaviconFromUrl(url) {
        try {
            const urlObj = new URL(url);
            return `${urlObj.protocol}//${urlObj.hostname}/favicon.ico`;
        } catch (e) {
            return '';
        }
    }

    // Función especializada para obtener metadatos de CNN Español
    async function fetchCNNMetadata(url) {
        try {
            // Usar un proxy alternativo para CNN Español
            const proxyUrl = `https://cors-anywhere.herokuapp.com/${url}`;
            
            try {
                const response = await fetch(proxyUrl);
                const html = await response.text();
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                
                // Extraer metadatos específicos de CNN
                const title = doc.querySelector('h1.storyfull__title')?.textContent || 
                             doc.querySelector('meta[property="og:title"]')?.content || 
                             'Artículo de CNN Español';
                
                const description = doc.querySelector('div.storyfull__details p')?.textContent || 
                                   doc.querySelector('meta[property="og:description"]')?.content || 
                                   'Descripción no disponible';
                
                const image = doc.querySelector('meta[property="og:image"]')?.content || 
                             doc.querySelector('.media__image img')?.src || '';
                
                return {
                    title,
                    description,
                    image,
                    url
                };
            } catch (corsError) {
                console.error('Error con proxy CORS Anywhere:', corsError);
                
                // Alternativa: usar un servicio de scraping JSON como respaldo
                const scrapingUrl = `https://api.scraperapi.com/?api_key=YOUR_API_KEY&url=${encodeURIComponent(url)}`;
                
                // Si no podemos usar un proxy real, extraer al menos los componentes del URL para generar información básica
                const urlParts = url.split('/');
                const possibleTitle = urlParts[urlParts.length - 1].replace(/-/g, ' ');
                
                return {
                    title: `CNN: ${possibleTitle}`,
                    description: 'No se pudo cargar la descripción completa del artículo de CNN Español',
                    image: 'https://cdn.cnn.com/cnn/.e/img/3.0/global/misc/cnn-logo.png',
                    url
                };
            }
        } catch (error) {
            console.error('Error fetching CNN metadata:', error);
            return {
                title: 'Artículo de CNN Español',
                description: 'No se pudo obtener el contenido del artículo',
                image: 'https://cdn.cnn.com/cnn/.e/img/3.0/global/misc/cnn-logo.png',
                url
            };
        }
    }
    
    // Función para mostrar un indicador de guardado
    function showSavedIndicator(element) {
        const savedIndicator = document.createElement('div');
        savedIndicator.className = 'saved-indicator';
        savedIndicator.textContent = ' Guardado';
        
        // Posicionar cerca del elemento
        const rect = element.getBoundingClientRect();
        savedIndicator.style.position = 'absolute';
        savedIndicator.style.top = `${window.scrollY + rect.bottom + 5}px`;
        savedIndicator.style.left = `${window.scrollX + rect.left}px`;
        
        document.body.appendChild(savedIndicator);
        
        // Animación de fade-out
        setTimeout(() => {
            savedIndicator.style.opacity = '0';
        }, 1000);
        
        // Eliminar después de la animación
        setTimeout(() => {
            document.body.removeChild(savedIndicator);
        }, 1500);
    }
    
    // Toggle between category view and list view
    viewToggleBtn.addEventListener('click', function() {
        isListView = !isListView;
        
        const sectionsContainer = document.querySelector('.sections-container');
        const clippingArea = document.querySelector('.clipping-area');
        const listViewContainer = document.getElementById('listViewContainer');
        
        if (isListView) {
            // Switch to list view
            sectionsContainer.classList.add('hidden');
            clippingArea.classList.add('hidden');
            listViewContainer.classList.add('active');
            viewToggleBtn.textContent = 'Ver por Categorías';
            
            // Generate list view content
            generateListView();
        } else {
            // Switch back to category view
            sectionsContainer.classList.remove('hidden');
            clippingArea.classList.remove('hidden');
            listViewContainer.classList.remove('active');
            viewToggleBtn.textContent = 'Ver Listado';
        }
    });

    // Function to generate list view content
    function generateListView() {
        const listViewContainer = document.getElementById('listViewContainer');
        listViewContainer.innerHTML = '';
        
        // Add controls for the list view
        const listViewControls = document.createElement('div');
        listViewControls.className = 'list-view-controls';
        
        const toggleDescriptionsBtn = document.createElement('button');
        toggleDescriptionsBtn.className = 'toggle-descriptions-btn';
        toggleDescriptionsBtn.textContent = showDescriptions ? 'Ocultar Descripciones' : 'Mostrar Descripciones';
        toggleDescriptionsBtn.addEventListener('click', function() {
            showDescriptions = !showDescriptions;
            this.textContent = showDescriptions ? 'Ocultar Descripciones' : 'Mostrar Descripciones';
            const descriptions = document.querySelectorAll('.list-view-item-description');
            descriptions.forEach(desc => {
                desc.style.display = showDescriptions ? 'block' : 'none';
            });
        });
        
        const toggleImagesBtn = document.createElement('button');
        toggleImagesBtn.className = 'toggle-images-btn';
        toggleImagesBtn.textContent = showImages ? 'Ocultar Imágenes' : 'Mostrar Imágenes';
        toggleImagesBtn.addEventListener('click', function() {
            showImages = !showImages;
            this.textContent = showImages ? 'Ocultar Imágenes' : 'Mostrar Imágenes';
            const images = document.querySelectorAll('.list-view-item-image');
            images.forEach(img => {
                img.style.display = showImages ? 'block' : 'none';
            });
        });
        
        const copyListViewBtn = document.createElement('button');
        copyListViewBtn.id = 'copyListViewBtn';
        copyListViewBtn.className = 'btn';
        copyListViewBtn.innerHTML = '<i class="fas fa-copy"></i> Copiar para Email';
        copyListViewBtn.addEventListener('click', function() {
            copyListViewContent();
        });
        
        listViewControls.appendChild(toggleDescriptionsBtn);
        listViewControls.appendChild(toggleImagesBtn);
        listViewControls.appendChild(copyListViewBtn);
        listViewContainer.appendChild(listViewControls);
        
        // Get categories in the order they appear in the sidebar
        const categoryElements = document.querySelectorAll('.categories-list li');
        
        categoryElements.forEach(categoryElement => {
            const categoryId = categoryElement.dataset.id;
            const category = categories[categoryId];
            
            // Only show categories with items
            if (category && category.items.length > 0) {
                const categoryContainer = document.createElement('div');
                categoryContainer.className = 'list-view-category';
                
                // Create category title
                const categoryTitle = document.createElement('h2');
                categoryTitle.className = 'list-view-category-title';
                categoryTitle.textContent = category.name;
                categoryContainer.appendChild(categoryTitle);
                
                // Add each item in the category
                category.items.forEach(item => {
                    const itemElement = document.createElement('div');
                    itemElement.className = 'list-view-item';
                    
                    // Add image if available
                    if (item.image) {
                        const itemImageContainer = document.createElement('div');
                        itemImageContainer.className = 'list-view-item-image';
                        itemImageContainer.style.display = showImages ? 'block' : 'none';
                        
                        const itemImage = document.createElement('img');
                        itemImage.src = item.image;
                        itemImage.alt = item.title;
                        
                        itemImageContainer.appendChild(itemImage);
                        itemElement.appendChild(itemImageContainer);
                    }
                    
                    const itemContent = document.createElement('div');
                    itemContent.className = 'list-view-item-content';
                    
                    // Create item title with source info
                    const itemTitle = document.createElement('div');
                    itemTitle.className = 'list-view-item-title';
                    
                    // Add favicon and source link
                    if (item.favicon && item.showFavicon !== false) {
                        const favicon = document.createElement('img');
                        favicon.src = item.favicon;
                        favicon.className = 'item-favicon';
                        favicon.style.verticalAlign = 'middle';
                        itemTitle.appendChild(favicon);
                    }
                    
                    // Add title as link (bold but without underline styling)
                    const titleLink = document.createElement('a');
                    titleLink.href = item.url;
                    titleLink.target = '_blank';
                    titleLink.textContent = item.title;
                    titleLink.style.textDecoration = 'none';
                    titleLink.style.fontWeight = 'bold';
                    titleLink.style.color = document.body.classList.contains('dark-mode') ? '#fff' : '#333';
                    titleLink.addEventListener('mouseenter', function() {
                        this.style.color = '#3498db';
                    });
                    titleLink.addEventListener('mouseleave', function() {
                        this.style.color = document.body.classList.contains('dark-mode') ? '#fff' : '#333';
                    });
                    itemTitle.appendChild(titleLink);
                    
                    // Add description
                    const itemDescription = document.createElement('div');
                    itemDescription.className = 'list-view-item-description';
                    itemDescription.textContent = item.description;
                    itemDescription.style.display = showDescriptions ? 'block' : 'none';
                    
                    itemContent.appendChild(itemTitle);
                    itemContent.appendChild(itemDescription);
                    itemElement.appendChild(itemContent);
                    categoryContainer.appendChild(itemElement);
                });
                
                listViewContainer.appendChild(categoryContainer);
            }
        });
    }

    // Function to copy list view content to clipboard
    function copyListViewContent() {
        // Create a formatted version for email
        let emailContent = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; width: 70%; color: #333;">
            <h1 style="color: #2c3e50; padding-bottom: 10px; border-bottom: 1px solid #eee;">Clipping de Noticias</h1>`;
            
        // Get categories in the order they appear in the sidebar
        const categoryElements = document.querySelectorAll('.categories-list li');
        
        categoryElements.forEach(categoryElement => {
            const categoryId = categoryElement.dataset.id;
            const category = categories[categoryId];
            
            // Only include categories with items
            if (category && category.items.length > 0) {
                emailContent += `<div style="margin: 30px 0;">
                    <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 5px;">${category.name}</h2>`;
                
                category.items.forEach(item => {
                    emailContent += `<div style="margin: 20px 0; padding-bottom: 20px; border-bottom: 1px solid #eee; display: flex;">`;
                    
                    // Include image if it exists and images are shown
                    if (item.image && showImages) {
                        emailContent += `<div style="margin-right: 15px; width: 150px;">
                            <a href="${item.url}" target="_blank" style="text-decoration: none;">
                                <img src="${item.image}" alt="${item.title}" style="max-width: 150px; border: none;">
                            </a>
                        </div>`;
                    }
                    
                    emailContent += `<div style="flex: 1;">`;
                    
                    // Add favicon and source link
                    if (item.favicon && item.showFavicon !== false) {
                        emailContent += `<div style="display: flex; align-items: center; margin-bottom: 8px;">
                            <img src="${item.favicon}" alt="favicon" style="width: 16px; height: 16px; margin-right: 8px;">
                            <a href="${item.url}" target="_blank" style="color: #666; font-size: 14px; text-decoration: none;">Ver nota en la web</a>
                        </div>`;
                    } else {
                        emailContent += `<div style="margin-bottom: 8px;">
                            <a href="${item.url}" target="_blank" style="color: #666; font-size: 14px; text-decoration: none;">Ver nota en la web</a>
                        </div>`;
                    }
                    
                    // Add title
                    emailContent += `<div style="font-size: 18px; font-weight: bold; margin-bottom: 10px; color: #333;">${item.title}</div>`;
                    
                    // Add description if descriptions are shown
                    if (showDescriptions) {
                        emailContent += `<div style="margin-bottom: 10px; color: #555;">${item.description}</div>`;
                    }
                    
                    emailContent += `</div></div>`;
                });
                
                emailContent += `</div>`;
            }
        });
        
        emailContent += `</div>`;
        
        // Create a temporary element to copy from
        const tempElement = document.createElement('div');
        tempElement.innerHTML = emailContent;
        document.body.appendChild(tempElement);
        
        // Create a range and selection
        const range = document.createRange();
        range.selectNode(tempElement);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        
        // Copy the content
        try {
            document.execCommand('copy');
            alert('Contenido copiado para email correctamente');
        } catch (err) {
            console.error('Error al copiar: ', err);
            alert('Error al copiar el contenido');
        }
        
        // Clean up
        selection.removeAllRanges();
        document.body.removeChild(tempElement);
    }
    
    // Inicializar categorías predeterminadas
    function initializeDefaultCategories() {
        // Añadir las categorías predefinidas en orden
        addCategory('defensoria', 'Defensoría');
        addCategory('otras_defensorias', 'Otras Defensorías');
        addCategory('gcaba', 'GCABA');
        addCategory('legislatura', 'LEGISLATURA');
        addCategory('nacionales', 'NACIONALES');
        
        // Establecer primera categoría como activa
        setActiveCategory('defensoria');
        
        // Inicializar botones de orden
        updateCategoryOrderButtons();
    }
    
    // Inicializar categorías predeterminadas
    initializeDefaultCategories();

    // Export data as JSON
    exportJsonBtn.addEventListener('click', function() {
        const data = JSON.stringify(categories, null, 2);
        const timestamp = getTimestamp();
        downloadFile(data, `clipping_${timestamp}.json`, 'application/json');
    });

    // Export data as XML
    exportXmlBtn.addEventListener('click', function() {
        const xmlData = generateXML(categories);
        const timestamp = getTimestamp();
        downloadFile(xmlData, `clipping_${timestamp}.xml`, 'application/xml');
    });

    // Import data from file
    importBtn.addEventListener('click', function() {
        if (!importFileInput.files.length) {
            alert('Por favor, seleccione un archivo para importar');
            return;
        }

        const file = importFileInput.files[0];
        const reader = new FileReader();

        reader.onload = function(e) {
            try {
                const fileExt = file.name.split('.').pop().toLowerCase();
                if (fileExt === 'json') {
                    // Import JSON data
                    const importedData = JSON.parse(e.target.result);
                    importCategories(importedData);
                } else if (fileExt === 'xml') {
                    // Import XML data
                    const parser = new DOMParser();
                    const xmlDoc = parser.parseFromString(e.target.result, "text/xml");
                    const importedData = parseXML(xmlDoc);
                    importCategories(importedData);
                } else {
                    throw new Error('Formato de archivo no soportado');
                }
                
                alert('Datos importados correctamente');
                // Reset categories display
                refreshCategoriesDisplay();
                
            } catch (error) {
                console.error('Error importing data:', error);
                alert('Error al importar datos: ' + error.message);
            }
        };

        if (file.name.endsWith('.json')) {
            reader.readAsText(file);
        } else if (file.name.endsWith('.xml')) {
            reader.readAsText(file);
        } else {
            alert('Por favor, seleccione un archivo JSON o XML');
        }
    });

    // Generate XML from categories data
    function generateXML(categories) {
        let xml = '<?xml version="1.0" encoding="UTF-8" ?>\n';
        xml += '<clipping>\n';
        
        // Add each category
        for (const categoryId in categories) {
            const category = categories[categoryId];
            xml += `  <category id="${categoryId}">\n`;
            xml += `    <name>${escapeXML(category.name)}</name>\n`;
            
            // Add items in the category
            if (category.items && category.items.length > 0) {
                xml += '    <items>\n';
                category.items.forEach(item => {
                    xml += '      <item>\n';
                    xml += `        <id>${item.id || ''}</id>\n`;
                    xml += `        <title>${escapeXML(item.title || '')}</title>\n`;
                    xml += `        <description>${escapeXML(item.description || '')}</description>\n`;
                    xml += `        <image>${escapeXML(item.image || '')}</image>\n`;
                    xml += `        <url>${escapeXML(item.url || '')}</url>\n`;
                    xml += `        <favicon>${escapeXML(item.favicon || '')}</favicon>\n`;
                    xml += `        <showFavicon>${item.showFavicon !== false}</showFavicon>\n`;
                    xml += '      </item>\n';
                });
                xml += '    </items>\n';
            }
            
            xml += '  </category>\n';
        }
        
        xml += '</clipping>';
        return xml;
    }

    // Parse XML to categories object
    function parseXML(xmlDoc) {
        const importedData = {};
        const categoryNodes = xmlDoc.getElementsByTagName('category');
        
        for (let i = 0; i < categoryNodes.length; i++) {
            const categoryNode = categoryNodes[i];
            const categoryId = categoryNode.getAttribute('id');
            const nameNode = categoryNode.getElementsByTagName('name')[0];
            
            importedData[categoryId] = {
                name: nameNode.textContent,
                items: []
            };
            
            const itemsNode = categoryNode.getElementsByTagName('items')[0];
            if (itemsNode) {
                const itemNodes = itemsNode.getElementsByTagName('item');
                for (let j = 0; j < itemNodes.length; j++) {
                    const itemNode = itemNodes[j];
                    const item = {
                        id: getNodeText(itemNode, 'id'),
                        title: getNodeText(itemNode, 'title'),
                        description: getNodeText(itemNode, 'description'),
                        image: getNodeText(itemNode, 'image'),
                        url: getNodeText(itemNode, 'url'),
                        favicon: getNodeText(itemNode, 'favicon'),
                        showFavicon: getNodeText(itemNode, 'showFavicon') === 'true'
                    };
                    importedData[categoryId].items.push(item);
                }
            }
        }
        
        return importedData;
    }

    // Helper function to get text content of an XML node
    function getNodeText(parentNode, tagName) {
        const node = parentNode.getElementsByTagName(tagName)[0];
        return node ? node.textContent : '';
    }

    // Escape XML special characters
    function escapeXML(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

    // Import categories from imported data
    function importCategories(importedData) {
        // Clear current categories
        categories = importedData;
        
        // Re-render categories in the UI
        categoriesList.innerHTML = '';
        clippingArea.innerHTML = '';
        
        for (const categoryId in categories) {
            const category = categories[categoryId];
            addCategory(categoryId, category.name);
            
            // Add items to this category
            if (category.items && category.items.length > 0) {
                category.items.forEach(item => {
                    addClippingItem(item, categoryId);
                });
            }
        }
        
        // Set the first category as active
        const firstCategoryId = Object.keys(categories)[0] || 'defensoria';
        setActiveCategory(firstCategoryId);
    }

    // Refresh categories display after import
    function refreshCategoriesDisplay() {
        categoriesList.innerHTML = '';
        clippingArea.innerHTML = '';
        
        for (const categoryId in categories) {
            const category = categories[categoryId];
            addCategory(categoryId, category.name);
            
            // Add items to this category
            if (category.items && category.items.length > 0) {
                category.items.forEach(item => {
                    addClippingItem(item, categoryId);
                });
            }
        }
        
        // Set the first category as active
        const firstCategoryId = Object.keys(categories)[0] || 'defensoria';
        setActiveCategory(firstCategoryId);
        updateCategoryOrderButtons();
    }

    // Download file function
    function downloadFile(content, fileName, contentType) {
        const a = document.createElement('a');
        const file = new Blob([content], {type: contentType});
        a.href = URL.createObjectURL(file);
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(a.href);
    }

    // Get timestamp for filename
    function getTimestamp() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        
        return `${year}${month}${day}_${hours}${minutes}`;
    }
});
