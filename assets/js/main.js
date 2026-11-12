/**
 * ============================================================================
 * FLEX & BANNER PRINTING SHOP — MAIN FRONTEND APPLICATION SCRIPT (ES6)
 * ============================================================================
 * Pure Vanilla JavaScript (No external JS frameworks)
 * Features:
 *   1. Sticky Header & Accessible Mobile Navigation
 *   2. Product Category Filtering & URL Parameter Sync (products.html)
 *   3. Request Quote Pre-Selection & Draft Persistence (contact.html)
 *   4. Comprehensive Form & Artwork File Validation (contact.html)
 *   5. Configurable WhatsApp Enquiry Integration (Global / Modal / Form)
 *   6. Printable Rate Card Handler (rate-card.html)
 *   7. Scroll Reveal & Back-to-Top Interactions
 * ============================================================================
 */

(() => {
  'use strict';

  /* --------------------------------------------------------------------------
   * 1. BUSINESS OWNER CONFIGURATION (EDITABLE PLACEHOLDERS)
   * --------------------------------------------------------------------------
   * Replace `phoneNumber` below with the actual business WhatsApp number
   * in international format without '+' or spaces (e.g. "919876543210").
   * By default it is left empty ("") so no fake number is invented.
   * -------------------------------------------------------------------------- */
  const WHATSAPP_CONFIG = {
    phoneNumber: '', // <-- Business Owner: Enter real WhatsApp number here (e.g. "919876543210")
    storageKey: 'fbp_configured_whatsapp_number',
    businessName: 'FLEX & BANNER PRINTING SHOP'
  };

  const STORAGE_KEYS = {
    enquiryDraft: 'fbp_enquiry_draft_v1',
    enquiryHistory: 'fbp_enquiry_submissions_v1'
  };

  const ALLOWED_ARTWORK_EXTENSIONS = [
    '.pdf', '.ai', '.eps', '.psd', '.cdr',
    '.png', '.jpg', '.jpeg', '.webp', '.tif', '.tiff', '.svg', '.zip'
  ];
  const MAX_ARTWORK_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB local validation limit

  /* --------------------------------------------------------------------------
   * 2. HELPER UTILITIES
   * -------------------------------------------------------------------------- */
  function getConfiguredWhatsAppNumber() {
    if (WHATSAPP_CONFIG.phoneNumber && WHATSAPP_CONFIG.phoneNumber.trim() !== '') {
      return WHATSAPP_CONFIG.phoneNumber.replace(/\D/g, '');
    }
    try {
      const saved = localStorage.getItem(WHATSAPP_CONFIG.storageKey) || '';
      return saved.replace(/\D/g, '');
    } catch {
      return '';
    }
  }

  function buildWhatsAppMessage(data) {
    const customerName = (data.fullName || '[Your Name]').trim();
    const selectedProduct = (
      data.customProductName ||
      data.productCategoryLabel ||
      data.productCategory ||
      'General Printing Enquiry'
    ).trim();
    const size = (data.printingSize || 'To be discussed').trim();
    const quantity = (data.quantity || '1').toString().trim();
    const material = (data.materialPreference || 'Standard / Recommended').trim();
    const designStatus = (data.designAvailable || 'Not specified').trim();
    const additional = (data.additionalRequirements || 'Please share quotation and material options.').trim();

    return [
      `Hello *${WHATSAPP_CONFIG.businessName}*,`,
      `I would like to request a printing quotation:`,
      ``,
      `• *Customer Name:* ${customerName}`,
      `• *Selected Product:* ${selectedProduct}`,
      `• *Printing Size:* ${size}`,
      `• *Material Preference:* ${material}`,
      `• *Quantity:* ${quantity}`,
      `• *Design Available:* ${designStatus}`,
      `• *Additional Requirements:* ${additional}`
    ].join('\n');
  }

  /* --------------------------------------------------------------------------
   * 3. STICKY HEADER & MOBILE NAVIGATION
   * -------------------------------------------------------------------------- */
  function initNavigation() {
    const header = document.querySelector('.site-header');
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');

    // Sticky compact state on scroll
    const handleScroll = () => {
      if (!header) return;
      if (window.scrollY > 24) {
        header.classList.add('is-scrolled');
      } else {
        header.classList.remove('is-scrolled');
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    if (!navToggle || !navMenu) return;

    const closeMenu = () => {
      navMenu.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
      const icon = navToggle.querySelector('i');
      if (icon) {
        icon.className = 'bi bi-list';
      }
    };

    const openMenu = () => {
      navMenu.classList.add('is-open');
      navToggle.setAttribute('aria-expanded', 'true');
      const icon = navToggle.querySelector('i');
      if (icon) {
        icon.className = 'bi bi-x-lg';
      }
    };

    navToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = navMenu.classList.contains('is-open');
      if (isOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    // Close menu when any nav link or CTA inside it is clicked
    navMenu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        closeMenu();
      });
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (
        navMenu.classList.contains('is-open') &&
        !navMenu.contains(e.target) &&
        !navToggle.contains(e.target)
      ) {
        closeMenu();
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navMenu.classList.contains('is-open')) {
        closeMenu();
        navToggle.focus();
      }
    });
  }

  /* --------------------------------------------------------------------------
   * 4. PRODUCTS PAGE CATEGORY FILTERING (products.html)
   * -------------------------------------------------------------------------- */
  function initProductFilters() {
    const filterButtons = document.querySelectorAll('[data-filter]');
    const productCards = document.querySelectorAll('.product-card[data-category]');
    const filterCountEl = document.getElementById('filterCount');

    if (!filterButtons.length || !productCards.length) return;

    const applyFilter = (categoryValue, updateUrl = false) => {
      const normalized = (categoryValue || 'all').toLowerCase().trim();
      let visibleCount = 0;

      filterButtons.forEach((btn) => {
        const isMatch = btn.getAttribute('data-filter') === normalized;
        btn.classList.toggle('is-active', isMatch);
        btn.setAttribute('aria-pressed', isMatch ? 'true' : 'false');
      });

      productCards.forEach((card) => {
        const cardCat = (card.getAttribute('data-category') || '').toLowerCase();
        const shouldShow = normalized === 'all' || cardCat === normalized;
        if (shouldShow) {
          card.removeAttribute('hidden');
          visibleCount += 1;
        } else {
          card.setAttribute('hidden', 'hidden');
        }
      });

      if (filterCountEl) {
        const activeBtn = document.querySelector(`[data-filter="${normalized}"]`);
        const label = activeBtn ? activeBtn.textContent.trim() : 'All Products';
        filterCountEl.textContent = `Showing ${visibleCount} of ${productCards.length} Products (${label})`;
      }

      if (updateUrl && window.history && window.history.replaceState) {
        const url = new URL(window.location.href);
        if (normalized === 'all') {
          url.searchParams.delete('category');
        } else {
          url.searchParams.set('category', normalized);
        }
        window.history.replaceState({}, '', url.toString());
      }
    };

    filterButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const selectedCategory = btn.getAttribute('data-filter') || 'all';
        applyFilter(selectedCategory, true);
      });
    });

    // Check URL query parameter on initial load (e.g., products.html?category=flex-banners)
    const params = new URLSearchParams(window.location.search);
    const initialCat = params.get('category');
    if (initialCat) {
      const matchingBtn = document.querySelector(`[data-filter="${initialCat.toLowerCase()}"]`);
      if (matchingBtn) {
        applyFilter(initialCat.toLowerCase(), false);
        const toolbar = document.querySelector('.filter-toolbar');
        if (toolbar) {
          setTimeout(() => {
            toolbar.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 120);
        }
        return;
      }
    }

    applyFilter('all', false);
  }

  /* --------------------------------------------------------------------------
   * 5. RATE CARD PRINT & QUICK ACTIONS (rate-card.html)
   * -------------------------------------------------------------------------- */
  function initRateCard() {
    const printButtons = document.querySelectorAll('[data-action="print-rate-card"]');
    printButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        window.print();
      });
    });
  }

  /* --------------------------------------------------------------------------
   * 6. WHATSAPP ENQUIRY MODAL & HANDLER
   * -------------------------------------------------------------------------- */
  function initWhatsAppIntegration() {
    const modalBackdrop = document.getElementById('waModalBackdrop');
    const modalCloseBtn = document.getElementById('waModalClose');
    const modalPreviewEl = document.getElementById('waModalPreview');
    const modalNumberInput = document.getElementById('waConfigNumberInput');
    const modalLaunchBtn = document.getElementById('waModalLaunchBtn');
    const modalCopyBtn = document.getElementById('waModalCopyBtn');
    const modalStatusMsg = document.getElementById('waModalStatusMsg');

    let currentMessagePayload = '';

    const collectFormContextIfAvailable = () => {
      const form = document.getElementById('printingEnquiryForm');
      if (!form) {
        return {
          fullName: '',
          productCategory: 'Custom Printing Project',
          customProductName: '',
          printingSize: 'Custom Size',
          materialPreference: 'Standard Studio Media',
          quantity: '1',
          designAvailable: 'Yes',
          additionalRequirements: 'Please share pricing and material options.'
        };
      }

      const categorySelect = form.querySelector('#productCategory');
      const categoryLabel =
        categorySelect && categorySelect.selectedIndex > 0
          ? categorySelect.options[categorySelect.selectedIndex].text
          : '';

      const checkedDesign = form.querySelector('input[name="designAvailable"]:checked');

      return {
        fullName: (form.querySelector('#fullName')?.value || '').trim(),
        productCategory: (categorySelect?.value || '').trim(),
        productCategoryLabel: categoryLabel,
        customProductName: (form.querySelector('#customProductName')?.value || '').trim(),
        printingSize: (form.querySelector('#printingSize')?.value || '').trim(),
        materialPreference: (form.querySelector('#materialPreference')?.value || '').trim(),
        quantity: (form.querySelector('#quantity')?.value || '').trim(),
        designAvailable: checkedDesign ? checkedDesign.value : '',
        additionalRequirements: (form.querySelector('#additionalRequirements')?.value || '').trim()
      };
    };

    const openWhatsAppDialog = (customData = null) => {
      const payloadData = customData || collectFormContextIfAvailable();
      currentMessagePayload = buildWhatsAppMessage(payloadData);

      const configuredNumber = getConfiguredWhatsAppNumber();

      // If a real number is already configured in WHATSAPP_CONFIG.phoneNumber, open directly
      if (WHATSAPP_CONFIG.phoneNumber && WHATSAPP_CONFIG.phoneNumber.trim() !== '') {
        const cleanNum = WHATSAPP_CONFIG.phoneNumber.replace(/\D/g, '');
        const waUrl = `https://wa.me/${cleanNum}?text=${encodeURIComponent(currentMessagePayload)}`;
        window.open(waUrl, '_blank', 'noopener,noreferrer');
        return;
      }

      // Otherwise show the configurable WhatsApp modal so no fake number is invented
      if (!modalBackdrop) return;
      if (modalPreviewEl) {
        modalPreviewEl.textContent = currentMessagePayload;
      }
      if (modalNumberInput) {
        modalNumberInput.value = configuredNumber;
      }
      if (modalStatusMsg) {
        modalStatusMsg.textContent = '';
      }
      modalBackdrop.removeAttribute('hidden');
      modalNumberInput?.focus();
    };

    const closeWhatsAppDialog = () => {
      if (!modalBackdrop) return;
      modalBackdrop.setAttribute('hidden', 'hidden');
    };

    // Bind all [data-whatsapp-trigger] buttons across pages
    document.querySelectorAll('[data-whatsapp-trigger]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const presetProduct = btn.getAttribute('data-wa-product');
        if (presetProduct) {
          openWhatsAppDialog({
            fullName: '',
            customProductName: presetProduct,
            printingSize: btn.getAttribute('data-wa-size') || 'Custom Size',
            quantity: '1',
            additionalRequirements: 'Enquiring from the Rate Card / Website.'
          });
        } else {
          openWhatsAppDialog();
        }
      });
    });

    if (modalCloseBtn) {
      modalCloseBtn.addEventListener('click', closeWhatsAppDialog);
    }

    if (modalBackdrop) {
      modalBackdrop.addEventListener('click', (e) => {
        if (e.target === modalBackdrop) {
          closeWhatsAppDialog();
        }
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modalBackdrop && !modalBackdrop.hasAttribute('hidden')) {
        closeWhatsAppDialog();
      }
    });

    if (modalCopyBtn) {
      modalCopyBtn.addEventListener('click', () => {
        if (!currentMessagePayload) return;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(currentMessagePayload).then(() => {
            if (modalStatusMsg) {
              modalStatusMsg.textContent = 'Formatted WhatsApp enquiry message copied to clipboard!';
              modalStatusMsg.style.color = '#15803D';
            }
          });
        }
      });
    }

    if (modalLaunchBtn) {
      modalLaunchBtn.addEventListener('click', () => {
        const rawNumber = modalNumberInput ? modalNumberInput.value.trim() : '';
        const digitsOnly = rawNumber.replace(/\D/g, '');
        if (digitsOnly.length < 10 || digitsOnly.length > 15) {
          if (modalStatusMsg) {
            modalStatusMsg.textContent =
              'Please enter the shop owner WhatsApp number (10–15 digits, e.g. 919876543210) to open WhatsApp.';
            modalStatusMsg.style.color = '#D92D20';
          }
          modalNumberInput?.focus();
          return;
        }
        try {
          localStorage.setItem(WHATSAPP_CONFIG.storageKey, digitsOnly);
        } catch {
          // Ignore storage errors
        }
        const waUrl = `https://wa.me/${digitsOnly}?text=${encodeURIComponent(currentMessagePayload)}`;
        window.open(waUrl, '_blank', 'noopener,noreferrer');
        closeWhatsAppDialog();
      });
    }

    // Expose helper for the confirmation box button
    window.__openPrintingWhatsApp = openWhatsAppDialog;
  }

  /* --------------------------------------------------------------------------
   * 7. CONTACT & ORDER ENQUIRY FORM VALIDATION & PRESELECTION (contact.html)
   * -------------------------------------------------------------------------- */
  function initEnquiryForm() {
    const form = document.getElementById('printingEnquiryForm');
    if (!form) return;

    const fullNameInput = document.getElementById('fullName');
    const phoneInput = document.getElementById('phone');
    const emailInput = document.getElementById('email');
    const categorySelect = document.getElementById('productCategory');
    const customProductInput = document.getElementById('customProductName');
    const printingSizeInput = document.getElementById('printingSize');
    const materialSelect = document.getElementById('materialPreference');
    const quantityInput = document.getElementById('quantity');
    const requiredDateInput = document.getElementById('requiredDate');
    const additionalInput = document.getElementById('additionalRequirements');
    const artworkInput = document.getElementById('artworkUpload');
    const artworkFileInfo = document.getElementById('artworkFileInfo');
    const confirmationBox = document.getElementById('formConfirmation');
    const confirmationSummary = document.getElementById('formConfirmationSummary');
    const resetAfterSubmitBtn = document.getElementById('resetEnquiryFormBtn');
    const sendConfirmedWaBtn = document.getElementById('sendConfirmedWaBtn');
    const preselectBanner = document.getElementById('preselectNotice');
    const preselectBannerText = document.getElementById('preselectNoticeText');

    // Set minimum date on requiredDateInput to today
    if (requiredDateInput) {
      const todayIso = new Date().toISOString().split('T')[0];
      requiredDateInput.setAttribute('min', todayIso);
    }

    // 1) Restore saved draft from localStorage first
    try {
      const savedDraftRaw = localStorage.getItem(STORAGE_KEYS.enquiryDraft);
      if (savedDraftRaw) {
        const draft = JSON.parse(savedDraftRaw);
        if (draft.fullName && fullNameInput) fullNameInput.value = draft.fullName;
        if (draft.phone && phoneInput) phoneInput.value = draft.phone;
        if (draft.email && emailInput) emailInput.value = draft.email;
        if (draft.productCategory && categorySelect) categorySelect.value = draft.productCategory;
        if (draft.customProductName && customProductInput) customProductInput.value = draft.customProductName;
        if (draft.printingSize && printingSizeInput) printingSizeInput.value = draft.printingSize;
        if (draft.materialPreference && materialSelect) materialSelect.value = draft.materialPreference;
        if (draft.quantity && quantityInput) quantityInput.value = draft.quantity;
        if (draft.additionalRequirements && additionalInput) additionalInput.value = draft.additionalRequirements;
      }
    } catch {
      // Ignore storage parse issues
    }

    // 2) Pre-populate from URL query parameters (overrides draft for product fields)
    const params = new URLSearchParams(window.location.search);
    const paramCategory = params.get('category');
    const paramProduct = params.get('product');
    const paramSize = params.get('size');
    const paramMaterial = params.get('material');

    if (paramCategory || paramProduct || paramSize || paramMaterial) {
      if (paramCategory && categorySelect) {
        const matchingOption = Array.from(categorySelect.options).find(
          (opt) => opt.value.toLowerCase() === paramCategory.toLowerCase()
        );
        if (matchingOption) {
          categorySelect.value = matchingOption.value;
        }
      }
      if (paramProduct && customProductInput) {
        customProductInput.value = paramProduct;
      }
      if (paramSize && printingSizeInput) {
        printingSizeInput.value = paramSize;
      }
      if (paramMaterial && materialSelect) {
        // Check if option exists; otherwise add it dynamically so preselection always works cleanly
        const existingMat = Array.from(materialSelect.options).find(
          (opt) => opt.value.toLowerCase() === paramMaterial.toLowerCase()
        );
        if (existingMat) {
          materialSelect.value = existingMat.value;
        } else {
          const customOpt = document.createElement('option');
          customOpt.value = paramMaterial;
          customOpt.textContent = `${paramMaterial} (Selected Spec)`;
          materialSelect.appendChild(customOpt);
          materialSelect.value = paramMaterial;
        }
      }

      if (preselectBanner && preselectBannerText) {
        const labelText = paramProduct || paramCategory || 'Selected Printing Product';
        preselectBannerText.textContent = `Pre-selected for your enquiry: "${labelText}". Complete your details below to generate your custom quote request.`;
        preselectBanner.removeAttribute('hidden');
      }
    }

    // Save draft on input
    const saveDraft = () => {
      try {
        const payload = {
          fullName: fullNameInput?.value || '',
          phone: phoneInput?.value || '',
          email: emailInput?.value || '',
          productCategory: categorySelect?.value || '',
          customProductName: customProductInput?.value || '',
          printingSize: printingSizeInput?.value || '',
          materialPreference: materialSelect?.value || '',
          quantity: quantityInput?.value || '',
          additionalRequirements: additionalInput?.value || ''
        };
        localStorage.setItem(STORAGE_KEYS.enquiryDraft, JSON.stringify(payload));
      } catch {
        // Ignore storage errors
      }
    };

    form.addEventListener('input', saveDraft);

    // Error display helpers
    const setFieldError = (inputEl, errorId, message) => {
      const errorEl = document.getElementById(errorId);
      if (message) {
        if (inputEl) inputEl.setAttribute('aria-invalid', 'true');
        if (errorEl) {
          errorEl.textContent = message;
          errorEl.classList.add('is-visible');
        }
        return false;
      } else {
        if (inputEl) inputEl.setAttribute('aria-invalid', 'false');
        if (errorEl) {
          errorEl.textContent = '';
          errorEl.classList.remove('is-visible');
        }
        return true;
      }
    };

    // Individual Field Validators
    const validateFullName = () => {
      const val = (fullNameInput?.value || '').trim();
      if (!val) return setFieldError(fullNameInput, 'fullNameError', 'Please enter your full name.');
      if (val.length < 2) return setFieldError(fullNameInput, 'fullNameError', 'Name must be at least 2 characters.');
      return setFieldError(fullNameInput, 'fullNameError', '');
    };

    const validatePhone = () => {
      const val = (phoneInput?.value || '').trim();
      if (!val) return setFieldError(phoneInput, 'phoneError', 'Please enter your phone number.');
      const digits = val.replace(/\D/g, '');
      if (digits.length < 10 || digits.length > 15) {
        return setFieldError(phoneInput, 'phoneError', 'Please enter a valid 10 to 15-digit phone number.');
      }
      return setFieldError(phoneInput, 'phoneError', '');
    };

    const validateEmail = () => {
      const val = (emailInput?.value || '').trim();
      if (!val) return setFieldError(emailInput, 'emailError', 'Please enter your email address.');
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
      if (!emailRegex.test(val)) {
        return setFieldError(emailInput, 'emailError', 'Please enter a valid email address (e.g. name@domain.com).');
      }
      return setFieldError(emailInput, 'emailError', '');
    };

    const validateCategory = () => {
      const val = (categorySelect?.value || '').trim();
      if (!val) return setFieldError(categorySelect, 'productCategoryError', 'Please select a product category.');
      return setFieldError(categorySelect, 'productCategoryError', '');
    };

    const validatePrintingSize = () => {
      const val = (printingSizeInput?.value || '').trim();
      if (!val) {
        return setFieldError(
          printingSizeInput,
          'printingSizeError',
          'Please specify the required printing dimensions or standard size.'
        );
      }
      return setFieldError(printingSizeInput, 'printingSizeError', '');
    };

    const validateQuantity = () => {
      const raw = (quantityInput?.value || '').trim();
      if (!raw) return setFieldError(quantityInput, 'quantityError', 'Please enter the required print quantity.');
      const num = Number(raw);
      if (!Number.isInteger(num) || num < 1) {
        return setFieldError(quantityInput, 'quantityError', 'Quantity must be a whole number of at least 1.');
      }
      return setFieldError(quantityInput, 'quantityError', '');
    };

    const validateRequiredDate = () => {
      const val = (requiredDateInput?.value || '').trim();
      if (!val) return setFieldError(requiredDateInput, 'requiredDateError', 'Please select your target required date.');
      const selectedDate = new Date(`${val}T00:00:00`);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (isNaN(selectedDate.getTime()) || selectedDate < today) {
        return setFieldError(requiredDateInput, 'requiredDateError', 'Required date cannot be in the past.');
      }
      return setFieldError(requiredDateInput, 'requiredDateError', '');
    };

    const validateDesignAvailable = () => {
      const checked = form.querySelector('input[name="designAvailable"]:checked');
      if (!checked) {
        return setFieldError(null, 'designAvailableError', 'Please indicate whether print-ready artwork is available.');
      }
      return setFieldError(null, 'designAvailableError', '');
    };

    const validateArtworkFile = () => {
      if (!artworkInput || !artworkInput.files || artworkInput.files.length === 0) {
        if (artworkFileInfo) {
          artworkFileInfo.textContent = 'No artwork file selected (Optional).';
        }
        return setFieldError(artworkInput, 'artworkUploadError', '');
      }

      const file = artworkInput.files[0];
      const fileNameLower = file.name.toLowerCase();
      const hasValidExt = ALLOWED_ARTWORK_EXTENSIONS.some((ext) => fileNameLower.endsWith(ext));

      if (!hasValidExt) {
        if (artworkFileInfo) artworkFileInfo.textContent = '';
        return setFieldError(
          artworkInput,
          'artworkUploadError',
          `Unsupported file format "${file.name}". Allowed formats: PDF, AI, EPS, PSD, CDR, PNG, JPG, WEBP, TIFF, SVG, ZIP.`
        );
      }

      if (file.size > MAX_ARTWORK_SIZE_BYTES) {
        if (artworkFileInfo) artworkFileInfo.textContent = '';
        return setFieldError(
          artworkInput,
          'artworkUploadError',
          `File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the 50 MB local validation limit.`
        );
      }

      if (artworkFileInfo) {
        const sizeLabel =
          file.size < 1024 * 1024
            ? `${(file.size / 1024).toFixed(1)} KB`
            : `${(file.size / (1024 * 1024)).toFixed(2)} MB`;
        artworkFileInfo.textContent = `Selected locally: ${file.name} (${sizeLabel}) — Validated in browser (not uploaded to a remote server in this frontend demo).`;
      }
      return setFieldError(artworkInput, 'artworkUploadError', '');
    };

    // Real-time validation listeners
    fullNameInput?.addEventListener('blur', validateFullName);
    phoneInput?.addEventListener('blur', validatePhone);
    emailInput?.addEventListener('blur', validateEmail);
    categorySelect?.addEventListener('change', validateCategory);
    printingSizeInput?.addEventListener('blur', validatePrintingSize);
    quantityInput?.addEventListener('blur', validateQuantity);
    requiredDateInput?.addEventListener('change', validateRequiredDate);
    form.querySelectorAll('input[name="designAvailable"]').forEach((radio) => {
      radio.addEventListener('change', validateDesignAvailable);
    });
    artworkInput?.addEventListener('change', validateArtworkFile);

    let lastSubmittedData = null;

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const checks = [
        validateFullName(),
        validatePhone(),
        validateEmail(),
        validateCategory(),
        validatePrintingSize(),
        validateQuantity(),
        validateRequiredDate(),
        validateDesignAvailable(),
        validateArtworkFile()
      ];

      const isAllValid = checks.every(Boolean);
      if (!isAllValid) {
        const firstInvalid = form.querySelector('[aria-invalid="true"], .field-error.is-visible');
        if (firstInvalid) {
          firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
          if (typeof firstInvalid.focus === 'function') {
            firstInvalid.focus();
          }
        }
        return;
      }

      const categoryLabel =
        categorySelect && categorySelect.selectedIndex > 0
          ? categorySelect.options[categorySelect.selectedIndex].text
          : categorySelect?.value || '';

      const checkedDesign = form.querySelector('input[name="designAvailable"]:checked');
      const selectedFile = artworkInput?.files?.[0] ? artworkInput.files[0].name : 'None attached';

      lastSubmittedData = {
        submittedAt: new Date().toISOString(),
        fullName: fullNameInput.value.trim(),
        phone: phoneInput.value.trim(),
        email: emailInput.value.trim(),
        productCategory: categorySelect.value.trim(),
        productCategoryLabel: categoryLabel,
        customProductName: (customProductInput?.value || '').trim() || categoryLabel,
        printingSize: printingSizeInput.value.trim(),
        materialPreference: (materialSelect?.value || 'Standard / Studio Recommended').trim(),
        quantity: quantityInput.value.trim(),
        requiredDate: requiredDateInput.value.trim(),
        designAvailable: checkedDesign ? checkedDesign.value : 'Yes',
        additionalRequirements: (additionalInput?.value || 'None specified').trim(),
        artworkFileName: selectedFile
      };

      // Save to localStorage demo history & clear active draft
      try {
        const existingRaw = localStorage.getItem(STORAGE_KEYS.enquiryHistory);
        const historyList = existingRaw ? JSON.parse(existingRaw) : [];
        historyList.unshift(lastSubmittedData);
        localStorage.setItem(STORAGE_KEYS.enquiryHistory, JSON.stringify(historyList.slice(0, 20)));
        localStorage.removeItem(STORAGE_KEYS.enquiryDraft);
      } catch {
        // Ignore storage errors
      }

      if (confirmationSummary) {
        confirmationSummary.innerHTML = `
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:0.75rem;margin-top:0.85rem;padding:1rem;background:#F2F4F7;border:1px solid #DDE2EA;border-radius:4px;font-size:0.9rem;">
            <div><strong>Customer:</strong> ${escapeHtml(lastSubmittedData.fullName)}</div>
            <div><strong>Phone:</strong> ${escapeHtml(lastSubmittedData.phone)}</div>
            <div><strong>Email:</strong> ${escapeHtml(lastSubmittedData.email)}</div>
            <div><strong>Product:</strong> ${escapeHtml(lastSubmittedData.customProductName)}</div>
            <div><strong>Dimensions:</strong> ${escapeHtml(lastSubmittedData.printingSize)}</div>
            <div><strong>Material:</strong> ${escapeHtml(lastSubmittedData.materialPreference)}</div>
            <div><strong>Quantity:</strong> ${escapeHtml(lastSubmittedData.quantity)} units</div>
            <div><strong>Required By:</strong> ${escapeHtml(lastSubmittedData.requiredDate)}</div>
            <div><strong>Design Ready:</strong> ${escapeHtml(lastSubmittedData.designAvailable)}</div>
            <div><strong>Local Artwork File:</strong> ${escapeHtml(lastSubmittedData.artworkFileName)}</div>
          </div>
        `;
      }

      if (confirmationBox) {
        confirmationBox.removeAttribute('hidden');
        confirmationBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });

    if (sendConfirmedWaBtn) {
      sendConfirmedWaBtn.addEventListener('click', () => {
        if (typeof window.__openPrintingWhatsApp === 'function') {
          window.__openPrintingWhatsApp(lastSubmittedData);
        }
      });
    }

    if (resetAfterSubmitBtn) {
      resetAfterSubmitBtn.addEventListener('click', () => {
        form.reset();
        if (artworkFileInfo) {
          artworkFileInfo.textContent = 'No artwork file selected (Optional).';
        }
        if (confirmationBox) {
          confirmationBox.setAttribute('hidden', 'hidden');
        }
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /* --------------------------------------------------------------------------
   * 8. SCROLL REVEAL & BACK-TO-TOP BUTTON
   * -------------------------------------------------------------------------- */
  function initScrollEffects() {
    const backToTopBtn = document.getElementById('backToTop');
    if (backToTopBtn) {
      const toggleBackToTop = () => {
        if (window.scrollY > 360) {
          backToTopBtn.classList.add('is-visible');
        } else {
          backToTopBtn.classList.remove('is-visible');
        }
      };
      window.addEventListener('scroll', toggleBackToTop, { passive: true });
      toggleBackToTop();

      backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    const revealElements = document.querySelectorAll('.reveal-on-scroll');
    if (!revealElements.length) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      revealElements.forEach((el) => el.classList.add('is-revealed'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    revealElements.forEach((el) => observer.observe(el));
    // 8.5 Interactive Square-Foot Print Area Estimator (home-2.html)
    const estWidth = document.getElementById('estWidth');
    const estHeight = document.getElementById('estHeight');
    const estQty = document.getElementById('estQty');
    const estCat = document.getElementById('estCategory');
    const estOutput = document.getElementById('estTotalArea');
    const estQuoteLink = document.getElementById('estQuoteBtn');

    if (estWidth && estHeight && estQty && estOutput && estQuoteLink) {
      const updateEstimate = () => {
        const w = Math.max(1, parseFloat(estWidth.value) || 1);
        const h = Math.max(1, parseFloat(estHeight.value) || 1);
        const q = Math.max(1, parseInt(estQty.value, 10) || 1);
        const cat = estCat ? estCat.value : 'flex-banners';
        const catLabel = estCat && estCat.selectedIndex >= 0 ? estCat.options[estCat.selectedIndex].text : 'Custom Print';
        const singleSqFt = w * h;
        const totalSqFt = (singleSqFt * q).toFixed(1).replace(/\.0$/, '');
        estOutput.textContent = `${totalSqFt} sq.ft (${w}×${h} ft × ${q})`;
        const sizeParam = `${w} ft x ${h} ft (${totalSqFt} sq.ft total)`;
        estQuoteLink.href = `contact.html?category=${encodeURIComponent(cat)}&product=${encodeURIComponent(catLabel)}&size=${encodeURIComponent(sizeParam)}#enquiry-form`;
      };
      [estWidth, estHeight, estQty, estCat].forEach((el) => {
        el?.addEventListener('input', updateEstimate);
        el?.addEventListener('change', updateEstimate);
      });
      updateEstimate();
    }
  }

  /* --------------------------------------------------------------------------
   * 9. INITIALIZE ALL MODULES ON DOM READY
   * -------------------------------------------------------------------------- */
  document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initProductFilters();
    initRateCard();
    initWhatsAppIntegration();
    initEnquiryForm();
    initScrollEffects();
  });
})();
